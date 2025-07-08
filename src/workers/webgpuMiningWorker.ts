/// <reference types="@webgpu/types" />
import { HashSolution, MiningChallenge, MiningSolution } from "@/types/mining";
import { serializeNonceLE, serializeNoncelessBlockHeader } from "@/types/websocket";
import { calculateLeadingZeroesFromHexString } from "@/utils/mining";
import { nonceToU8ArrayBE } from "@/utils/nonceUtils";
import { WorkerMessage } from "./WorkerPool";
import { dsha256Shader80ByteInput } from "./webgpuShader";
import { GPUCapabilities } from "@/contexts/mining/types";

// 2025-07-05: runs about about 180k to 205k hashes per second
// 2025-07-05: Up to 12.7Mh/s after atomic counter optimization!
// 2025-07-05: up to 15.4MH/s with 24 leading zeros after cleaning up a bunch of extraneous logging
// 2025-07-05: after a warmup, and caching the input data better, goes up to 16.1MH/s
// 2025-07-06: caching the shader and pipeline we are up to 22MH/s
// 2025-07-06: limiting the readback buffer size to 50 results, we are up to 25.5MH/s
// Optimizations:
// [x] use atomics to only send back hashes/nonces that meet the target difficulty
// [ ] don't destroy the buffers every mining loop
// [ ] try to increase workgroup size / count
// [ ] clean up Output struct from extraneous fields
// [ ] queue up dispatches
// [ ] increase time when nonceOffset overflows
// [ ] etc.

let running = false;
let hashCount = 0;
let startTime = performance.now();
let miningSpeed = 100;
let cumulativeHashes = 0;
const HASH_RATE_UPDATE_INTERVAL = 1000;

let maybeGPUDevice: GPUDevice | null = null;
let maybeGPUComputePipeline: GPUComputePipeline | null = null;
let maybeCurrentChallenge: MiningChallenge | null = null;
let maybeGPUInitSuccessResult: GPUInitSuccessResult | null = null;

let blockHeaderAsU8Array: Uint8Array | null = null;
const blockHeaderByteSize = 80;
const nonceOffsetByteSize = 4;
const targetMinimumLeadingZeroesByteSize = 4;
const inputByteLength = blockHeaderByteSize + nonceOffsetByteSize + targetMinimumLeadingZeroesByteSize;

// Need to consider max buffer size because got this warning/error:
// Buffer size (603979776) exceeds the max buffer size limit (268435456). This adapter supports a higher maxBufferSize of 4294967296, which can be specified in requiredLimits when calling requestDevice(). Limits differ by hardware, so always check the adapter limits prior to requesting a higher limit.
//  - While calling [Device].CreateBuffer([BufferDescriptor]).
const mainWorkgroupSizeX = 256; // align with the shader in main()
// TODO: investigate if it is faster to distribute this 256 among the y and z axes
const workgroupCountX = 256;
const workgroupCountY = 1; // If 2, does not work; get all zeroes result after 65k'th result
const workgroupCountZ = 1; // If 2, does not work; get all zeroes result after 65k'th result
const outputStructCount = workgroupCountX * workgroupCountY * workgroupCountZ * mainWorkgroupSizeX;
const hashBatchSize = outputStructCount;

const outputStructU32Size =
8 // hash
 + 1 // nonce
 + 3 // globalIdX, globalIdY, globalIdZ
 + 1 // nonceOffset
 + 3 // workgroup_count_x, workgroup_count_y, workgroup_count_z
 + 1 // local_invocation_index
 + 3 // local_invocation_id_x, local_invocation_id_y, local_invocation_id_z
 + 3 // workgroup_id_x, workgroup_id_y, workgroup_id_z
 ;
// console.log("peterlog: outputStructU32Size", outputStructU32Size);
const outputStructByteSize = outputStructU32Size * 4; // output struct size in bytes; 4 bytes per u32

// Output buffer for all hashes (messages.length), each with 8 u32 words
const allOutputSize = outputStructCount * outputStructByteSize; // 1 message * 8 words * 4 bytes per word

// Storage buffer for shader output - ensure proper alignment
const alignedOutputSize = Math.ceil(allOutputSize / 256) * 256; // Align to 256 bytes for storage buffers

// Maps to shader Input struct:
// struct Input {
//   header: array<u32, 20>,
//   nonceOffset: u32,
//   targetMinimumLeadingZeroes: u32
// }
interface Input {
  header: Uint32Array;
  nonceOffset: number;
  targetMinimumLeadingZeroes: number;
}

// Maps to shader Output struct:
// struct Output {
//   hash: array<u32, 8>,
// //   header: array<u32, 20>,
//   nonce: u32,
//   globalIdX: u32,
//   globalIdY: u32,
//   globalIdZ: u32,
//   nonceOffset: u32,
//   workgroup_count_x: u32,
//   workgroup_count_y: u32,
//   workgroup_count_z: u32,
//   local_invocation_index: u32,
//   local_invocation_id_x: u32,
//   local_invocation_id_y: u32,
//   local_invocation_id_z: u32,
//   workgroup_id_x: u32,
//   workgroup_id_y: u32,
//   workgroup_id_z: u32
// }
interface OutputStruct {
  hash: Uint32Array;
  nonce: number;
  globalIdX: number;
  globalIdY: number;
  globalIdZ: number;
  nonceOffset: number;
  workgroup_count_x: number;
  workgroup_count_y: number;
  workgroup_count_z: number;
  local_invocation_index: number;
  local_invocation_id_x: number;
  local_invocation_id_y: number;
  local_invocation_id_z: number;
  workgroup_id_x: number;
  workgroup_id_y: number;
  workgroup_id_z: number;
}

