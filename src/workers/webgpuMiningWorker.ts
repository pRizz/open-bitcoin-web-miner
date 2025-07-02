/// <reference types="@webgpu/types" />
import { HashSolution, MiningChallenge, MiningSolution } from "@/types/mining";
import { serializeNonceLE, serializeNoncelessBlockHeader } from "@/types/websocket";
import { calculateLeadingZeroesFromHexString } from "@/utils/mining";
import { nonceToU8ArrayBE } from "@/utils/nonceUtils";
import { dsha256Shader80ByteInput } from "./webgpuShader";

let running = false;
let hashCount = 0;
let startTime = performance.now();
let miningSpeed = 100;
let cumulativeHashes = 0;
const HASH_RATE_UPDATE_INTERVAL = 1000;

const maybeGPUDevice: GPUDevice | null = null;
let maybeGPUComputePipeline: GPUComputePipeline | null = null;
let maybeCurrentChallenge: MiningChallenge | null = null;
let maybeGPUInitSuccessResult: GPUInitSuccessResult | null = null;

interface WorkerMessage {
  type: 'start' | 'stop' | 'updateSpeed' | 'updateChallenge';
  maybeChallenge?: MiningChallenge;
  maybeMiningSpeed?: number;
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

async function initWebGPU(): Promise<GPUInitSuccessResult> {
  if (maybeGPUInitSuccessResult) {
    console.log("Using cached GPU init success result");
    return maybeGPUInitSuccessResult;
  }

  if (!navigator.gpu) {
    throw new Error("WebGPU not supported");
  }

  const adapter = await navigator.gpu.requestAdapter();
  if (!adapter) {
    throw new Error("No appropriate GPUAdapter found");
  }

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
  self.postMessage({
    type: "gpuCapabilities",
    data: {
      maxStorageBufferSize: formatBytes(maxStorageBufferBindingSize),
      maxWorkgroupsPerDimension: formatNumber(maxComputeWorkgroupsPerDimension),
      maxWorkgroupSize: {
        x: formatNumber(maxComputeWorkgroupSizeX),
        y: formatNumber(maxComputeWorkgroupSizeY),
        z: formatNumber(maxComputeWorkgroupSizeZ)
      },
      maxInvocationsPerWorkgroup: formatNumber(maxComputeInvocationsPerWorkgroup),
      maxTextureDimension2D: formatNumber(maxTextureDimension2D),
      adapterInfo: adapter.toString()
    }
  });

  const device = await adapter.requestDevice({
    requiredLimits: {
      maxStorageBufferBindingSize,
      maxComputeWorkgroupsPerDimension
    }
  });

  // Create compute pipeline
  const shaderModule = device.createShaderModule({
    code: dsha256Shader80ByteInput,
  });

  maybeGPUComputePipeline = await device.createComputePipelineAsync({
    layout: 'auto',
    compute: {
      module: shaderModule,
      entryPoint: 'main',
    },
  });

  maybeGPUInitSuccessResult = {
    maxBufferSize: maxStorageBufferBindingSize,
    maxComputeWorkgroupsPerDimension,
    // GPUDevice: device,
    // GPUAdapter: adapter
  };

  return maybeGPUInitSuccessResult;
}

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

async function mine() {
  if (!maybeGPUDevice || !maybeGPUComputePipeline || !maybeCurrentChallenge) return;

  const { maxBufferSize, maxComputeWorkgroupsPerDimension } = await initWebGPU();
  console.log(`maxBufferSize: ${maxBufferSize}, maxComputeWorkgroupsPerDimension: ${maxComputeWorkgroupsPerDimension}`);

  // Calculate optimal batch size based on available memory
  // Each hash needs: 4 bytes (input) + 32 bytes (output) = 36 bytes ?
  // Leave 25% memory free for other operations
  // Also ensure we don't exceed the maximum buffer size of 16MB (reduced from 32MB)
  // const MAX_BUFFER_SIZE = 16 * 1024 * 1024; // 16MB in bytes
  // const effectiveMaxBufferSize = Math.min(maxBufferSize * 0.75, MAX_BUFFER_SIZE);
  // const maxHashes = Math.floor(effectiveMaxBufferSize / 36);

  // Ensure we don't exceed workgroup limits
  // const WORKGROUP_SIZE = 256;  // Keep at 256 as it's optimal for most GPUs
  // const MAX_WORKGROUPS = Math.min(
  //   maxComputeWorkgroupsPerDimension,
  //   Math.floor(maxHashes / WORKGROUP_SIZE)
  // );

  // Calculate number of workgroups to stay within buffer limits
  // Target around 8MB of GPU memory usage (reduced from 16MB)
  // const TARGET_MEMORY_USAGE = 8 * 1024 * 1024; // 8MB in bytes
  // const NUM_WORKGROUPS = Math.min(
  //   MAX_WORKGROUPS,
  //   Math.floor(TARGET_MEMORY_USAGE / (36 * WORKGROUP_SIZE))
  // );

  // const NUM_WORKGROUPS = 65536; // 2^16
  // console.log(`Running with ${NUM_WORKGROUPS} workgroups, processing ${NUM_WORKGROUPS * WORKGROUP_SIZE} hashes in parallel`);

  // let nonce = Math.floor(Math.random() * 0xFFFFFFFF);
  // Nonce will be generated by the shader id

  // const blockHeaderAsU8Array = new Uint8Array(80); // 80 bytes for block header
  const blockHeaderAsU8Array = serializeNoncelessBlockHeader(maybeCurrentChallenge.noncelessBlockHeader, 0); // gpu will generate nonce

  // const nonce = 12345;
  // blockHeaderAsU8Array.set(serializeNonceLE(nonce), 76);
  console.log("blockHeaderAsU8Array", blockHeaderAsU8Array);
  console.log("blockHeaderAsU8Array.length", blockHeaderAsU8Array.length);

  // Flatten the blocks into a single array
  const inputData = blockHeaderAsU8Array;
  const inputByteLength = inputData.byteLength;

  console.log(`Input buffer: ${inputByteLength} bytes`);
  console.log(`Input data length: ${inputData.length} bytes`);

  const device = maybeGPUDevice;

  // Small delay to ensure GPU resources are fully released
  // await new Promise(resolve => setTimeout(resolve, 100));
  // console.log("Cleanup completed");
  // console.log("end of run()");

  // FIXME: increase time in header between mining loops

  const miningLoop = async () => {
    if (!running || !maybeGPUDevice || !maybeGPUComputePipeline || !maybeCurrentChallenge) return;

    // const batchSize = WORKGROUP_SIZE * NUM_WORKGROUPS;
    const sleepTime = Math.floor((100 - miningSpeed) * 15); // Increased sleep multiplier from 10 to 15

    try {

      const inputBuffer = device.createBuffer({
        size: inputByteLength,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
        mappedAtCreation: true,
      });

      new Uint8Array(inputBuffer.getMappedRange()).set(inputData);

      inputBuffer.unmap();

      const workgroupSizeX = 256;
      const workgroupSizeY = 256; // 256*256 = 65536 = 2^16
      const workgroupSizeZ = 1; // If 2, does not work; get all zeroes result
      const messageCount = workgroupSizeX * workgroupSizeY * workgroupSizeZ;
      const hashBatchSize = messageCount;

      // Output buffer for all hashes (messages.length), each with 8 u32 words
      const outputSize = messageCount * 8 * 4; // 1 message * 8 words * 4 bytes per word

      // Storage buffer for shader output - ensure proper alignment
      const alignedOutputSize = Math.ceil(outputSize / 256) * 256; // Align to 256 bytes for storage buffers

      console.log(`Output buffer: ${outputSize} bytes, aligned to ${alignedOutputSize} bytes`);
      console.log(`Expected output: 1 hash, 8 u32 words total`);

      const beforeOutputBufferTime = Date.now();

      const outputBuffer = device.createBuffer({
        size: alignedOutputSize,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
      });

      const afterOutputBufferTime = Date.now();
      console.log(`Time taken to create output buffer: ${afterOutputBufferTime - beforeOutputBufferTime}ms`);

      // Readback buffer for CPU access
      const readbackBuffer = device.createBuffer({
        size: outputSize,
        usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
      });

      // 3. WGSL shader
      const shader = device.createShaderModule({
        code: dsha256Shader80ByteInput,
      });

      // TODO: use maybeGPUComputePipeline
      const computePipeline = device.createComputePipeline({
        layout: "auto",
        compute: { module: shader, entryPoint: "main" },
      });

      const gpuBindGroup = device.createBindGroup({
        layout: computePipeline.getBindGroupLayout(0),
        entries: [
          { binding: 0, resource: { buffer: inputBuffer } },
          { binding: 1, resource: { buffer: outputBuffer } }
        ],
      });

      // 4. record commands
      const beforePassTime = Date.now();
      const commandEncoder = device.createCommandEncoder();
      const computePassEncoder = commandEncoder.beginComputePass();
      computePassEncoder.setPipeline(computePipeline);
      computePassEncoder.setBindGroup(0, gpuBindGroup);
      computePassEncoder.dispatchWorkgroups(workgroupSizeX, workgroupSizeY, workgroupSizeZ);
      computePassEncoder.end();

      const afterPassTime = Date.now();
      console.log(`Time taken to dispatch workgroups: ${afterPassTime - beforePassTime}ms`);

      // Copy from output buffer to readback buffer
      const beforeCopyTime = Date.now();
      commandEncoder.copyBufferToBuffer(outputBuffer, 0, readbackBuffer, 0, outputSize);
      const afterCopyTime = Date.now();
      console.log(`Time taken to copy output buffer to readback buffer: ${afterCopyTime - beforeCopyTime}ms`);

      const beforeSubmitTime = Date.now();
      device.queue.submit([commandEncoder.finish()]);

      const afterSubmitTime = Date.now();
      console.log(`Time taken to submit command buffer: ${afterSubmitTime - beforeSubmitTime}ms`);

      // 5. read & log
      const beforeMapTime = Date.now();
      await readbackBuffer.mapAsync(GPUMapMode.READ);
      const afterMapTime = Date.now();
      // Sampled at 40-50ms with 65k nonces; so roughly 1.6MH/s
      console.log(`Time taken to map readback buffer: ${afterMapTime - beforeMapTime}ms`);

      const uint32ArrayResult = new Uint32Array(readbackBuffer.getMappedRange());
      console.log("Uint32Array result", uint32ArrayResult);
      console.log("uint32ArrayResult.length", uint32ArrayResult.length);

      // Print each u32 in hex
      // for (let i = 0; i < uint32ArrayResult.length; i++) {
      //   console.log(`u32[${i}] = ${uint32ArrayResult[i].toString(16).padStart(8, '0')}`);
      // }

      // U8 view of result
      const resultU8 = toBigEndianBytes(uint32ArrayResult);
      console.log("resultU8", resultU8);

      // Reverse the u8 array
      // TODO: do this in the shader
      const reversedResultU8 = new Uint8Array(resultU8.length);
      for (let i = 0; i < resultU8.length; i++) {
        reversedResultU8[i] = resultU8[resultU8.length - i - 1];
      }
      console.log("reversedResultU8", reversedResultU8);

      // Convert to hex for easier comparison
      // const resultHex = Array.from(reversedResultU8)
      //   .map(b => b.toString(16).padStart(2, '0'))
      //   .join('');
      // console.log("resultHex", resultHex);

      // Print results
      // console.log("\nSHA-256 Results (count: " + messageCount + "):");
      // for (let i = 0; i < messageCount; i++) {
      //   const hashStart = i * 8;
      //   const hash = Array.from(uint32ArrayResult.slice(hashStart, hashStart + 8));
      //   const hashHex = hash.map(x => "0x" + x.toString(16).padStart(8, '0')).join(' ');
      //   console.log(`Hash ${i} (block header with nonce):`);
      //   console.log(`  ${hashHex}`);
      // }

      readbackBuffer.unmap();

      for (let i = 0; i < messageCount; i++) {
        const hashStart = i * 8;
        const hashWords = Array.from(uint32ArrayResult.slice(hashStart, hashStart + 8));
        // FIXME: might need to reverse the words; check endianness; read as u8 instead of u32

        // const hashHex = hash.map(x => "0x" + x.toString(16).padStart(8, '0')).join(' ');
        // console.log(`Hash ${i} (block header with nonce):`);
        // console.log(`  ${hashHex}`);

        const hashString = Array.from(hashWords)
          .map(word => word.toString(16).padStart(8, '0'))
          .join('');

        const { leadingBinaryZeroes } = calculateLeadingZeroesFromHexString(hashString);

        if (leadingBinaryZeroes >= maybeCurrentChallenge.targetZeros) {
        // Calculate the nonce for this solution
        // TODO: audit
          const solutionNonce = i;
          console.log(`Found solution with nonce ${solutionNonce}`);

          const solution: MiningSolution = {
            hash: hashString,
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
      }

      // for (let offset = 0; offset < batchSize; offset += CHUNK_SIZE) {
      //   const chunkSize = Math.min(CHUNK_SIZE, batchSize - offset);
      //   const chunkStart = offset * 8 * 4;
      //   const chunkEnd = (offset + chunkSize) * 8 * 4;

      //   // Contains a series of 256 hashes, which must be read in chunks of 8 32-bit words each.
      //   const resultsChunk = new Uint32Array(mappedRange.slice(chunkStart, chunkEnd));

      //   // Process results for this chunk
      //   for (let i = 0; i < chunkSize; i++) {
      //     const hashWords = Array.from(resultsChunk.slice(i * 8, (i + 1) * 8))
      //       .map(word => word.toString(16).padStart(8, '0'))
      //       .join('');

      //     const { leadingBinaryZeroes } = calculateLeadingZeroesFromHexString(hashWords);

      //     if (leadingBinaryZeroes >= maybeCurrentChallenge.targetZeros) {
      //       // Calculate the nonce for this solution
      //       // TODO: audit
      //       const solutionNonce = nonce[0] - batchSize + offset + i;

      //       const solution: MiningSolution = {
      //         hash: hashWords,
      //         nonceVecU8: serializeNonceLE(solutionNonce),
      //         noncelessBlockHeader: maybeCurrentChallenge.noncelessBlockHeader,
      //         cumulativeHashes: cumulativeHashes
      //       };
      //       self.postMessage({
      //         type: "hash",
      //         data: solution
      //       });
      //       cumulativeHashes = 0; // Reset after sending
      //     }
      //   }
      // }

      // Cleanup
      // readBuffer.unmap();
      // inputBuffer.destroy();
      // outputBuffer.destroy();
      // readBuffer.destroy();

      // 6. Cleanup all WebGPU resources
      console.log("\nStarting cleanup...");

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
    } catch (error) {
      console.error('Mining error:', error);
      self.postMessage({ type: "error", data: error.message });
      running = false;
    }
  };

  miningLoop();
}

self.onmessage = async (e: MessageEvent<WorkerMessage>) => {
  const { type, maybeChallenge: challenge, maybeMiningSpeed: newSpeed } = e.data;

  if (type === "start" && challenge) {
    try {
      running = false;
      hashCount = 0;
      startTime = performance.now();

      if (!maybeGPUDevice || !maybeGPUComputePipeline) {
        await initWebGPU();
      }

      miningSpeed = newSpeed ?? 100;
      running = true;
      maybeCurrentChallenge = challenge;
      mine();
      self.postMessage({ type: "started" });
    } catch (error) {
      console.error('Failed to start mining:', error);
      self.postMessage({
        type: "error",
        data: `Failed to start mining: ${error.message}`
      });
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
    // No need to restart mining, the loop will pick up the new challenge
  }
};

function toBigEndianBytes(u32Array: Uint32Array): Uint8Array {
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
