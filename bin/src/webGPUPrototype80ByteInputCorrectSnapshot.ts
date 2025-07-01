import { create, globals } from "webgpu";
import { computeShaderCode } from "./dsha256Shader80ByteInputMultiNonce";

// 1. expose WebGPU globals in Node
Object.assign(globalThis, globals);

interface Navigator {
  gpu: GPU | undefined;
}

const navigator: Navigator = {
  // Metal = native backend on Apple silicon
  gpu: create(["backend=metal"]),   // or ["adapter=Apple M3 Pro"] to pin a GPU
};

console.log("navigator", navigator);
console.log("navigator.gpu", navigator.gpu);

async function getDevice(): Promise<GPUDevice> {
  const adapter = await navigator.gpu?.requestAdapter({ powerPreference: "high-performance" });

  console.log("adapter", adapter);
  if (!adapter) throw new Error("No suitable GPU adapter");

  const device = await adapter.requestDevice();
  //   console.log("device", device);
  return device;
}

export function serializeNonceLE(nonce: number): Uint8Array {
  return new Uint8Array([
    nonce & 0xff,
    (nonce >> 8) & 0xff,
    (nonce >> 16) & 0xff,
    (nonce >> 24) & 0xff
  ]);
}

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

async function run(): Promise<void> {
  const device = await getDevice();

  // 2. prepare data - two messages: empty string and "abc"
  // https://www.di-mgt.com.au/sha_testvectors.html
  //   const messages = [
  //     "", // empty string
  //     "abc", // string "abc" = 0x616263
  //     "hello",
  //     "abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq", // 448 bits // wrong
  //     "abcdefghbcdefghicdefghijdefghijkefghijklfghijklmghijklmnhijklmnoijklmnopjklmnopqklmnopqrlmnopqrsmnopqrstnopqrstu", // 896 bits // wrong
  //     "", // empty string
  //     "", // empty string
  //   ];

  const blockHeaderAsU8Array = new Uint8Array(80); // 80 bytes for block header
//   blockHeaderAsU8Array[0] = 1;
  // blockHeaderAsU8Array.set(serializeNonceLE(1), 0);
  // const nonce = 0;
  const nonce = 12345;
  blockHeaderAsU8Array.set(serializeNonceLE(nonce), 76);
  console.log("blockHeaderAsU8Array", blockHeaderAsU8Array);
  console.log("blockHeaderAsU8Array.length", blockHeaderAsU8Array.length);

  // Flatten the blocks into a single array
  const inputData = blockHeaderAsU8Array;
  //   console.log("inputData", inputData);
  // should be doubleSha256BlockHeaderU8Array: blockHeaderAsU8Array Uint8Array(80) [
  //   0, 0, 0, 0,  0,  0, 0, 0, 0, 0, 0, 0,
  //   0, 0, 0, 0,  0,  0, 0, 0, 0, 0, 0, 0,
  //   0, 0, 0, 0,  0,  0, 0, 0, 0, 0, 0, 0,
  //   0, 0, 0, 0,  0,  0, 0, 0, 0, 0, 0, 0,
  //   0, 0, 0, 0,  0,  0, 0, 0, 0, 0, 0, 0,
  //   0, 0, 0, 0,  0,  0, 0, 0, 0, 0, 0, 0,
  //   0, 0, 0, 0, 57, 48, 0, 0
  // ]
  //   const inputBuffer = new Uint32Array(inputData);
  const byteLength = inputData.byteLength;
  //   const alignedByteLength = Math.ceil(byteLength / 256) * 256; // Align to 256 bytes for storage buffers

  // console.log(`Input buffer: ${byteLength} bytes, aligned to ${alignedByteLength} bytes`);
  console.log(`Input buffer: ${byteLength} bytes`);
  console.log(`Input data length: ${inputData.length} bytes`);

  const storage = device.createBuffer({
    size: byteLength,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
    mappedAtCreation: true,
  });

  // Option 1: Convert Uint8Array to Uint32Array for proper storage
  //   const uint32Data = new Uint32Array(byteLength / 4); // 80 bytes = 20 u32 words
  //   const dataView = new DataView(inputData.buffer, inputData.byteOffset, inputData.byteLength);

  //   for (let i = 0; i < uint32Data.length; i++) {
  //     uint32Data[i] = dataView.getUint32(i * 4, true); // true for little-endian
  //   }

  //   new Uint32Array(storage.getMappedRange()).set(uint32Data);

  // Option 2: Alternative - use Uint8Array view directly
  new Uint8Array(storage.getMappedRange()).set(inputData);

  storage.unmap();

  // Output buffer for all hashes (messages.length), each with 8 u32 words
  const outputSize = 1 * 8 * 4; // 1 message * 8 words * 4 bytes per word

  // Storage buffer for shader output - ensure proper alignment
  const alignedOutputSize = Math.ceil(outputSize / 256) * 256; // Align to 256 bytes for storage buffers

  console.log(`Output buffer: ${outputSize} bytes, aligned to ${alignedOutputSize} bytes`);
  console.log(`Expected output: 1 hash, 8 u32 words total`);

  const outputBuffer = device.createBuffer({
    size: alignedOutputSize,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
  });

  // Readback buffer for CPU access
  const readback = device.createBuffer({
    size: outputSize,
    usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
  });

  // 3. WGSL shader
  const shader = device.createShaderModule({
    code: computeShaderCode,
  });

  const pipeline = device.createComputePipeline({
    layout: "auto",
    compute: { module: shader, entryPoint: "main" },
  });

  const bind = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: storage } },
      { binding: 1, resource: { buffer: outputBuffer } }
    ],
  });

  // 4. record commands
  const encoder = device.createCommandEncoder();
  const pass = encoder.beginComputePass();
  pass.setPipeline(pipeline);
  pass.setBindGroup(0, bind);
  pass.dispatchWorkgroups(1);
  pass.end();

  // Copy from output buffer to readback buffer
  encoder.copyBufferToBuffer(outputBuffer, 0, readback, 0, outputSize);

  device.queue.submit([encoder.finish()]);

  // 5. read & log
  await readback.mapAsync(GPUMapMode.READ);
  const uint32ArrayResult = new Uint32Array(readback.getMappedRange());
  console.log("Uint32Array result", uint32ArrayResult);

  // Print each u32 in hex
  for (let i = 0; i < uint32ArrayResult.length; i++) {
    console.log(`u32[${i}] = ${uint32ArrayResult[i].toString(16).padStart(8, '0')}`);
  }

  // U8 view of result
  const resultU8 = toBigEndianBytes(uint32ArrayResult);
  console.log("resultU8", resultU8);

  // Reverse the u8 array
  const reversedResultU8 = new Uint8Array(resultU8.length);
  for (let i = 0; i < resultU8.length; i++) {
    reversedResultU8[i] = resultU8[resultU8.length - i - 1];
  }
  console.log("reversedResultU8", reversedResultU8);

  // Convert to hex for easier comparison
  const resultHex = Array.from(reversedResultU8)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  console.log("resultHex", resultHex);

  // Print results
  console.log("\nSHA-256 Results:");
  const hashStart = 0 * 8;
  const hash = Array.from(uint32ArrayResult.slice(hashStart, hashStart + 8));
  const hashHex = hash.map(x => "0x" + x.toString(16).padStart(8, '0')).join(' ');
  console.log(`Hash 1 (block header with nonce):`);
  console.log(`  ${hashHex}`);

  readback.unmap();

  // 6. Cleanup all WebGPU resources
  console.log("\nStarting cleanup...");

  // Destroy buffers
  storage.destroy();
  outputBuffer.destroy();
  readback.destroy();

  // Destroy device (this will clean up all associated resources)
  device.destroy();

  // Small delay to ensure GPU resources are fully released
  await new Promise(resolve => setTimeout(resolve, 100));
  console.log("Cleanup completed");
  console.log("end of run()");
}

export async function webGPUPrototypeMain() {
  console.log("webGPUPrototypeMain()");

  try {
    await run();
  } catch (error) {
    console.error("Error in webGPUPrototypeMain:", error);
  } finally {
    // Needed otherwise Node hangs.
    delete navigator.gpu;
    console.log("end of webGPUPrototypeMain()");
    // Remove global reference so Node can exit cleanly
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    //   delete globalThis.navigator.gpu;
    //   console.log("deleted globalThis.navigator.gpu");
  }
}