function outputStructToString(outputStruct: OutputStruct): string {
  return `
  hash: ${outputStruct.hash}
  nonce: ${outputStruct.nonce}
  globalIdX: ${outputStruct.globalIdX}
  globalIdY: ${outputStruct.globalIdY}
  globalIdZ: ${outputStruct.globalIdZ}
  nonceOffset: ${outputStruct.nonceOffset}
  workgroup_count_x: ${outputStruct.workgroup_count_x}
  workgroup_count_y: ${outputStruct.workgroup_count_y}
  workgroup_count_z: ${outputStruct.workgroup_count_z}
  local_invocation_index: ${outputStruct.local_invocation_index}
  local_invocation_id_x: ${outputStruct.local_invocation_id_x}
  local_invocation_id_y: ${outputStruct.local_invocation_id_y}
  local_invocation_id_z: ${outputStruct.local_invocation_id_z}
  workgroup_id_x: ${outputStruct.workgroup_id_x}
  workgroup_id_y: ${outputStruct.workgroup_id_y}
  workgroup_id_z: ${outputStruct.workgroup_id_z}
  `;
}

function outputStructFromUint32Array(uint32Array: Uint32Array<ArrayBuffer>, startIndex: number): OutputStruct {
  const hashU32Words = uint32Array.slice(startIndex, startIndex + 8);
  const nonceU32 = uint32Array[startIndex + 8];
  const globalIdX = uint32Array[startIndex + 9];
  const globalIdY = uint32Array[startIndex + 10];
  const globalIdZ = uint32Array[startIndex + 11];
  const nonceOffset = uint32Array[startIndex + 12];
  const workgroup_count_x = uint32Array[startIndex + 13];
  const workgroup_count_y = uint32Array[startIndex + 14];
  const workgroup_count_z = uint32Array[startIndex + 15];
  const local_invocation_index = uint32Array[startIndex + 16];
  const local_invocation_id_x = uint32Array[startIndex + 17];
  const local_invocation_id_y = uint32Array[startIndex + 18];
  const local_invocation_id_z = uint32Array[startIndex + 19];
  const workgroup_id_x = uint32Array[startIndex + 20];
  const workgroup_id_y = uint32Array[startIndex + 21];
  const workgroup_id_z = uint32Array[startIndex + 22];
  return {
    hash: hashU32Words,
    nonce: nonceU32,
    globalIdX: globalIdX,
    globalIdY: globalIdY,
    globalIdZ: globalIdZ,
    nonceOffset: nonceOffset,
    workgroup_count_x: workgroup_count_x,
    workgroup_count_y: workgroup_count_y,
    workgroup_count_z: workgroup_count_z,
    local_invocation_index: local_invocation_index,
    local_invocation_id_x: local_invocation_id_x,
    local_invocation_id_y: local_invocation_id_y,
    local_invocation_id_z: local_invocation_id_z,
    workgroup_id_x: workgroup_id_x,
    workgroup_id_y: workgroup_id_y,
    workgroup_id_z: workgroup_id_z,
  };
}

// Example hash of height 881375; 20 hex zeros so that's 80 leading binary zeros
// 000000000000000000009d4cbb3b19f5ba5aa1e0cfb47974ffb182f57953864b

function formatBytes(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let value = bytes;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }

  return `${value.toFixed(2)} ${units[unitIndex]}`;
}

function formatNumber(num: number): string {
  return new Intl.NumberFormat().format(num);
}

interface GPUInitSuccessResult {
  maxBufferSize: number;
  maxComputeWorkgroupsPerDimension: number;
  // GPUDevice: GPUDevice; // use state for now; TODO: use this
  // GPUAdapter: GPUAdapter;
}

