import { create, globals } from "webgpu";
import { computeShaderCode } from "./sha256Shader";

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

async function run(): Promise<void> {
  const device = await getDevice();

  // 2. prepare data - two messages: empty string and "abc"
  const messages = [
    "", // empty string
    "abc" // string "abc" = 0x616263
  ];

  console.log("Processing messages:");
  console.log("1. Empty string: \"\"");
  console.log("2. String \"abc\":", messages[1]);

  // Convert messages to 512-bit blocks (16 u32 words each)
  const messageBlocks: number[][] = [];
  
  for (const message of messages) {
    const block = new Array(16).fill(0);
    
    if (message.length > 0) {
      // Convert string to bytes and pack into 32-bit words
      const bytes = new TextEncoder().encode(message);
      const bitLength = bytes.length * 8;
      
      // Pack bytes into 32-bit words (little-endian)
      for (let i = 0; i < bytes.length; i += 4) {
        const wordIndex = Math.floor(i / 4);
        if (wordIndex < 14) { // Leave space for padding
          let word = 0;
          for (let j = 0; j < 4 && i + j < bytes.length; j++) {
            word |= bytes[i + j] << (j * 8);
          }
          block[wordIndex] = word;
        }
      }
      
      // Add padding bit
      if (bytes.length % 4 === 0) {
        block[Math.floor(bytes.length / 4)] = 0x80000000;
      } else {
        block[Math.floor(bytes.length / 4)] |= 0x80 << ((bytes.length % 4) * 8);
      }
      
      // Add message length in bits (64 bits) at the end
      block[14] = 0; // Upper 32 bits of length (0 for our short messages)
      block[15] = bitLength; // Lower 32 bits of length
    } else {
      // Empty string: just padding bit and length
      block[0] = 0x80000000; // Padding bit
      block[15] = 0; // Length in bits
    }
    
    messageBlocks.push(block);
  }

  console.log("Message blocks:");
  for (let i = 0; i < messageBlocks.length; i++) {
    console.log(`Block ${i}:`, messageBlocks[i].map(x => "0x" + x.toString(16).padStart(8, '0')));
  }

  // Flatten the blocks into a single array
  const inputData = messageBlocks.flat();
  const inputBuffer = new Uint32Array(inputData);
  const byteLength = inputBuffer.byteLength;

  const storage = device.createBuffer({
    size: byteLength,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
    mappedAtCreation: true,
  });
  new Uint32Array(storage.getMappedRange()).set(inputBuffer);
  storage.unmap();

  // Output buffer for 2 hashes, each with 8 u32 words
  const outputSize = 2 * 8 * 4; // 2 messages * 8 words * 4 bytes per word
  
  // Storage buffer for shader output
  const outputBuffer = device.createBuffer({
    size: outputSize,
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
  pass.dispatchWorkgroups(2); // Process 2 messages
  pass.end();
  
  // Copy from output buffer to readback buffer
  encoder.copyBufferToBuffer(outputBuffer, 0, readback, 0, outputSize);
  
  device.queue.submit([encoder.finish()]);

  // 5. read & log
  await readback.mapAsync(GPUMapMode.READ);
  const result = new Uint32Array(readback.getMappedRange());
  
  // Print results
  console.log("\nSHA-256 Results:");
  for (let i = 0; i < 2; i++) {
    const hashStart = i * 8;
    const hash = Array.from(result.slice(hashStart, hashStart + 8));
    const hashHex = hash.map(x => "0x" + x.toString(16).padStart(8, '0')).join(' ');
    console.log(`Hash ${i + 1} (${messages[i] ? `"${messages[i]}"` : 'empty string'}):`);
    console.log(`  ${hashHex}`);
  }
  
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
