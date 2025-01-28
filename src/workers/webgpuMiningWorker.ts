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

const computeShaderCode = `
@group(0) @binding(0) var<storage, read> input: array<u32>;
@group(0) @binding(1) var<storage, read_write> output: array<u32>;

const K: array<u32, 64> = array<u32, 64>(
    0x428a2f98u, 0x71374491u, 0xb5c0fbcfu, 0xe9b5dba5u,
    // ... Add all SHA-256 constants
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

@compute @workgroup_size(256)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let index = global_id.x;
    
    // Basic SHA-256 implementation
    var state: array<u32, 8>;
    // Initialize state with standard SHA-256 initial values
    state[0] = 0x6a09e667u;
    state[1] = 0xbb67ae85u;
    // ... Initialize remaining state values
    
    // Process input data
    let data = input[index];
    // Perform SHA-256 computation
    // Store result
    output[index] = state[0];
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

    // Create buffers
    const inputBuffer = device.createBuffer({
      size: batchSize * 4,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });

    const outputBuffer = device.createBuffer({
      size: batchSize * 4,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
    });

    // Update input buffer with new nonce values
    const inputData = new Uint32Array(batchSize);
    for (let i = 0; i < batchSize; i++) {
      inputData[i] = nonce++;
    }
    device.queue.writeBuffer(inputBuffer, 0, inputData);

    // Create bind group
    const bindGroup = device.createBindGroup({
      layout: pipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: inputBuffer } },
        { binding: 1, resource: { buffer: outputBuffer } },
      ],
    });

    // Create command encoder and pass
    const commandEncoder = device.createCommandEncoder();
    const computePass = commandEncoder.beginComputePass();
    computePass.setPipeline(pipeline);
    computePass.setBindGroup(0, bindGroup);
    computePass.dispatchWorkgroups(Math.ceil(batchSize / 256));
    computePass.end();

    // Execute GPU commands
    device.queue.submit([commandEncoder.finish()]);

    // Read results
    const readBuffer = device.createBuffer({
      size: batchSize * 4,
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
    });

    commandEncoder.copyBufferToBuffer(
      outputBuffer,
      0,
      readBuffer,
      0,
      batchSize * 4
    );

    await readBuffer.mapAsync(GPUMapMode.READ);
    const results = new Uint32Array(readBuffer.getMappedRange());
    
    // Process results
    for (let i = 0; i < batchSize; i++) {
      const hash = results[i].toString(16).padStart(64, '0');
      const { binary } = calculateLeadingZeroes(hash);
      
      if (binary >= 10) {
        self.postMessage({
          type: "hash",
          data: { ...blockHeader, hash, nonce: nonce - batchSize + i },
        });
      }
    }

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