// Throws if it fails to initWebGPU
async function initWebGPU(): Promise<GPUInitSuccessResult> {
  console.log("peterlog: gpuminingworker: initWebGPU; maybeGPUInitSuccessResult", maybeGPUInitSuccessResult);
  if (maybeGPUInitSuccessResult) {
    console.log("peterlog: gpuminingworker: initWebGPU; Using cached GPU init success result");
    return maybeGPUInitSuccessResult;
  }
  console.log("peterlog: gpuminingworker: initWebGPU; maybeGPUInitSuccessResult is null");

  if (!navigator.gpu) {
    throw new Error("WebGPU not supported");
  }
  console.log("peterlog: gpuminingworker: initWebGPU; navigator.gpu", navigator.gpu);

  const adapter = await navigator.gpu.requestAdapter();
  if (!adapter) {
    throw new Error("No appropriate GPUAdapter found");
  }
  console.log("peterlog: gpuminingworker: initWebGPU; adapter", adapter);

  // Get all relevant device limits
  const {
    maxStorageBufferBindingSize,
    maxComputeWorkgroupsPerDimension,
    maxComputeWorkgroupSizeX,
    maxComputeWorkgroupSizeY,
    maxComputeWorkgroupSizeZ,
    maxComputeInvocationsPerWorkgroup,
    maxTextureDimension2D
  } = adapter.limits;

  // Send GPU capabilities to UI
  console.log("peterlog: gpuminingworker: initWebGPU; sending gpu capabilities to UI");
  const gpuCapabilities: GPUCapabilities = {
    maxStorageBufferSize: formatBytes(maxStorageBufferBindingSize),
    maxWorkgroupsPerDimension: formatNumber(maxComputeWorkgroupsPerDimension),
    maxWorkgroupSize: {
      x: formatNumber(maxComputeWorkgroupSizeX),
      y: formatNumber(maxComputeWorkgroupSizeY),
      z: formatNumber(maxComputeWorkgroupSizeZ)
    },
    maxInvocationsPerWorkgroup: formatNumber(maxComputeInvocationsPerWorkgroup),
    maxTextureDimension2D: formatNumber(maxTextureDimension2D),
    adapterInfo: adapter.toString(),
    // limits: adapter.limits // Cannot be cloned from the worker side
    gpuAdapterInfo: {
      vendor: adapter.info.vendor,
      architecture: adapter.info.architecture,
      device: adapter.info.device,
      description: adapter.info.description
    }
  }
  self.postMessage({
    type: "gpuCapabilities",
    data: gpuCapabilities
  });

  const device = await adapter.requestDevice({
    requiredLimits: {
      maxStorageBufferBindingSize,
      maxComputeWorkgroupsPerDimension
    }
  });

  console.log("peterlog: gpuminingworker: initWebGPU; device", device);

  // Create compute pipeline
  const shaderModule = device.createShaderModule({
    code: dsha256Shader80ByteInput,
  });
  console.log("peterlog: gpuminingworker: initWebGPU; shaderModule", shaderModule);

  maybeGPUComputePipeline = await device.createComputePipelineAsync({
    layout: 'auto',
    compute: {
      module: shaderModule,
      entryPoint: 'main',
    },
  });
  console.log("peterlog: gpuminingworker: initWebGPU; maybeGPUComputePipeline", maybeGPUComputePipeline);
  maybeGPUInitSuccessResult = {
    maxBufferSize: maxStorageBufferBindingSize,
    maxComputeWorkgroupsPerDimension,
    // GPUDevice: device,
    // GPUAdapter: adapter
  };

  console.log("peterlog: gpuminingworker: initWebGPU; maybeGPUInitSuccessResult", maybeGPUInitSuccessResult);
  maybeGPUDevice = device;

  return maybeGPUInitSuccessResult;
}

// TODO: audit
function updateHashRate(batchSize: number) {
  const currentTime = performance.now();
  const elapsedTime = currentTime - startTime;

  if (elapsedTime >= HASH_RATE_UPDATE_INTERVAL) {
    const hashesPerSecond = (hashCount * 1000) / elapsedTime;
    self.postMessage({ type: "hashRate", data: hashesPerSecond });
    hashCount = 0;
    startTime = currentTime;
  }

  hashCount += batchSize;
}

function createInputU8Array(blockHeaderAsU8Array: Uint8Array, nonceOffset: number, targetMinimumLeadingZeroes: number): Uint8Array {
  const inputDataU8Array = new Uint8Array(inputByteLength);
  inputDataU8Array.set(blockHeaderAsU8Array);
  const nonceOffsetU32Array = new Uint32Array([nonceOffset]);
  const nonceOffsetAsU8Array = new Uint8Array(nonceOffsetU32Array.buffer); // convert to u8 array to set in inputDataU8Array; otherwise the inputDataU8Array.set silently fails
  inputDataU8Array.set(nonceOffsetAsU8Array, blockHeaderAsU8Array.length);
  const targetMinimumLeadingZeroesU32Array = new Uint32Array([targetMinimumLeadingZeroes]);
  const targetMinimumLeadingZeroesAsU8Array = new Uint8Array(targetMinimumLeadingZeroesU32Array); // convert to u8 array to set in inputDataU8Array; otherwise the inputDataU8Array.set silently fails
  inputDataU8Array.set(targetMinimumLeadingZeroesAsU8Array, blockHeaderAsU8Array.length + nonceOffsetAsU8Array.length);
  // console.log("peterlog: inputDataU8Array", inputDataU8Array);
  return inputDataU8Array;
}

// Doing this only when the mining challenge changes instead of every mining loop saves about 1MH/s
// Depends on maybeCurrentChallenge
function setGlobalInputData() {
  if (!maybeCurrentChallenge) return;

  // const blockHeaderAsU8Array = new Uint8Array(80); // 80 bytes for block header
  blockHeaderAsU8Array = serializeNoncelessBlockHeader(maybeCurrentChallenge.noncelessBlockHeader, 0); // gpu will generate nonce

  // const nonce = 12345;
  // blockHeaderAsU8Array.set(serializeNonceLE(nonce), 76);
  console.log("blockHeaderAsU8Array", blockHeaderAsU8Array);
  console.log("blockHeaderAsU8Array.length", blockHeaderAsU8Array.length);

  // Flatten the blocks into a single array
  // const inputData = blockHeaderAsU8Array;

  console.log(`blockHeaderAsU8Array length: ${blockHeaderAsU8Array.length} bytes`);
}

