export const dsha256Shader80ByteInput = `
// WebGPU Compute Shader for Double SHA-256 Hashing
// This shader takes an 80-byte input (interpreted as 20 u32 words)
// and performs a double SHA-256 hash.

struct Input {
  header: array<u32, 20>,
  nonceOffset: u32,
  targetMinimumLeadingZeroes: u32
}

struct Output {
  hash: array<u32, 8>,
//   header: array<u32, 20>,
  nonce: u32,
  globalIdX: u32,
  globalIdY: u32,
  globalIdZ: u32,
  nonceOffset: u32,
  workgroup_count_x: u32,
  workgroup_count_y: u32,
  workgroup_count_z: u32,
  local_invocation_index: u32,
  local_invocation_id_x: u32,
  local_invocation_id_y: u32,
  local_invocation_id_z: u32,
  workgroup_id_x: u32,
  workgroup_id_y: u32,
  workgroup_id_z: u32
}

// Input buffer: array of u32 words, representing the 80-byte message blocks.
// Each message is 20 u32 words long (80 bytes).
@group(0) @binding(0) var<storage, read> input: array<Input>;
// Output buffer: array of Output structs, where each Output contains an 8-word SHA-256 hash.
@group(0) @binding(1) var<storage, read_write> output: array<Output>;
@group(0) @binding(2) var<storage, read_write> counter: atomic<u32>;

// SHA-256 Round Constants (K_t)
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

// Byte-swap utility function to convert between endianness.
// SHA-256 expects big-endian words, while WebGPU u32 will be host-endian (often little-endian).
fn swapEndianness(val: u32) -> u32 {
    return ((val & 0xFF000000u) >> 24u) |
           ((val & 0x00FF0000u) >> 8u)  |
           ((val & 0x0000FF00u) << 8u)  |
           ((val & 0x000000FFu) << 24u);
}

// https://chatgpt.com/c/6869a041-8f40-8002-bb38-dc1385e8fbbe
// Swap byte‐order of a single 32-bit word.
fn swapEndian32(x: u32) -> u32 {
    // Mask out each byte and shift it to its reversed position.
    let b0 = (x & 0x000000FFu) << 24u;
    let b1 = (x & 0x0000FF00u) << 8u;
    let b2 = (x & 0x00FF0000u) >> 8u;
    let b3 = (x & 0xFF000000u) >> 24u;
    return b0 | b1 | b2 | b3;
}

// https://chatgpt.com/c/6869a041-8f40-8002-bb38-dc1385e8fbbe
// Take an array<u32, 8> and byte-swap each element.
// fn swapEndianArray(words: array<u32, 8>) -> array<u32, 8> {
//     var out: array<u32, 8>;
//     // Loop unrolled by the compiler
//     for (var i: u32 = 0u; i < 8u; i = i + 1u) {
//         out[i] = swapEndian32(words[i]);
//     }
//     return out;
// }

// https://chatgpt.com/c/6869a041-8f40-8002-bb38-dc1385e8fbbe
// Reverse all 32 bytes across an array<u32, 8>.
// I.e. byte 0 ↔ byte 31, 1 ↔ 30, …, 15 ↔ 16.
fn reverseBytes256(inputWords: array<u32, 8>) -> array<u32, 8> {
    // Initialize result words to zero
    var result: array<u32, 8> = array<u32, 8>(
        0u, 0u, 0u, 0u, 0u, 0u, 0u, 0u
    );

    // Loop over each 32-bit word...
    for (var wordIndex: u32 = 0u; wordIndex < 8u; wordIndex = wordIndex + 1u) {
        // ...and each of its 4 bytes
        for (var byteIndex: u32 = 0u; byteIndex < 4u; byteIndex = byteIndex + 1u) {
            // Extract the byte
            let byteValue: u32 =
                (inputWords[wordIndex] >> (byteIndex * 8u)) & 0xFFu;

            // Compute where that byte goes in the reversed 256-bit buffer
            let targetWordIndex: u32 = 7u - wordIndex;
            let targetByteIndex: u32 = 3u - byteIndex;

            // Place it into the result
            result[targetWordIndex] =
                result[targetWordIndex] |
                (byteValue << (targetByteIndex * 8u));
        }
    }

    return result;
}

// Right Rotate (ROTR) operation
fn rotr(x: u32, n: u32) -> u32 {
    return (x >> n) | (x << (32u - n));
}

// Ch (Choose) function
fn ch(x: u32, y: u32, z: u32) -> u32 {
    return (x & y) ^ (~x & z);
}

// Maj (Majority) function
fn maj(x: u32, y: u32, z: u32) -> u32 {
    return (x & y) ^ (x & z) ^ (y & z);
}

// Big Sigma 0 function
fn sigma0(x: u32) -> u32 {
    return rotr(x, 2u) ^ rotr(x, 13u) ^ rotr(x, 22u);
}

// Big Sigma 1 function
fn sigma1(x: u32) -> u32 {
    return rotr(x, 6u) ^ rotr(x, 11u) ^ rotr(x, 25u);
}

// Little Sigma 0 function
fn gamma0(x: u32) -> u32 {
    return rotr(x, 7u) ^ rotr(x, 18u) ^ (x >> 3u);
}

// Little Sigma 1 function
fn gamma1(x: u32) -> u32 {
    return rotr(x, 17u) ^ rotr(x, 19u) ^ (x >> 10u);
}

// SHA-256 compression function for a single 512-bit (16-word) message block.
// Initializes state with standard SHA-256 IVs.
fn sha256(messageBlock: array<u32, 16>) -> array<u32, 8> {
    var state: array<u32, 8>;
    // Initialize state with standard SHA-256 initial hash values (H0 to H7)
    state[0] = 0x6a09e667u;
    state[1] = 0xbb67ae85u;
    state[2] = 0x3c6ef372u;
    state[3] = 0xa54ff53au;
    state[4] = 0x510e527fu;
    state[5] = 0x9b05688cu;
    state[6] = 0x1f83d9abu;
    state[7] = 0x5be0cd19u;
    
    // Create message schedule array (W_0 to W_63)
    var w: array<u32, 64>;
    
    // Load the first 16 words of the message block into the message schedule
    for (var t = 0u; t < 16u; t++) {
        w[t] = messageBlock[t];
    }
    
    // Extend the first 16 words into the remaining 48 words of the message schedule
    for (var t = 16u; t < 64u; t++) {
        let t2 = w[t - 2u];
        let t7 = w[t - 7u];
        let t15 = w[t - 15u];
        let t16 = w[t - 16u];
        w[t] = gamma1(t2) + t7 + gamma0(t15) + t16;
    }
    
    // Initialize working variables for compression
    var a = state[0];
    var b = state[1];
    var c = state[2];
    var d = state[3];
    var e = state[4];
    var f = state[5];
    var g = state[6];
    var h = state[7];
    
    // Main compression loop (64 rounds)
    for (var t = 0u; t < 64u; t++) {
        var t1 = h;
        t1 = t1 + sigma1(e);
        t1 = t1 + ch(e, f, g);
        t1 = t1 + K[t];
        t1 = t1 + w[t];

        var t2 = sigma0(a) + maj(a, b, c);
        
        // Update working variables
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
    
    return state;
}

// SHA-256 compression function using a provided initial state.
// Used for processing subsequent blocks in multi-block messages.
fn sha256WithState(messageBlock: array<u32, 16>, initialState: array<u32, 8>) -> array<u32, 8> {
    var state = initialState; // Use the provided initial state
    
    // Create message schedule array (W_0 to W_63)
    var w: array<u32, 64>;
    
    // Load the first 16 words of the message block into the message schedule
    for (var t = 0u; t < 16u; t++) {
        w[t] = messageBlock[t];
    }
    
    // Extend the first 16 words into the remaining 48 words of the message schedule
    for (var t = 16u; t < 64u; t++) {
        let t2 = w[t - 2u];
        let t7 = w[t - 7u];
        let t15 = w[t - 15u];
        let t16 = w[t - 16u];
        w[t] = gamma1(t2) + t7 + gamma0(t15) + t16;
    }
    
    // Initialize working variables for compression
    var a = state[0];
    var b = state[1];
    var c = state[2];
    var d = state[3];
    var e = state[4];
    var f = state[5];
    var g = state[6];
    var h = state[7];
    
    // Main compression loop (64 rounds)
    for (var t = 0u; t < 64u; t++) {
        var t1 = h;
        t1 = t1 + sigma1(e);
        t1 = t1 + ch(e, f, g);
        t1 = t1 + K[t];
        t1 = t1 + w[t];

        var t2 = sigma0(a) + maj(a, b, c);
        
        // Update working variables
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
    
    return state;
}

// Prepares the first 512-bit (16-word) block from the 80-byte header.
// This block contains the first 64 bytes of the input message.
fn createFirstBlock(header: array<u32, 20>) -> array<u32, 16> {
    var messageBlock: array<u32, 16>;
    
    // Copy the first 16 words (64 bytes) of the 80-byte header
    for (var i = 0u; i < 16u; i++) {
        messageBlock[i] = header[i];
    }
    
    return messageBlock;
}

// Prepares the second 512-bit (16-word) block from the 80-byte header, including padding.
// This block contains the remaining 16 bytes of the input message, followed by SHA-256 padding.
fn createSecondBlock(header: array<u32, 20>) -> array<u32, 16> {
    var messageBlock: array<u32, 16>;
    
    // Copy the remaining 4 words (16 bytes) of the header
    messageBlock[0] = header[16];
    messageBlock[1] = header[17];
    messageBlock[2] = header[18];
    messageBlock[3] = header[19];
    
    // Add SHA-256 padding: 1 bit followed by zeros, then 64-bit length.
    // The total message length for the *first* SHA-256 is 80 bytes = 640 bits (0x280).
    // This padding ensures the block is 512 bits (16 words) and the total length is correctly appended.
    
    messageBlock[4] = 0x80000000u;  // 1 bit followed by 31 zeros (marks end of message)
    
    // Zero padding until 2 words before the end of the block (for 64-bit length)
    // There are 9 zero words required here (from index 5 to 13)
    messageBlock[5] = 0x00000000u;
    messageBlock[6] = 0x00000000u;
    messageBlock[7] = 0x00000000u;
    messageBlock[8] = 0x00000000u;
    messageBlock[9] = 0x00000000u;
    messageBlock[10] = 0x00000000u;
    messageBlock[11] = 0x00000000u;
    messageBlock[12] = 0x00000000u;
    messageBlock[13] = 0x00000000u; 
    
    // Append 64-bit length of the original message (80 bytes = 640 bits = 0x280)
    // SHA-256 appends length as big-endian 64-bit integer.
    // messageBlock[14] = high 32 bits, messageBlock[15] = low 32 bits.
    messageBlock[14] = 0x00000000u; // Upper 32 bits of 640 (0x280)
    messageBlock[15] = 0x00000280u; // Lower 32 bits of 640 (0x280)
    
    return messageBlock;
}

// Prepares a 512-bit (16-word) block for the second SHA-256 operation.
// This block contains the 256-bit (8-word) hash from the first SHA-256,
// followed by standard SHA-256 padding.
fn padHashBlock(hash: array<u32, 8>) -> array<u32, 16> {
    var messageBlock: array<u32, 16>;
    
    // First 8 words contain the hash (256 bits)
    for (var i = 0u; i < 8u; i++) {
        messageBlock[i] = hash[i];
    }
    
    // Add SHA-256 padding: 1 bit followed by zeros, then 64-bit length.
    // The message for this second hash is 256 bits (0x100).
    
    messageBlock[8] = 0x80000000u;  // 1 bit followed by 31 zeros (marks end of message)
    
    // Zero padding until 2 words before the end of the block (for 64-bit length)
    // For a 256-bit message, 5 zero words are needed here (from index 9 to 13)
    messageBlock[9] = 0x00000000u;
    messageBlock[10] = 0x00000000u;
    messageBlock[11] = 0x00000000u;
    messageBlock[12] = 0x00000000u;
    messageBlock[13] = 0x00000000u;
    
    // Append 64-bit length of the original message (256 bits = 0x100)
    // messageBlock[14] = high 32 bits, messageBlock[15] = low 32 bits.
    messageBlock[14] = 0x00000000u; // Upper 32 bits of 256 (0x100)
    messageBlock[15] = 0x00000100u; // Lower 32 bits of 256 (0x100)
    
    return messageBlock;
}

// https://chatgpt.com/c/6869a041-8f40-8002-bb38-dc1385e8fbbe
// Counts the number of leading zero bits in a 256-bit value.
// words[0] is the high-order word; words[7] is the low-order word.
fn countLeadingZeros256(words: array<u32, 8>) -> u32 {
    var zeros: u32 = 0u;
    // Iterate from most-significant word downwards
    for (var i: u32 = 0u; i < 8u; i = i + 1u) {
        let w = words[i];
        if (w == 0u) {
            // entire 32 bits are zero
            zeros = zeros + 32u;
        } else {
            // use the built-in countLeadingZeros for this word
            zeros = zeros + countLeadingZeros(w);
            break;
        }
    }
    return zeros;
}

// Main compute shader entry point.
// Each workgroup processes one 80-byte message.
// fn main(
//   @builtin(global_invocation_id)  global_id: vec3<u32>,
//   @builtin(num_workgroups) workgroup_counts: vec3<u32>
// ) {
//     let gridSizeX = workgroup_counts.x * workgroupSizeX;
//     let gridSizeY = workgroup_counts.y * workgroupSizeY;
@compute @workgroup_size(256)
fn main(
    @builtin(global_invocation_id) global_id: vec3<u32>,
    @builtin(num_workgroups) workgroup_counts: vec3<u32>,
    @builtin(workgroup_id) workgroup_id: vec3<u32>,
    @builtin(local_invocation_id) local_id: vec3<u32>,
    @builtin(local_invocation_index) local_invocation_index: u32
) {
    // let index = global_id.x; // Get the unique index for this work item
    let gridSizeX: u32 = 256;
    let gridSizeY: u32 = 1;

    // Doesn't work: https://chatgpt.com/c/68647bdb-4cfc-8002-a60c-a7a22aa3aea5
    // y and z seem to always be 0
    let index = 
      global_id.z * (gridSizeX * gridSizeY) +
      global_id.y * gridSizeX +
      global_id.x;

    let inputHeader = input[0].header;
    let nonceOffset = input[0].nonceOffset;
    let targetMinimumLeadingZeroes = input[0].targetMinimumLeadingZeroes;

    let nonceU32 = nonceOffset + index;
    
    // Each message is 20 u32 words (80 bytes = 640 bits)
    
    // Extract the 80-byte header for this thread
    var header: array<u32, 20>;
    for (var i = 0u; i < 20u; i++) {
        // Apply byte-swap because SHA-256 expects big-endian,
        // but input data from JavaScript on typical systems is little-endian.
        header[i] = swapEndianness(inputHeader[i]);
    }
    
    // Set the last four bytes (header[19]) to the nonce value in little endian
    header[19] = swapEndianness(nonceU32);
    
    // --- First SHA-256 Pass ---
    // The 80-byte message is split into two 64-byte (16-word) blocks for SHA-256 processing.

    // Create the first 512-bit (64-byte) block from the header (first 16 words)
    let firstBlock = createFirstBlock(header);
    
    // Perform the first SHA-256 hash on the first block.
    // This gives a partial hash state for the first 64 bytes.
    let firstPartialHash = sha256(firstBlock);
    
    // Create the second 512-bit block. This includes the remaining 16 bytes (4 words)
    // of the original message, followed by SHA-256 padding for the total 80-byte message.
    let secondBlock = createSecondBlock(header);
    
    // Continue SHA-256 with the second block, using the 'firstPartialHash'
    // as the initial state for this block. The result is the full SHA-256 hash of the 80-byte input.
    let firstHash = sha256WithState(secondBlock, firstPartialHash);
    
    // --- Second SHA-256 Pass (Double SHA-256) ---
    // Now, hash the result of the first SHA-256 operation.
    // The input for this second hash is the 256-bit (8-word) 'firstHash'.
    
    // Create a new padded message block from the 'firstHash'.
    // This involves appending SHA-256 padding to the 256-bit 'firstHash'.
    let paddedFirstHash = padHashBlock(firstHash);
    
    // Perform the second SHA-256 hash on the padded 'firstHash'.
    // This gives the final double SHA-256 result.
    let finalHash = sha256(paddedFirstHash);

    // Swap the byte order of the final hash
    let reversedFinalHash = reverseBytes256(finalHash);

    // Store the final double SHA-256 hash in the output buffer.
    let leadingZeroes = countLeadingZeros256(reversedFinalHash);
    if (leadingZeroes >= targetMinimumLeadingZeroes) {
        let outIndex = atomicAdd(&counter, 1u);
        output[outIndex].hash = finalHash; // todo: pass back reversedFinalHash instead of finalHash
        output[outIndex].nonce = nonceU32;
        output[outIndex].globalIdX = global_id.x;
        output[outIndex].globalIdY = global_id.y;
        output[outIndex].globalIdZ = global_id.z;
        output[outIndex].nonceOffset = nonceOffset;
        output[outIndex].workgroup_count_x = workgroup_counts.x;
        output[outIndex].workgroup_count_y = workgroup_counts.y;
        output[outIndex].workgroup_count_z = workgroup_counts.z;
        output[outIndex].local_invocation_index = local_invocation_index;
        output[outIndex].local_invocation_id_x = local_id.x;
        output[outIndex].local_invocation_id_y = local_id.y;
        output[outIndex].local_invocation_id_z = local_id.z;
        output[outIndex].workgroup_id_x = workgroup_id.x;
        output[outIndex].workgroup_id_y = workgroup_id.y;
        output[outIndex].workgroup_id_z = workgroup_id.z;
    }
}
`;
