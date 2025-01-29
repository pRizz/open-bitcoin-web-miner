/// <reference types="@webgpu/types" />
import { HashSolution } from "@/types/mining";
import { calculateLeadingZeroes } from "@/utils/mining";

let running = false;
let hashCount = 0;
let startTime = performance.now();
let miningSpeed = 100;
const HASH_RATE_UPDATE_INTERVAL = 1000;

let device: GPUDevice | null = null;
let pipeline: GPUComputePipeline | null = null;

// Example hash of height 881375; 20 hex zeros so that's 80 leading binary zeros
// 000000000000000000009d4cbb3b19f5ba5aa1e0cfb47974ffb182f57953864b

// FIXME: getting an error:
// [Invalid ShaderModule (unlabeled)] is invalid.
//  - While validating compute stage ([Invalid ShaderModule (unlabeled)], entryPoint: "main").

const computeShaderCode = `
struct Output {
  hash: array<u32, 8>
}

@group(0) @binding(0) var<storage, read> input: array<u32>;
@group(0) @binding(1) var<storage, read_write> output: array<Output>;

const K: array<u32, 64> = array(
    0x428a2f98u, 0x71374491u, 0xb5c0fbcfu, 0xe9b5dba5u,
    0x3956c25bu, 0x59f111f1u, 0x923f82a4u, 0xab1c5ed5u,
    0xd807aa98u, 0x12835b01u, 0x243185beu, 0x550c7dc3u,
    0x72be5d74u, 0x80deb1feu, 0x9bdc06a7u, 0xc19bf174u,
    0xe49b69c1u, 0xefbe4786u, 0x0fc19dc6u, 0x240ca1ccu,
    0x2de92c6fu, 0x4a7484aau, 0x5cb0a9dcu, 0x76f988dau,
    0x983e5152u, 0xa831c66du, 0xb00327c8u, 0xbf597fc7u,
    0xc6e00bf3u, 0xd5a79147u, 0x06ca6351u, 0x14292967u,
    0x27b70a85u, 0x2e1b2138u, 0x4d2c6dfcu, 0x53380d13u,
    0x650a7354u, 0x766a0abbu, 0x81c2c92eu, 0x92722c85u,
    0xa2bfe8a1u, 0xa81a664bu, 0xc24b8b70u, 0xc76c51a3u,
    0xd192e819u, 0xd6990624u, 0xf40e3585u, 0x106aa070u,
    0x19a4c116u, 0x1e376c08u, 0x2748774cu, 0x34b0bcb5u,
    0x391c0cb3u, 0x4ed8aa4au, 0x5b9cca4fu, 0x682e6ff3u,
    0x748f82eeu, 0x78a5636fu, 0x84c87814u, 0x8cc70208u,
    0x90befffau, 0xa4506cebu, 0xbef9a3f7u, 0xc67178f2u
);

fn rotr(x: u32, n: u32) -> u32 {
    return (x >> n) | (x << (32u - n));
}

fn ch(x: u32, y: u32, z: u32) -> u32 {
    return (x & y) ^ (~x & z);
}

fn maj(x: u32, y: u32, z: u32) -> u32 {
    return (x & y) ^ (x & z) ^ (y & z);
}

fn sigma0(x: u32) -> u32 {
    return rotr(x, 2u) ^ rotr(x, 13u) ^ rotr(x, 22u);
}

fn sigma1(x: u32) -> u32 {
    return rotr(x, 6u) ^ rotr(x, 11u) ^ rotr(x, 25u);
}

fn gamma0(x: u32) -> u32 {
    return rotr(x, 7u) ^ rotr(x, 18u) ^ (x >> 3u);
}

fn gamma1(x: u32) -> u32 {
    return rotr(x, 17u) ^ rotr(x, 19u) ^ (x >> 10u);
}

@compute @workgroup_size(256)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let index = global_id.x;
    
    var state: array<u32, 8>;
    // Initialize state with standard SHA-256 initial values
    state[0] = 0x6a09e667u;
    state[1] = 0xbb67ae85u;
    state[2] = 0x3c6ef372u;
    state[3] = 0xa54ff53au;
    state[4] = 0x510e527fu;
    state[5] = 0x9b05688cu;
    state[6] = 0x1f83d9abu;
    state[7] = 0x5be0cd19u;
    
    // Create message schedule array
    var w: array<u32, 64>;
    
    // First 16 words are the padded message
    // In our case, we're just hashing the nonce, so most values are 0
    w[0] = input[index]; // The nonce
    for (var t = 1u; t < 16u; t++) {
        w[t] = 0u;
    }
    // Set padding and length
    w[1] = 0x80000000u; // Padding bit
    w[15] = 32u;        // Message length (32 bits)
    
    // Extend the first 16 words into the remaining 48 words
    for (var t = 16u; t < 64u; t++) {
        let t2 = w[t - 2u];
        let t7 = w[t - 7u];
        let t15 = w[t - 15u];
        let t16 = w[t - 16u];
        w[t] = gamma1(t2) + t7 + gamma0(t15) + t16;
    }
    
    // Initialize working variables
    var a = state[0];
    var b = state[1];
    var c = state[2];
    var d = state[3];
    var e = state[4];
    var f = state[5];
    var g = state[6];
    var h = state[7];
    
    // Main loop
    for (var t = 0u; t < 64u; t++) {
        let t1 = h + sigma1(e) + ch(e, f, g) + K[t] + w[t];
        let t2 = sigma0(a) + maj(a, b, c);
        
        h = g;
        g = f;
        f = e;
        e = d + t1;
        d = c;
        c = b;
        b = a;
        a = t1 + t2;
    }
    
    // Add the compressed chunk to the current hash value
    state[0] = state[0] + a;
    state[1] = state[1] + b;
    state[2] = state[2] + c;
    state[3] = state[3] + d;
    state[4] = state[4] + e;
    state[5] = state[5] + f;
    state[6] = state[6] + g;
    state[7] = state[7] + h;
    
    // Store all 8 words of the hash
    output[index].hash[0] = state[0];
    output[index].hash[1] = state[1];
    output[index].hash[2] = state[2];
    output[index].hash[3] = state[3];
    output[index].hash[4] = state[4];
    output[index].hash[5] = state[5];
    output[index].hash[6] = state[6];
    output[index].hash[7] = state[7];
}`;