async function mine() {
  console.log("peterlog: gpuminingworker: mine; maybeGPUDevice", maybeGPUDevice);
  console.log("peterlog: gpuminingworker: mine; maybeGPUComputePipeline", maybeGPUComputePipeline);
  console.log("peterlog: gpuminingworker: mine; maybeCurrentChallenge", maybeCurrentChallenge);
  if (!maybeGPUDevice || !maybeGPUComputePipeline || !maybeCurrentChallenge) return;

  let maxBufferSize: number;
  let maxComputeWorkgroupsPerDimension: number;
  try {
    const initWebGPUResult = await initWebGPU();
    maxBufferSize = initWebGPUResult.maxBufferSize;
    maxComputeWorkgroupsPerDimension = initWebGPUResult.maxComputeWorkgroupsPerDimension;
  } catch (error) {
    console.error('Mining error: failed to initWebGPU', error);
    self.postMessage({ type: "error", data: error.message });
    running = false;
    return;
  }

  console.log(`maxBufferSize: ${maxBufferSize}, maxComputeWorkgroupsPerDimension: ${maxComputeWorkgroupsPerDimension}`);
  const device = maybeGPUDevice;

  let nonceOffset = 0;
  const nonceSet = new Set<number>();

  // WGSL shader
  const shader = device.createShaderModule({
    code: dsha256Shader80ByteInput,
  });

  // TODO: use maybeGPUComputePipeline
  const computePipeline = device.createComputePipeline({
    layout: "auto",
    compute: { module: shader, entryPoint: "main" },
  });

  const miningLoop = async () => {
    if (!running || !maybeGPUDevice || !maybeGPUComputePipeline || !maybeCurrentChallenge) return;

    // const batchSize = WORKGROUP_SIZE * NUM_WORKGROUPS;
    // TODO: audit
    const sleepTime = Math.floor((100 - miningSpeed) * 15); // Increased sleep multiplier from 10 to 15

    try {
      const inputBuffer = device.createBuffer({
        size: inputByteLength,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
        mappedAtCreation: true,
      });

      const targetMinimumLeadingZeroes = maybeCurrentChallenge.targetZeros;
      const inputDataU8Array = createInputU8Array(blockHeaderAsU8Array, nonceOffset, targetMinimumLeadingZeroes);

      new Uint8Array(inputBuffer.getMappedRange()).set(inputDataU8Array);

      // Do we need to unmap and create every time?
      inputBuffer.unmap();

      // console.log(`Output buffer: ${allOutputSize} bytes, aligned to ${alignedOutputSize} bytes`);

      const outputBuffer = device.createBuffer({
        size: alignedOutputSize,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
      });

      const counterGPUBuffer = makeGPUBuffer(device, 4, GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST);

      // zero the counter before each dispatch
      device.queue.writeBuffer(counterGPUBuffer, 0, new Uint32Array([0]));

      // Always 0ms
      // console.log(`Time taken to create output buffer: ${afterOutputBufferTime - beforeOutputBufferTime}ms`);

      const gpuBindGroup = device.createBindGroup({
        layout: computePipeline.getBindGroupLayout(0),
        entries: [
          { binding: 0, resource: { buffer: inputBuffer } },
          { binding: 1, resource: { buffer: outputBuffer } },
          { binding: 2, resource: { buffer: counterGPUBuffer } }
        ],
      });

      // 4. record commands
      const beforePassTime = Date.now();
      const computeCommandEncoder = device.createCommandEncoder();
      const computePassEncoder = computeCommandEncoder.beginComputePass();
      computePassEncoder.setPipeline(computePipeline);
      computePassEncoder.setBindGroup(0, gpuBindGroup);
      computePassEncoder.dispatchWorkgroups(workgroupCountX, workgroupCountY, workgroupCountZ);
      computePassEncoder.end();

      const afterPassTime = Date.now();
      // Always 0ms
      // console.log(`Time taken to dispatch workgroups: ${afterPassTime - beforePassTime}ms`);

      // Use much smaller size for readback buffer
      const readbackBufferByteSize = 50 * outputStructByteSize; // Assume max of 50 results
      // Readback buffer for CPU access
      const readbackBuffer = device.createBuffer({
        size: readbackBufferByteSize,
        usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
      });

      // Copy from output buffer to readback buffer
      computeCommandEncoder.copyBufferToBuffer(outputBuffer, 0, readbackBuffer, 0, readbackBufferByteSize);
      // Always 0ms
      // console.log(`Time taken to copy output buffer to readback buffer: ${afterCopyTime - beforeCopyTime}ms`);

      // const resultCountArray = new Uint32Array(await readBuffer(device, counterGPUBuffer, 4)); // 1 element
      const counterByteSize = 4;
      const readCounterBuffer = makeGPUBuffer(device, counterByteSize, GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ);
      computeCommandEncoder.copyBufferToBuffer(counterGPUBuffer, 0, readCounterBuffer, 0, counterByteSize);

      device.queue.submit([computeCommandEncoder.finish()]);

      await readCounterBuffer.mapAsync(GPUMapMode.READ);
      const counterCopyBuffer = readCounterBuffer.getMappedRange().slice(0);
      readCounterBuffer.unmap();

      const resultCountArray = new Uint32Array(counterCopyBuffer);
      const resultCount = resultCountArray[0];

      // Always 0ms
      // console.log(`Time taken to submit command buffer: ${afterSubmitTime - beforeSubmitTime}ms`);

      // console.log("peterlog: gpuminingworker: mine; resultCount", resultCount);
      if (resultCount === 0) {
        // console.log("peterlog: gpuminingworker: mine; no valid solutions found");
        // TODO: go to next nonceOffset and inc hash rate
        // return;
      }

      await readbackBuffer.mapAsync(GPUMapMode.READ);
      // Sampled at 40-50ms with 65k nonces; so roughly 1.6MH/s
      // console.log(`Time taken to map readback buffer: ${afterMapTime - beforeMapTime}ms`);

      const uint32ArrayResult = new Uint32Array(readbackBuffer.getMappedRange());
      // console.log("Uint32Array result", uint32ArrayResult);
      // console.log("uint32ArrayResult.length", uint32ArrayResult.length);

      // Process the extracted hash words
      // console.log("peterlog: gpuminingworker: mine; hashCount", outputStructCount);
      // console.log("peterlog: gpuminingworker: mine; resultCount", resultCount);
      let stopMiningLeft = 0;
      for (let outputStructIndex = 0; outputStructIndex < resultCount; outputStructIndex++) {
        const outputStructStartIndex = outputStructIndex * outputStructU32Size;
        const outputStruct = outputStructFromUint32Array(uint32ArrayResult, outputStructStartIndex);
        const hashU32Words = outputStruct.hash;
        const nonceU32 = outputStruct.nonce;
        const globalIdX = outputStruct.globalIdX;
        const globalIdY = outputStruct.globalIdY;
        const globalIdZ = outputStruct.globalIdZ;
        const outputNonceOffset = outputStruct.nonceOffset;

        const hashWordsU8FromLittleEndian = convertUint32ArrayToUint8ArrayLittleEndianToBigEndian(hashU32Words);

        const hashStringFromLittleEndian = Array.from(hashWordsU8FromLittleEndian)
          .map(word => word.toString(16).padStart(2, '0'))
          .join('');

        const hashStringFromLittleEndianReversed = hashStringFromLittleEndian.match(/.{1,2}/g).reverse().join(''); // split every 2 chars, reverse, join
        const { leadingBinaryZeroes } = calculateLeadingZeroesFromHexString(hashStringFromLittleEndianReversed);

        if (nonceSet.has(nonceU32)) {
          // stopMining = true;
          if(stopMiningLeft === 0) {
            stopMiningLeft = 5;
          }
          // sample: Mining error: Error: peterlog: gpuminingworker: mine; nonce already seen; nonceU32 0, hashIndex 65536, skipping
          console.log("peterlog: nonceOffset", nonceOffset);
          console.log("peterlog: outputNonceOffset", outputNonceOffset);
          console.log("peterlog: globalIdX", globalIdX);
          console.log("peterlog: globalIdY", globalIdY);
          console.log("peterlog: globalIdZ", globalIdZ);
          console.log(`peterlog: gpuminingworker: mine; nonce already seen; nonceU32 ${nonceU32}, hashIndex ${outputStructIndex}, hashCount ${outputStructCount}, skipping`);
          console.log("hashStringFromLittleEndian", hashStringFromLittleEndian);
          console.log("hashStringFromLittleEndianReversed", hashStringFromLittleEndianReversed);
          console.error("peterlog: outputStruct", outputStructToString(outputStruct));
          console.error(`peterlog: gpuminingworker: mine; nonce already seen; nonceU32 ${nonceU32}, hashIndex ${outputStructIndex}, hashCount ${outputStructCount}, skipping`)
          // throw new Error(`peterlog: gpuminingworker: mine; nonce already seen; nonceU32 ${nonceU32}, hashIndex ${outputStructIndex}, hashCount ${outputStructCount}, skipping`);
        }
        nonceSet.add(nonceU32);

        ////// TEMP

        // const shouldLog = Math.log2(outputStructIndex) % 1 === 0 || Math.log2(outputStructIndex - 1) % 1 === 0 || Math.log2(outputStructIndex + 1) % 1 === 0;
        // if(shouldLog) {
        //   console.log("peterlog: outputStructIndex", outputStructIndex);
        //   console.log("peterlog: outputStruct", outputStructToString(outputStruct));
        // }

        // if(stopMiningLeft > 0) {
        //   stopMiningLeft--;
        //   console.log("peterlog: stopMiningLeft", stopMiningLeft);
        //   console.log("peterlog: outputStructIndex", outputStructIndex);
        //   console.log("peterlog: outputStruct", outputStructToString(outputStruct));
        // }
        // if(stopMiningLeft === 1) {
        //   console.log("peterlog: stopMiningLeft is 1; stopping mining");
        //   throw new Error("peterlog: stopMiningLeft is 1; stopping mining");
        // }

        // console.log("peterlog: nonceOffset", nonceOffset);
        // console.log("peterlog: outputNonceOffset", outputNonceOffset);
        // console.log("peterlog: globalIdX", globalIdX);
        // console.log("peterlog: globalIdY", globalIdY);
        // console.log("peterlog: globalIdZ", globalIdZ);
        // console.log(`peterlog: gpuminingworker: mine; nonce already seen; nonceU32 ${nonceU32}, hashIndex ${outputStructIndex}, hashCount ${outputStructCount}, skipping`);
        // console.log("hashStringFromLittleEndian", hashStringFromLittleEndian);

        /////// TEMP

        if (leadingBinaryZeroes >= maybeCurrentChallenge.targetZeros) {
          console.log("hashU32Words", hashU32Words);

          // Calculate the nonce for this solution
          // TODO: audit
          // const solutionNonce = hashIndex;
          const solutionNonce = nonceU32;
          console.log(`Found solution with nonce ${solutionNonce}`);
          console.log(`Found solution with leadingBinaryZeroes: ${leadingBinaryZeroes}; targetZeros: ${maybeCurrentChallenge.targetZeros}`);
          console.log(`hashStringFromLittleEndian: ${hashStringFromLittleEndian}`);
          console.log(`hashStringFromLittleEndianReversed: ${hashStringFromLittleEndianReversed}`);
          // console.log(`hashStringFromBigEndian: ${hashStringFromBigEndian}`);
          // console.log(`hashStringFromLittleEndianReversed: ${hashStringFromLittleEndianReversed}`);
          console.log(`leadingBinaryZeroes: ${leadingBinaryZeroes}`);
          console.log(`maybeCurrentChallenge.targetZeros: ${maybeCurrentChallenge.targetZeros}`);
          const noncedBlockHeader = serializeNoncelessBlockHeader(maybeCurrentChallenge.noncelessBlockHeader, solutionNonce);
          // const nonceVecU8 = serializeNonceLE(solutionNonce);
          // noncedBlockHeader.set(nonceVecU8, 76);
          console.log("blockHeaderWithNonce", noncedBlockHeader);
          const blockHeaderAsHex = Array.from(noncedBlockHeader)
            .map(byte => byte.toString(16).padStart(2, '0'))
            .join('');
          console.log("blockHeaderAsHex", blockHeaderAsHex);

          const solution: MiningSolution = {
            hash: hashStringFromLittleEndianReversed,
            nonceVecU8: serializeNonceLE(solutionNonce),
            noncelessBlockHeader: maybeCurrentChallenge.noncelessBlockHeader,
            cumulativeHashes: cumulativeHashes
          };
          self.postMessage({
            type: "hash",
            data: solution
          });
          cumulativeHashes = 0; // Reset after sending
        }

      } // looping through hashes loop

      // console.log("peterlog: gpuminingworker: mine; nonceSet.size", nonceSet.size);
      nonceOffset += outputStructCount;
      // console.log("peterlog: gpuminingworker: mine; nonceOffset updated to", nonceOffset);
      const maxU32 = 4294967295; // 2^32 - 1
      // Gets here after about 4.5 minutes of mining
      if (nonceOffset >= maxU32) {
        console.log("peterlog: gpuminingworker: mine; nonceOffset >= maxU32; resetting");
        nonceOffset = 0;
        addOneSecondToMiningChallenge(maybeCurrentChallenge);
      }

      // 6. Cleanup all WebGPU resources
      // console.log("\nStarting cleanup...");

      // Destroy buffers
      inputBuffer.destroy();
      outputBuffer.destroy();
      readbackBuffer.destroy();

      // Destroy device (this will clean up all associated resources)
      // device.destroy();

      updateHashRate(hashBatchSize);
      cumulativeHashes += hashBatchSize;

      if (sleepTime > 0) {
        await new Promise(resolve => setTimeout(resolve, sleepTime));
      }

      // Use setTimeout instead of requestAnimationFrame for more consistent timing
      setTimeout(() => miningLoop(), 0);
      // TODO: Increase time when nonceOffset is exhausted
    } catch (error) {
      console.error('Mining error:', error);
      self.postMessage({ type: "error", data: error.message });
      running = false;
    }
  };

  miningLoop();
}

