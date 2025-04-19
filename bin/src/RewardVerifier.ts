import * as bitcoin from 'bitcoinjs-lib';
import { Block } from 'bitcoinjs-lib';
import * as crypto from 'crypto';
import * as merkleLib from 'merkle-lib';
import * as bitcore from 'bitcore-lib';

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
  return crypto.createHash('sha256').update(
    crypto.createHash('sha256').update(data).digest()
  ).digest();
}

// --- Compute merkle root from coinbase hash and merkle branch ---
// export function computeMerkleRoot(coinbaseTx: Buffer, merkleBranch: string[]): Buffer {
  // let hash = doubleSha256(coinbaseTx); // Hash of coinbase transaction

  // for (const branchHex of merkleBranch) {
  //   const branchHash = Buffer.from(branchHex, 'hex');

  //   // Mining usually assumes the coinbase is always on the left
  //   // so hash = double_sha256( hash || branchHash )
  //   hash = doubleSha256(Buffer.concat([hash, branchHash]));
  // }

  // return hash;
// }

// FIXME: audit: --- Verify merkle root matches header ---
// export function verifyMerkleRoot(proof: ProofOfRewardRaw): boolean {
//   const coinbaseTx = Buffer.from(proof.coinbase_transaction, 'hex');
//   const calculatedRoot = computeMerkleRoot(coinbaseTx, proof.merkle_branch);

//   // Bitcoin block header stores merkle root as little-endian
//   const merkleRootFromHeader = bytesToBuffer(proof.nonceless_block_header.merkle_root);

//   // Compare
//   return calculatedRoot.reverse().equals(merkleRootFromHeader);
// }

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

// function constructBlockFromTemplate(template: BlockTemplateUpdate, coinbaseTransactionHex: string): Block {
//   const block = new Block(template.nonceless_block_header);
//   block.addTransaction(coinbaseTransactionHex);
//   return block;
// }

// const block = Block.fromHex(template.block_template_url);
// block.addTransaction(coinbaseTransactionHex);

// console.log(block.toHex());

function computeMerkleRoot(txHashes: Buffer[]): Buffer {
  console.log(`computeMerkleRoot: txHashes: ${txHashes}`);
  console.log(`merkleLib,`, merkleLib);
  console.log(`merkleLib.merkle,`, merkleLib.default);
  const merkleRoot = merkleLib.default(txHashes, doubleSha256);
  console.log(`computeMerkleRoot: merkleRoot: ${merkleRoot}`);
  return merkleRoot;
}

export function createBlockFromTemplate(
  gbtJSON: any,
  coinbaseTxHex: string
): bitcoin.Block {
  const txs: bitcoin.Transaction[] = [];

  // 1. Add coinbase
  const coinbaseTx = bitcoin.Transaction.fromHex(coinbaseTxHex);
  txs.push(coinbaseTx);

  // 2. Add other transactions from the template
  for (const tx of gbtJSON.transactions) {
    const txObj = bitcoin.Transaction.fromHex(tx.data);
    txs.push(txObj);
  }

  // 3. Compute Merkle Root
  const txHashes = txs.map(tx =>
    Buffer.from(tx.getHash()).reverse() // LE
  );

  const merkleRoot = computeMerkleRoot(txHashes);

  // 4. Create Block object
  const block = new bitcoin.Block();

  block.version = gbtJSON.version;
  block.prevHash = Buffer.from(gbtJSON.previousblockhash, 'hex').reverse();
  block.merkleRoot = merkleRoot;
  block.timestamp = gbtJSON.curtime;
  block.bits = parseInt(gbtJSON.bits, 16);
  block.nonce = 0; // You'll increment this for mining
  block.transactions = txs;

  console.log(`block,`, block);

  return block;
}