async function initWebGPU() {
  if (!navigator.gpu) {
    throw new Error("WebGPU not supported");
  }

  const adapter = await navigator.gpu.requestAdapter();
  if (!adapter) {
    throw new Error("No appropriate GPUAdapter found");
  }

  device = await adapter.requestDevice();
  
  // Create compute pipeline
  const shaderModule = device.createShaderModule({
    code: computeShaderCode,
  });

  pipeline = await device.createComputePipelineAsync({
    layout: 'auto',
    compute: {
      module: shaderModule,
      entryPoint: 'main',
    },
  });
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

async function mine(blockHeader: Partial<HashSolution>) {
  if (!device || !pipeline) return;

  let nonce = Math.floor(Math.random() * 0xFFFFFFFF);
  
  const miningLoop = async () => {
    if (!running || !device || !pipeline) return;

    const batchSize = 256; // WebGPU workgroup size
    const sleepTime = Math.floor((100 - miningSpeed) * 10);

    // Create input buffer (unchanged)
    const inputBuffer = device.createBuffer({
      size: batchSize * 4,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });

    // Create output buffer for the structured output
    const outputBuffer = device.createBuffer({
      // Each Output struct has an array of 8 u32s
      // So each thread needs 8 * 4 bytes
      size: batchSize * 8 * 4,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
    });

    // Update input buffer with new nonce values
    const inputData = new Uint32Array(batchSize);
    for (let i = 0; i < batchSize; i++) {
      inputData[i] = nonce++;
    }
    device.queue.writeBuffer(inputBuffer, 0, inputData);

    // Create bind group (unchanged)
    const bindGroup = device.createBindGroup({
      layout: pipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: inputBuffer } },
        { binding: 1, resource: { buffer: outputBuffer } },
      ],
    });

    // Create command encoder and pass (unchanged)
    const commandEncoder = device.createCommandEncoder();
    const computePass = commandEncoder.beginComputePass();
    computePass.setPipeline(pipeline);
    computePass.setBindGroup(0, bindGroup);
    computePass.dispatchWorkgroups(Math.ceil(batchSize / 256));
    computePass.end();

    // Execute GPU commands
    device.queue.submit([commandEncoder.finish()]);

    // Create read buffer for the structured output
    const readBuffer = device.createBuffer({
      size: batchSize * 8 * 4,
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
    });

    // Copy the output to the read buffer
    const copyEncoder = device.createCommandEncoder();
    copyEncoder.copyBufferToBuffer(
      outputBuffer,
      0,
      readBuffer,
      0,
      batchSize * 8 * 4
    );
    device.queue.submit([copyEncoder.finish()]);

    // Map and read the results
    await readBuffer.mapAsync(GPUMapMode.READ);
    const results = new Uint32Array(readBuffer.getMappedRange());
    
    // Process results - each thread's output is an array of 8 u32s
    for (let i = 0; i < batchSize; i++) {
      // Get the 8 words for this thread's hash
      const hashWords = Array.from(results.slice(i * 8, (i + 1) * 8))
        .map(word => word.toString(16).padStart(8, '0'))
        .join('');
      
      const { binary } = calculateLeadingZeroes(hashWords);
      
      if (binary >= 10) {
        self.postMessage({
          type: "hash",
          data: { ...blockHeader, hash: hashWords, nonce: nonce - batchSize + i },
        });
      }
    }

    // Cleanup
    readBuffer.unmap();
    inputBuffer.destroy();
    outputBuffer.destroy();
    readBuffer.destroy();

    updateHashRate(batchSize);
    
    if (sleepTime > 0) {
      await new Promise(resolve => setTimeout(resolve, sleepTime));
    }
    
    requestAnimationFrame(() => miningLoop());
  };

  miningLoop();
}

self.onmessage = async (e) => {
  const { type, blockHeader, miningSpeed: newSpeed } = e.data;
  
  if (type === "start") {
    try {
      await initWebGPU();
      running = true;
      miningSpeed = newSpeed;
      mine(blockHeader);
    } catch (error) {
      self.postMessage({ type: "error", data: error.message });
    }
  } else if (type === "stop") {
    running = false;
  } else if (type === "updateSpeed") {
    miningSpeed = newSpeed;
  }
};