// // FIXME: remove
// const overrideTargetZeros = 26;

self.onmessage = async (e: MessageEvent<WorkerMessage>) => {
  const { type, maybeChallenge: challenge, maybeMiningSpeed: newSpeed, maybeNewDifficulty } = e.data;
  console.log("peterlog: gpuminingworker: onmessage", e.data);

  if (type === "start" && challenge) {
    try {
      running = false;
      hashCount = 0;
      startTime = performance.now();

      if (!maybeGPUDevice || !maybeGPUComputePipeline) {
        try {
          await initWebGPU();
        } catch (error) {
          // when using workgroup_size(256, 2)
          //  Failed to initWebGPU: GPUPipelineError: The total number of workgroup invocations (512) exceeds the maximum allowed (256). This adapter supports a higher maxComputeInvocationsPerWorkgroup of 1024, which can be specified in requiredLimits when calling requestDevice(). Limits differ by hardware, so always check the adapter limits prior to requesting a higher limit.

          console.error('Failed to initWebGPU:', error);
          self.postMessage({ type: "error", data: `Failed to initialize WebGPU: ${error.message}; navigator.gpu: ${navigator.gpu}` });
          running = false;
          return;
        }
      }

      miningSpeed = newSpeed ?? 100;
      running = true;
      maybeCurrentChallenge = challenge;
      // maybeCurrentChallenge.targetZeros = overrideTargetZeros;
      setGlobalInputData();
      mine();
      self.postMessage({ type: "started" });
    } catch (error) {
      console.error('Failed to start mining:', error);
      self.postMessage({
        type: "error",
        data: `Failed to start mining: ${error.message}`
      });
      // FIXME: if there is an error in the above and we catch, the mining controls still shows "mining" even if we send this message
      // self.postMessage({ type: "stopped" });
      running = false;
    }
  } else if (type === "stop") {
    running = false;
    maybeCurrentChallenge = null;
    self.postMessage({ type: "stopped" });
  } else if (type === "updateSpeed") {
    miningSpeed = newSpeed ?? 100;
  } else if (type === "updateChallenge" && challenge) {
    maybeCurrentChallenge = challenge;
    // maybeCurrentChallenge.targetZeros = overrideTargetZeros;
    setGlobalInputData();
    // No need to restart mining, the loop will pick up the new challenge
  } else if (type === "updateDifficulty" && maybeNewDifficulty) {
    maybeCurrentChallenge.targetZeros = maybeNewDifficulty;
    setGlobalInputData();
  } else {
    console.error(`Unknown message type: ${type}, data: ${JSON.stringify(e.data)}`);
  }
};

