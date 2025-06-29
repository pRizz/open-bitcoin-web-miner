import { create, globals } from "webgpu";

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
  console.log("device", device);
  return device;
}

async function run(): Promise<void> {
  const device = await getDevice();
  console.log("device", device);

  // 2. prepare data
  const src = new Float32Array([1, 2, 3, 4]);
  const byteLength = src.byteLength;

  const storage = device.createBuffer({
    size: byteLength,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
    mappedAtCreation: true,
  });
  console.log("storage", storage);
  new Float32Array(storage.getMappedRange()).set(src);
  storage.unmap();

  const readback = device.createBuffer({
    size: byteLength,
    usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
  });
  console.log("readback", readback);

  // 3. WGSL shader – multiply each element by 2
  const shader = device.createShaderModule({
    code: /* wgsl */`
      @group(0) @binding(0) var<storage, read_write> buf : array<f32>;
      @compute @workgroup_size(64)
      fn main(@builtin(global_invocation_id) id : vec3<u32>) {
        let i = id.x;
        if (i < arrayLength(&buf)) {
          buf[i] = buf[i] * 2.0;
        }
      }
    `,
  });
  console.log("shader", shader);

  const pipeline = device.createComputePipeline({
    layout: "auto",
    compute: { module: shader, entryPoint: "main" },
  });
  console.log("pipeline", pipeline);

  const bind = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [{ binding: 0, resource: { buffer: storage } }],
  });
  console.log("bind", bind);

  // 4. record commands
  const encoder = device.createCommandEncoder();
  const pass = encoder.beginComputePass();
  pass.setPipeline(pipeline);
  pass.setBindGroup(0, bind);
  pass.dispatchWorkgroups(Math.ceil(src.length / 64));
  pass.end();
  encoder.copyBufferToBuffer(storage, 0, readback, 0, byteLength);
  device.queue.submit([encoder.finish()]);
  console.log("encoder", encoder);
  console.log("pass", pass);
  console.log("pipeline", pipeline);
  console.log("bind", bind);
  console.log("src", src);
  console.log("byteLength", byteLength);
  console.log("readback", readback);

  // 5. read & log
  await readback.mapAsync(GPUMapMode.READ);
  console.log("GPU result:", Array.from(new Float32Array(readback.getMappedRange())));
  readback.unmap();
  console.log("readback", readback);

  console.log("unmapping readback");

  // 6. Cleanup all WebGPU resources
  console.log("Starting cleanup...");

  // Destroy buffers
  storage.destroy();
  console.log("storage buffer destroyed");
  readback.destroy();
  console.log("readback buffer destroyed");

  // Destroy device (this will clean up all associated resources)
  device.destroy();
  console.log("device destroyed");

  // Small delay to ensure GPU resources are fully released
  await new Promise(resolve => setTimeout(resolve, 100));
  console.log("Cleanup completed");
  console.log("end of run");
}

export async function webGPUPrototypeMain() {
  console.log("webGPUPrototypeMain");

  try {
    await run();
  } catch (error) {
    console.error("Error in webGPUPrototypeMain:", error);
  } finally {
    // Needed otherwise Node hangs.
    delete navigator.gpu;
    console.log("end of webGPUPrototypeMain");
    // Remove global reference so Node can exit cleanly
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    //   delete globalThis.navigator.gpu;
    //   console.log("deleted globalThis.navigator.gpu");
  }
}
