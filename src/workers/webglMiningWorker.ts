import { HashSolution } from "@/types/mining";
import { calculateLeadingZeroes } from "@/utils/mining";

let running = false;
let hashCount = 0;
let lastHashRateUpdate = Date.now();
let miningSpeed = 100;
const HASH_RATE_UPDATE_INTERVAL = 1000;

let gl: WebGL2RenderingContext | null = null;
let program: WebGLProgram | null = null;

const vertexShaderSource = `#version 300 es
in vec4 position;
void main() {
  gl_Position = position;
}`;

const fragmentShaderSource = `#version 300 es
precision highp float;
precision highp int;
out vec4 fragColor;

uniform vec4 u_blockHeader;
uniform float u_nonce;

// SHA-256 Constants
const uint K[64] = uint[64](
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

// Initial hash values (first 32 bits of the fractional parts of the square roots of the first 8 primes)
const uint H[8] = uint[8](
    0x6a09e667u, 0xbb67ae85u, 0x3c6ef372u, 0xa54ff53au,
    0x510e527fu, 0x9b05688cu, 0x1f83d9abu, 0x5be0cd19u
);

// Bitwise operations
uint ROTR(uint x, uint n) {
    return (x >> n) | (x << (32u - n));
}

uint Ch(uint x, uint y, uint z) {
    return (x & y) ^ (~x & z);
}

uint Maj(uint x, uint y, uint z) {
    return (x & y) ^ (x & z) ^ (y & z);
}

uint Sigma0(uint x) {
    return ROTR(x, 2u) ^ ROTR(x, 13u) ^ ROTR(x, 22u);
}

uint Sigma1(uint x) {
    return ROTR(x, 6u) ^ ROTR(x, 11u) ^ ROTR(x, 25u);
}

uint sigma0(uint x) {
    return ROTR(x, 7u) ^ ROTR(x, 18u) ^ (x >> 3u);
}

uint sigma1(uint x) {
    return ROTR(x, 17u) ^ ROTR(x, 19u) ^ (x >> 10u);
}

// Main SHA-256 function
vec4 sha256(vec4 input) {
    // Initialize working variables
    uint a = H[0];
    uint b = H[1];
    uint c = H[2];
    uint d = H[3];
    uint e = H[4];
    uint f = H[5];
    uint g = H[6];
    uint h = H[7];
    
    // Message schedule array
    uint W[64];
    
    // Prepare message schedule
    // First 16 words are the message itself
    W[0] = uint(input.x);
    W[1] = uint(input.y);
    W[2] = uint(input.z);
    W[3] = uint(input.w);
    
    // Fill remaining words
    for(int t = 4; t < 64; t++) {
        W[t] = sigma1(W[t-2]) + W[t-7] + sigma0(W[t-15]) + W[t-16];
    }
    
    // Main loop
    for(int t = 0; t < 64; t++) {
        uint T1 = h + Sigma1(e) + Ch(e, f, g) + K[t] + W[t];
        uint T2 = Sigma0(a) + Maj(a, b, c);
        h = g;
        g = f;
        f = e;
        e = d + T1;
        d = c;
        c = b;
        b = a;
        a = T1 + T2;
    }
    
    // Update hash values
    uint h0 = H[0] + a;
    uint h1 = H[1] + b;
    uint h2 = H[2] + c;
    uint h3 = H[3] + d;
    
    // Return first 128 bits of the hash
    return vec4(
        float(h0) / 4294967295.0,
        float(h1) / 4294967295.0,
        float(h2) / 4294967295.0,
        float(h3) / 4294967295.0
    );
}

void main() {
    vec4 blockData = u_blockHeader + vec4(u_nonce, 0.0, 0.0, 0.0);
    fragColor = sha256(blockData);
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