function convertUint32ArrayToUint8ArrayLittleEndianToBigEndian(u32Array: Uint32Array): Uint8Array {
  const out = new Uint8Array(u32Array.length * 4);
  for (let i = 0; i < u32Array.length; i++) {
    const u32Val = u32Array[i];
    out[i * 4 + 0] = (u32Val >>> 24) & 0xFF; // Most significant byte
    out[i * 4 + 1] = (u32Val >>> 16) & 0xFF;
    out[i * 4 + 2] = (u32Val >>> 8) & 0xFF;
    out[i * 4 + 3] = u32Val & 0xFF;          // Least significant byte
  }
  return out;
}

// function convertUint32ArrayToUint8ArrayBigEndianToBigEndian(u32Array: Uint32Array): Uint8Array {
//   const out = new Uint8Array(u32Array.length * 4);
//   for (let i = 0; i < u32Array.length; i++) {
//     const u32Val = u32Array[i];
//     out[i * 4 + 0] = (u32Val >>> 0) & 0xFF; // Most significant byte
//     out[i * 4 + 1] = (u32Val >>> 8) & 0xFF;
//     out[i * 4 + 2] = (u32Val >>> 16) & 0xFF;
//     out[i * 4 + 3] = (u32Val >>> 24) & 0xFF;          // Least significant byte
//     // out[i * 4 + 0] = u32Val & 0xFF000000; // Most significant byte
//     // out[i * 4 + 1] = u32Val & 0x00FF0000;
//     // out[i * 4 + 2] = u32Val & 0x0000FF00;
//     // out[i * 4 + 3] = u32Val & 0x000000FF;          // Least significant byte
//   }
//   return out;
// }

