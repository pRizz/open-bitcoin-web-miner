import { HashSolution } from "@/types/mining";
import { calculateLeadingZeroes } from "@/utils/mining";

let running = false;
let hashCount = 0;
let lastHashRateUpdate = Date.now();
let miningSpeed = 100;
const HASH_RATE_UPDATE_INTERVAL = 1000;

// WebGL setup
let gl: WebGL2RenderingContext | null = null;
let program: WebGLProgram | null = null;

const vertexShaderSource = `#version 300 es
in vec4 position;
void main() {
  gl_Position = position;
}`;

const fragmentShaderSource = `#version 300 es
precision highp float;
out vec4 fragColor;

uniform vec4 u_blockHeader;
uniform float u_nonce;

// Simple hash function for demonstration
vec4 hash(vec4 input) {
  vec4 result = fract(sin(input) * 43758.5453);
  return result;
}

void main() {
  vec4 blockData = u_blockHeader + vec4(u_nonce, 0.0, 0.0, 0.0);
  vec4 hashResult = hash(blockData);
  fragColor = hashResult;
}`;

function initWebGL() {
  const canvas = new OffscreenCanvas(1, 1);
  gl = canvas.getContext("webgl2");
  
  if (!gl) {
    throw new Error("WebGL2 not supported");
  }

  // Create shaders
  const vertexShader = gl.createShader(gl.VERTEX_SHADER)!;
  gl.shaderSource(vertexShader, vertexShaderSource);
  gl.compileShader(vertexShader);

  const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)!;
  gl.shaderSource(fragmentShader, fragmentShaderSource);
  gl.compileShader(fragmentShader);

  // Create program
  program = gl.createProgram()!;
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error("Unable to initialize WebGL program");
  }

  gl.useProgram(program);
}

function mine(blockHeader: Partial<HashSolution>) {
  if (!gl || !program) return;

  let nonce = Math.floor(Math.random() * 0xFFFFFFFF);
  
  const updateHashRate = () => {
    const now = Date.now();
    const elapsed = now - lastHashRateUpdate;
    if (elapsed >= HASH_RATE_UPDATE_INTERVAL) {
      const hashRate = (hashCount * 1000) / elapsed;
      self.postMessage({ type: "hashRate", data: hashRate });
      hashCount = 0;
      lastHashRateUpdate = now;
    }
  };

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const miningLoop = async () => {
    if (!running || !gl || !program) return;

    const batchSize = 10000;
    const sleepTime = Math.floor((100 - miningSpeed) * 10);

    for (let i = 0; i < batchSize; i++) {
      const header = {
        ...blockHeader,
        nonce: nonce++,
      };

      // Update uniforms
      const blockHeaderLoc = gl.getUniformLocation(program, "u_blockHeader");
      const nonceLoc = gl.getUniformLocation(program, "u_nonce");
      
      gl.uniform4f(blockHeaderLoc, 
        header.version || 0,
        parseInt(header.bits || "0", 16),
        header.timestamp || 0,
        0
      );
      gl.uniform1f(nonceLoc, header.nonce);

      // Read pixels
      const pixels = new Uint8Array(4);
      gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
      
      // Convert pixels to hash
      const hash = Array.from(pixels)
        .map(x => x.toString(16).padStart(2, "0"))
        .join("");
      
      hashCount++;

      const { binary } = calculateLeadingZeroes(hash);
      if (binary >= 10) {
        self.postMessage({
          type: "hash",
          data: { ...header, hash },
        });
      }
    }

    updateHashRate();
    
    if (sleepTime > 0) {
      await sleep(sleepTime);
    }
    
    requestAnimationFrame(() => miningLoop());
  };

  miningLoop();
}

self.onmessage = (e) => {
  const { type, blockHeader, miningSpeed: newSpeed } = e.data;
  
  if (type === "start") {
    if (!gl) {
      try {
        initWebGL();
      } catch (error) {
        self.postMessage({ type: "error", data: "GPU mining not supported" });
        return;
      }
    }
    running = true;
    miningSpeed = newSpeed;
    mine(blockHeader);
  } else if (type === "stop") {
    running = false;
  } else if (type === "updateSpeed") {
    miningSpeed = newSpeed;
  }
};