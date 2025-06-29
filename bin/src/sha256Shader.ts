// TODO: audit
export const computeShaderCode = `
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
    
    // Each message takes 16 u32 words (512 bits)
    let messageOffset = index * 16u;
    
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
    
    // Load the 16 words of the message block
    for (var t = 0u; t < 16u; t++) {
        w[t] = input[messageOffset + t];
    }
    
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
var t1 = h;
t1 = t1 + sigma1(e);
t1 = t1 + ch(e, f, g);
t1 = t1 + K[t];
t1 = t1 + w[t];

var t2 = sigma0(a) + maj(a, b, c);
        
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
