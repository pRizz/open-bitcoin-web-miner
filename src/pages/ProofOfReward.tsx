import { Card } from "@/components/ui/card";
import { useMining } from "@/contexts/MiningContext";
import { useMinerInfo } from "@/contexts/mining/MinerInfoContext";
import { useNetworkInfo } from "@/contexts/NetworkInfoContext";
import { formatHashRate } from "@/utils/mining";
import { formatLargeNumber } from "@/utils/formatters";
import { Database, Target, Binary, CheckCircle2, XCircle } from "lucide-react";

export default function ProofOfRewardPage() {
  const { miningStats } = useMining();
  const { maybeMinerAddress } = useMinerInfo();
  const { maybeBlockHeight } = useNetworkInfo();

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Proof of Reward</h1>

      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4">Mining Activity</h2>

        <div className="space-y-4">

          {maybeMinerAddress && (
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Miner Address:</span>
              <span className="font-mono">{maybeMinerAddress}</span>
            </div>
          )}

          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Current Block Height:</span>
            <span>{maybeBlockHeight || "Not available"}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Block Header:</span>
            {/* <span>{maybeBlockHeader || "Not available"}</span> */}
          </div>

        </div>

        <div className="mt-8 p-4">
          <h3 className="text-lg font-semibold mb-2">How You Can Independently Verify That You Are Mining with Your Own Bitcoin Reward Address</h3>
          <p className="text-muted-foreground">
            When participating in mining with our service, you are fully empowered to independently verify that the block you are working on will reward your Bitcoin address if successfully mined. This is a fundamental transparency feature of our system. Here's exactly how you can perform this verification without needing to trust us blindly.
          </p>
        </div>

        <div className="mt-8 p-4">
          <h3 className="text-lg font-semibold mb-2">Step 1: Capture the Block Header You Are Mining</h3>
          <p className="text-muted-foreground">
            During mining, your frontend (or mining device) receives a block header. You can inspect this directly, whether by monitoring network traffic or logging it from the mining software. This block header includes, among other fields, a value called the merkle root.
          </p>
        </div>

        <div className="mt-8 p-4">
          <h3 className="text-lg font-semibold mb-2">Step 2: Download the Block Template and Coinbase Transaction</h3>
          <p className="text-muted-foreground">
            In addition to the block header, you are also given a block template URL. This URL allows you to download the block template, which contains:
All non-coinbase transactions (the "transaction set").

The list of merkle branches (also called the merkle path or merkle branch).

The coinbase transaction, which is supplied to you directly.

The coinbase transaction is critical, as it is where the block reward is paid. By examining this transaction using any Bitcoin transaction parser (such as bitcoinjs-lib or any Bitcoin wallet's decoder), you will see exactly which address is set to receive the reward. You will be able to confirm that this address is the one you intended to use.
          </p>
        </div>

        <div className="mt-8 p-4">
          <h3 className="text-lg font-semibold mb-2">Step 3: Reconstruct and Verify the Merkle Root</h3>
          <p className="text-muted-foreground">
            You can now independently reconstruct the merkle root:

Hash the coinbase transaction.

Combine this hash with the merkle branches obtained from the block template using the standard Bitcoin Merkle Tree calculation.

The result will be the calculated merkle root.
          </p>
        </div>

        <div className="mt-8 p-4">
          <h3 className="text-lg font-semibold mb-2">Step 4: Compare Against the Block Header</h3>
          <p className="text-muted-foreground">
            The final step is to compare the calculated merkle root you just computed against the merkle root provided in the block header you are mining. If they match exactly, you have cryptographic proof that:

The block you are mining includes the coinbase transaction you inspected.

The block will reward the exact Bitcoin address you confirmed earlier.

There is no hidden replacement of your reward address behind the scenes.

This verification process is entirely local and does not rely on trusting the backend beyond the transparency of the provided data. Even if you are using an untrusted network or intermediary, you can confirm independently that you are mining for your own reward.

This mechanism ensures a provable alignment between the miner and their expected payout.
          </p>
        </div>

        <div className="mt-8 p-4">
          <h3 className="text-lg font-semibold mb-2">Definitions</h3>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold">Merkle Root</h4>
              <p className="text-muted-foreground">
                A <a href="https://learnmeabitcoin.com/technical/block/merkle-root/" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Merkle root</a> is a single hash that represents all transactions in a Bitcoin block. It's created by recursively hashing pairs of transaction hashes until a single hash remains. This allows for efficient verification of whether a transaction is included in a block.
              </p>
            </div>

            <div>
              <h4 className="font-semibold">Bitcoin Block</h4>
              <p className="text-muted-foreground">
                A <a href="https://learnmeabitcoin.com/technical/block/" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Bitcoin block</a> is a collection of transactions that have been verified and added to the Bitcoin blockchain. Each block contains a header, a list of transactions, and references to the previous block, forming a chain of blocks (blockchain).
              </p>
            </div>

            <div>
              <h4 className="font-semibold">Bitcoin Block Header</h4>
              <p className="text-muted-foreground">
                The <a href="https://developer.bitcoin.org/reference/block_chain.html#block-headers" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">block header</a> is an 80-byte section at the beginning of each block that contains metadata about the block, including the version, previous block hash, Merkle root, timestamp, difficulty target, and nonce. Miners hash this header to find a valid proof-of-work.
              </p>
            </div>

            <div>
              <h4 className="font-semibold">Coinbase Transaction</h4>
              <p className="text-muted-foreground">
                The <a href="https://developer.bitcoin.org/reference/transactions.html#coinbase-input-the-input-of-the-first-transaction-in-a-block" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">coinbase transaction</a> is the first transaction in every Bitcoin block. It creates new bitcoins and includes the block reward (newly minted bitcoins plus transaction fees) that is paid to the miner who successfully mines the block.

                The transaction may be inspected by importing the transaction hex into <a href="https://bitcoincore.tech/apps/bitcoinjs-ui/index.html" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">bitcoinjs-ui</a>
              </p>
            </div>

            <div>
              <h4 className="font-semibold">Bitcoin Hashing</h4>
              <p className="text-muted-foreground">
                Bitcoin uses the double <a href="https://en.wikipedia.org/wiki/SHA-2" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">SHA-256</a> cryptographic hash function to create unique digital fingerprints of data. In mining, miners repeatedly hash the block header with different nonce values until they find a hash that meets the network's difficulty target. This process is called proof-of-work and secures the Bitcoin network.
              </p>
            </div>
          </div>
        </div>

      </Card>
    </div>
  );
}