#!/usr/bin/env node

import { Command } from 'commander';
import { bytesToBuffer, doubleSha256, createBlockFromTemplate } from './RewardVerifier';
import { calculateRequiredLeadingBinaryZeroes } from './miningCopy';
import { readFileSync } from 'fs';
import { webGPUPrototypeMain } from './webGPUPrototypeXYZNonce';
// import { updateAWSDomainAddressesMain } from './updateAWSDomainAddresses';

// Run with:
// pnpm run bin:dev
// Build to find typescript errors with:
// pnpm run build:bin

// await updateAWSDomainAddressesMain();

function main() {
  // const program = new Command();

  // program
  //   .name('my-binary')
  //   .description('A CLI tool for your application')
  //   .version('1.0.0');

  // program
  //   .command('hello')
  //   .description('Say hello')
  //   .action(() => {
  //     console.log('Hello from your binary!');
  //   });

  // program.parse(process.argv);

  // console.log(program.args);
  // console.log(program.opts());
  // console.log(program.commands);
  console.log('Running a CLI tool for your application' );

  const buffer = bytesToBuffer([1, 2, 3]);
  console.log(buffer);

  const stringToHash = "hello";
  const hash = doubleSha256(Buffer.from(stringToHash, 'utf8'));
  // <Buffer 95 95 c9 df 90 07 51 48 eb 06 86 03 65 df 33 58 4b 75 bf f7 82 a5 10 c6 cd 48 83 a4 19 83 3d 50>
  console.log(hash);

  console.log(`calculateRequiredLeadingBinaryZeroes(1) (1 Hash): ${calculateRequiredLeadingBinaryZeroes(1)}`);
  console.log(`calculateRequiredLeadingBinaryZeroes(1_000) (1 kHashes): ${calculateRequiredLeadingBinaryZeroes(1_000)}`);
  console.log(`calculateRequiredLeadingBinaryZeroes(1_000_000) (1 MHashes): ${calculateRequiredLeadingBinaryZeroes(1_000_000)}`);
  console.log(`calculateRequiredLeadingBinaryZeroes(1_000_000_000) (1 GHashes): ${calculateRequiredLeadingBinaryZeroes(1_000_000_000)}`);
  console.log(`calculateRequiredLeadingBinaryZeroes(1_000_000_000_000) (1 THashes): ${calculateRequiredLeadingBinaryZeroes(1_000_000_000_000)}`);
  console.log(`calculateRequiredLeadingBinaryZeroes(1_000_000_000_000_000) (1 PHashes): ${calculateRequiredLeadingBinaryZeroes(1_000_000_000_000_000)}`);

  // calculateRequiredLeadingBinaryZeroes(1) (1 Hash): 32
  // calculateRequiredLeadingBinaryZeroes(1_000) (1 kHashes): 41
  // calculateRequiredLeadingBinaryZeroes(1_000_000) (1 MHashes): 51
  // calculateRequiredLeadingBinaryZeroes(1_000_000_000) (1 GHashes): 61
  // calculateRequiredLeadingBinaryZeroes(1_000_000_000_000) (1 THashes): 71
  // calculateRequiredLeadingBinaryZeroes(1_000_000_000_000_000) (1 PHashes): 81

  // Print pwd
  console.log(`pwd: ${process.cwd()}`);

  const blockTemplateJSON = readFileSync('./bin/test-data/2025-04-16_23-01-16_block_template.json', 'utf8');
  const blockTemplate = JSON.parse(blockTemplateJSON);
  console.log(`blockTemplate: ${blockTemplate}`);
  console.log(`blockTemplate,`, blockTemplate);

  const coinbaseHex = readFileSync('./bin/test-data/2025-04-16_23-01-16_coinbaseHex.txt', 'utf8');
  console.log(`coinbaseHex: ${coinbaseHex}`);
  const coinbaseTxBuffer = Buffer.from(coinbaseHex, 'hex');
  console.log(`coinbaseTxBuffer: ${coinbaseTxBuffer}`);

  // as hex string
  // const coinbaseTxHex = coinbaseTxBuffer.toString('hex');
  // console.log(`coinbaseTxHex: ${coinbaseTxHex}`);

  const block = createBlockFromTemplate(blockTemplate, coinbaseHex);
  // console.log(`block: ${block}`);

}

// main();

async function runWebGPUPrototype() {
  try {
    await webGPUPrototypeMain();
  } catch (error) {
    console.error("Error running WebGPU prototype:", error);
  }
}

await runWebGPUPrototype();

console.log("end of index.ts");
