import * as bitcoin from 'bitcoinjs-lib';
import * as crypto from 'crypto';

export interface ProofOfRewardRaw {
    block_template_url: string;
    nonceless_block_header: NoncelessBlockHeader;
    coinbase_transaction: string; // hex string
    merkle_branch: string[]; // array of hex strings (hashes), given by backend
}

export interface NoncelessBlockHeader {
    version: number[];
    previous_block_hash: number[];
    merkle_root: number[];
    timestamp: number[];
    compact_target: number[];
}

// --- Converts number[] to Buffer ---
export function bytesToBuffer(bytes: number[]): Buffer {
    return Buffer.from(bytes);
}

// --- Double SHA256 ---
export function doubleSha256(data: Buffer): Buffer {
    return crypto.createHash('sha256').update(crypto.createHash('sha256').update(data).digest()).digest();
}

// --- Compute merkle root from coinbase hash and merkle branch ---
export function computeMerkleRoot(coinbaseTx: Buffer, merkleBranch: string[]): Buffer {
    let hash = doubleSha256(coinbaseTx); // Hash of coinbase transaction

    for (const branchHex of merkleBranch) {
        const branchHash = Buffer.from(branchHex, 'hex');

        // Mining usually assumes the coinbase is always on the left
        // so hash = double_sha256( hash || branchHash )
        hash = doubleSha256(Buffer.concat([hash, branchHash]));
    }

    return hash;
}

// FIXME: audit: --- Verify merkle root matches header ---
export function verifyMerkleRoot(proof: ProofOfRewardRaw): boolean {
    const coinbaseTx = Buffer.from(proof.coinbase_transaction, 'hex');
    const calculatedRoot = computeMerkleRoot(coinbaseTx, proof.merkle_branch);

    // Bitcoin block header stores merkle root as little-endian
    const merkleRootFromHeader = bytesToBuffer(proof.nonceless_block_header.merkle_root);

    // Compare
    return calculatedRoot.reverse().equals(merkleRootFromHeader);
}

// FIXME: audit: --- Verify that reward goes to expected address ---
export function verifyReward(proof: ProofOfRewardRaw, expectedAddress: string, network: bitcoin.Network): boolean {
    // Parse the coinbase transaction
    const txBuffer = Buffer.from(proof.coinbase_transaction, 'hex');
    const tx = bitcoin.Transaction.fromBuffer(txBuffer);

    // Check that the coinbase has at least one output
    if (tx.outs.length === 0) {
        throw new Error("Coinbase transaction has no outputs");
    }

    // Check if any output pays to the expected address
    for (const output of tx.outs) {
        try {
            const address = bitcoin.address.fromOutputScript(output.script, network);
            if (address === expectedAddress) {
                return true;
            }
        } catch {
            // Skip outputs that are not standard scripts
        }
    }

    return false;
}