// https://chatgpt.com/c/6866ab6b-b9a0-8002-b2a5-c6a9a57ad8e6
function makeGPUBuffer(
  device: GPUDevice,
  dataOrByteSize: ArrayBufferView | number,
  usage: GPUBufferUsageFlags
): GPUBuffer {
  const byteSize = typeof dataOrByteSize === 'number' ? dataOrByteSize : dataOrByteSize.byteLength;
  const gpuBuffer  = device.createBuffer({ size: byteSize, usage, mappedAtCreation: !!(dataOrByteSize instanceof Uint8Array) });
  if (dataOrByteSize instanceof Uint8Array) {
    new Uint8Array(gpuBuffer.getMappedRange()).set(new Uint8Array(dataOrByteSize.buffer, dataOrByteSize.byteOffset, dataOrByteSize.byteLength));
    gpuBuffer.unmap();
  }
  return gpuBuffer;
}

// https://chatgpt.com/c/6866ab6b-b9a0-8002-b2a5-c6a9a57ad8e6
// Try not to use this because doing another command encoder seems to be slower.
// async function readBuffer(
//   device: GPUDevice,
//   gpuBuffer: GPUBuffer,
//   byteSize: number
// ): Promise<ArrayBuffer> {
//   const readGPUBuffer = makeGPUBuffer(device, byteSize, GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ);
//   const commandEncoder  = device.createCommandEncoder();
//   commandEncoder.copyBufferToBuffer(gpuBuffer, 0, readGPUBuffer, 0, byteSize);
//   device.queue.submit([commandEncoder.finish()]);
//   await readGPUBuffer.mapAsync(GPUMapMode.READ);
//   const copyBuffer = readGPUBuffer.getMappedRange().slice(0);
//   readGPUBuffer.unmap();
//   return copyBuffer;
// }

// TODO: move these to utils
// https://chatgpt.com/c/686c0791-db1c-8002-9f07-09fce6f8b257

// ────────────────────────────────────────────────────────────────────────────
// Constants & tiny helpers
// ────────────────────────────────────────────────────────────────────────────
const BLOCK_HEADER_LEN   = 80;   // bytes
const TIMESTAMP_OFFSET   = 68;   // first byte of the 4-byte field
const TIMESTAMP_FIELD_SZ = 4;    // bytes

/** Quick LE 32-bit read that keeps nesting shallow. */
function readUint32LE(buf: Uint8Array, offset: number): number {
  return (
    (buf[offset]      ) |
    (buf[offset + 1] <<  8) |
    (buf[offset + 2] << 16) |
    (buf[offset + 3] << 24)
  ) >>> 0;  // convert to unsigned 32-bit
}

/** Guard helper so errors happen early and clearly. */
function ensureHeaderIsComplete(header: Uint8Array): void {
  if (header.length < BLOCK_HEADER_LEN) {
    throw new RangeError(
      `Block header too short: expected ${BLOCK_HEADER_LEN} bytes, got ${header.length}`,
    );
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Public API
// ────────────────────────────────────────────────────────────────────────────

/**
 * Extracts the 4-byte little-endian UNIX timestamp from a Bitcoin block header.
 * @returns Seconds since 1970-01-01 UTC.
 */
function extractTimeFromBlockHeader(header: Uint8Array): number {
  // ensureHeaderIsComplete(header);
  return readUint32LE(header, TIMESTAMP_OFFSET);
}

/**
 * Convenience wrapper that returns a JavaScript Date in the local runtime TZ.
 */
function extractDateFromBlockHeader(header: Uint8Array): Date {
  const seconds = extractTimeFromBlockHeader(header);
  return new Date(seconds * 1_000); // JS Date expects milliseconds
}

function writeUint32LE(buf: Uint8Array, offset: number, value: number): void {
  // value is treated modulo 2^32 so wrap-around is automatic.
  buf[offset    ] =  value         & 0xff;
  buf[offset + 1] = (value >>>  8) & 0xff;
  buf[offset + 2] = (value >>> 16) & 0xff;
  buf[offset + 3] = (value >>> 24) & 0xff;
}

/**
 * Adds one second to the in-header UNIX timestamp **in place**.
 * Side-effect only; returns nothing.
 */
function addOneSecondToBlockHeader(header: Uint8Array): void {
  // ensureHeaderIsComplete(header);

  const current = readUint32LE(header, TIMESTAMP_OFFSET);
  const updated = (current + 1) >>> 0;        // wrap on 2³² overflow
  writeUint32LE(header, TIMESTAMP_OFFSET, updated);
}

// ────────────────────────────────────────────────────────────────────────────
// Tiny helpers
// ────────────────────────────────────────────────────────────────────────────
const TIMESTAMP_HEX_LEN = 8; // 4 bytes  × 2 hex chars

/** Validate & strip leading “0x” if present. */
function normalizeHex(str: string): { hex: string; keepPrefix: boolean } {
  const keepPrefix = str.startsWith("0x") || str.startsWith("0X");
  const hex = keepPrefix ? str.slice(2) : str;

  if (hex.length !== TIMESTAMP_HEX_LEN || /[^0-9a-f]/i.test(hex)) {
    throw new RangeError(
      `Timestamp hex must be exactly ${TIMESTAMP_HEX_LEN} hex chars` +
        ` (optionally prefixed with 0x). Got “${str}”.`,
    );
  }
  return { hex: hex.toLowerCase(), keepPrefix };
}

/** Assemble a 32-bit unsigned integer from 4 little-endian bytes. */
function leBytesToUint32(b0: number, b1: number, b2: number, b3: number): number {
  return (b0 | (b1 << 8) | (b2 << 16) | (b3 << 24)) >>> 0;
}

/** Split a uint32 into little-endian bytes and return an 8-char hex string. */
function uint32ToLeHex(u32: number): string {
  const bytes = [
    (u32 >>> 0) & 0xff,
    (u32 >>> 8) & 0xff,
    (u32 >>> 16) & 0xff,
    (u32 >>> 24) & 0xff,
  ];
  return bytes.map(b => b.toString(16).padStart(2, "0")).join("");
}

// ────────────────────────────────────────────────────────────────────────────
// Public API
// ────────────────────────────────────────────────────────────────────────────

/**
 * Reads the UNIX-epoch seconds from an 8-hex-char little-endian timestamp.
 */
export function readTimeFromTimestampHexString(tsHex: string): number {
  const { hex } = normalizeHex(tsHex);

  const b0 = parseInt(hex.slice(0, 2), 16);
  const b1 = parseInt(hex.slice(2, 4), 16);
  const b2 = parseInt(hex.slice(4, 6), 16);
  const b3 = parseInt(hex.slice(6, 8), 16);

  return leBytesToUint32(b0, b1, b2, b3);
}

/**
 * Same as above but returned as a JavaScript `Date` (local TZ).
 */
export function readDateFromTimestampHexString(tsHex: string): Date {
  return new Date(readTimeFromTimestampHexString(tsHex) * 1_000);
}

/**
 * Adds exactly one second and returns **a new** hex string in the
 * same little-endian layout.  If the input had a “0x” prefix, the
 * output keeps it; otherwise it does not.
 */
export function addOneSecondToTimestampHexString(tsHex: string): string {
  const { hex, keepPrefix } = normalizeHex(tsHex);
  const current = readTimeFromTimestampHexString(hex);
  const updated = (current + 1) >>> 0; // wrap at 2³²

  const out = uint32ToLeHex(updated);
  return keepPrefix ? "0x" + out : out;
}

function addOneSecondToMiningChallenge(challenge: MiningChallenge): void {
  challenge.noncelessBlockHeader.timestamp_hex = addOneSecondToTimestampHexString(challenge.noncelessBlockHeader.timestamp_hex);
  setGlobalInputData();
}
