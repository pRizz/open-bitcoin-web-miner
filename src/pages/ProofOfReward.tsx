import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import { useMining } from "@/contexts/MiningContext";
import { useMinerInfo } from "@/contexts/mining/MinerInfoContext";
import { useNetworkInfo } from "@/contexts/NetworkInfoContext";
import { formatHashRateWithShortSIUnits } from "@/utils/mining";
import { formatLargeNumber } from "@/utils/formatters";
import { Database, Target, Binary, CheckCircle2, XCircle, Copy } from "lucide-react";
import { MiningHistoryItem } from "@/contexts/mining/types";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const MiningChallengeElement = ({ item, index, key }: { item: MiningHistoryItem, index: number, key: string }) => {
  const { toast } = useToast();

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: "Transaction hex copied to clipboard",
      });
    } catch (err) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  return (
    <div key={key}>
      <Card className="p-4">
        <CardHeader>
          <CardTitle>Mining Challenge {index + 1}</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Target leading zeros: {item.targetZeros}</p>
          <p>Time retrieved: { new Date(item.timestamp).toLocaleString()}</p>
          <br/>
          <Card className="p-4">
            <CardHeader className="text-lg font-bold pb-4">
              <CardTitle>Block Header</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Version as hexadecimal: {item.blockHeader.version_hex}</p>
              <p>Previous block hash as hexadecimal: {item.blockHeader.previous_block_hash_hex}</p>
              <p>Merkle root as hexadecimal: {item.blockHeader.merkle_root_hex}</p>
              <p>Timestamp as hexadecimal: {item.blockHeader.timestamp_hex}</p>
              <p>Compact target as hexadecimal: {item.blockHeader.compact_target_hex}</p>
            </CardContent>
          </Card>
          <Card className="p-4">
            <CardHeader>
              <CardTitle>Coinbase Transaction</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div style={{ overflowWrap: 'break-word', wordBreak: 'break-word' }} className="font-mono">{item.proofOfReward.coinbase_transaction_hex}</div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopy(item.proofOfReward.coinbase_transaction_hex)}
                    title="Copy transaction hex"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                Copy
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open('https://bitcoincore.tech/apps/bitcoinjs-ui/index.html', '_blank')}
                    title="Verify transaction in Bitcoin JS UI"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                Verify Transaction
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="p-4">
            <CardHeader>
              <CardTitle>Block Template</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div style={{ overflowWrap: 'break-word', wordBreak: 'break-word' }} className="font-mono">{item.proofOfReward.public_block_template_download_link}</div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopy(item.proofOfReward.public_block_template_download_link)}
                    title="Copy block template URL"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                Copy URL
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(item.proofOfReward.public_block_template_download_link, '_blank')}
                    title="Download block template"
                  >
                    <Database className="h-4 w-4 mr-2" />
                Download Template
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

        </CardContent>
      </Card>
    </div>
  );
};

export default function ProofOfRewardPage() {
  const { miningStats } = useMining();
  const { maybeMinerAddress } = useMinerInfo();
  const { maybeBlockHeight } = useNetworkInfo();
  const { miningHistory } = useMining();

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 space-y-4">Proof of Reward</h1>

      <Card className="p-6">
        <CardHeader>
          <CardTitle className="text-2xl font-bold mb-4">Mining Challenge History</CardTitle>
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            {miningHistory.length > 0 && miningHistory.map((item, index) => (
              <MiningChallengeElement key={index.toString()} item={item} index={index} />
            )) || (
              <p className="text-muted-foreground">No mining challenges found. Start mining to see your mining challenges.</p>
            )}
          </div>
        </CardContent>
      </Card>

      <br/>

      <Card className="p-6">
        <CardHeader>
          <CardTitle className="text-2xl font-bold mb-4">How You Can Independently Verify That You Are Mining with Your Own Bitcoin Reward Address</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            When participating in mining with our service, you are fully empowered to independently verify that the block you are working on will reward your Bitcoin address if successfully mined. This is a fundamental transparency feature of our system. Here's exactly how you can perform this verification without needing to trust us blindly.
          </p>

          <div className="mt-8 p-4">
            <h3 className="text-lg font-semibold mb-2">Step 1: Capture the Block Header You Are Mining</h3>
            <p className="text-muted-foreground">
            During mining, your frontend (or mining device) receives a block header. You can inspect this directly, whether by monitoring network traffic or logging it from the mining software. You can find this information by inspecting the websocket messages on this site. This block header includes, among other fields, a value called the merkle root.
            </p>
          </div>

          <div className="mt-8 p-4">
            <h3 className="text-lg font-semibold mb-2">Step 2: Download the Block Template and Coinbase Transaction</h3>
            <p className="text-muted-foreground">
            In addition to the block header, you are also given a block template URL and a coinbase transaction. The block template URL allows you to download the block template, which contains:
              <ul className="list-disc pl-6 space-y-2">
                <li>All non-coinbase transactions (the "transaction set").</li>
                <li>The list of merkle branches (also called the merkle path or merkle branch).</li>
              </ul>

            </p>
          </div>

          <div className="mt-8 p-4" >
            <h3 className="text-lg font-semibold mb-2">Step 3: Verify the Coinbase Transaction contains the correct reward</h3>

            <p className="mt-4 text-muted-foreground">
              The coinbase transaction is critical, as it is where the block reward is paid. By examining this transaction using any Bitcoin transaction parser, you will see exactly which addresses are set to receive the reward. You will be able to confirm that this contains the address you specified when you started mining.
            </p>

            <p className="mt-4 text-muted-foreground">
            You may inspect the coinbase transaction using various tools. For a simple, high level view, you can import the transaction hex into <a href="https://bitcoincore.tech/apps/bitcoinjs-ui/index.html" target="_blank" rel="noopener" className="text-blue-500 hover:underline">bitcoinjs-ui</a>. On the web page, you should see:
              <ul className="list-disc pl-6 space-y-2">
                <li>In the Network Selector on the top right, select "Main" instead of "Test"</li>
                <li>Go to the Transaction Tab</li>
                <li>At the bottom, click "Import"</li>
                <li>Paste the transaction hex in the "Transaction From Hex" dialog box</li>
                <li>Click "OK"</li>
                <li>Then you can see the coinbase transaction details, which should include the 1 Bitcoin reward being paid to the address you specified when you started mining.</li>
              </ul>
            </p>

            <p className="mt-4 text-muted-foreground">
            Other tools you may use include:
              <ul className="list-disc pl-6 space-y-2">
                <li><a href="https://github.com/bitcoinjs/bitcoinjs-lib" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">bitcoinjs-lib</a></li>
                <li>any Bitcoin wallet's decoder</li>
              </ul>
            </p>

            <p className="mt-4 text-muted-foreground">
              For a more controlled view, you can import the bitcoinjs-lib package and use:
              <ul className="list-disc pl-6 space-y-2">
                <li><a href="https://stackblitz.com" target="_blank" rel="noopener" className="text-blue-500 hover:underline">StackBlitz</a></li>
                <li><a href="https://codesandbox.io" target="_blank" rel="noopener" className="text-blue-500 hover:underline">CodeSandbox</a></li>
                <li><a href="https://runkit.com" target="_blank" rel="noopener" className="text-blue-500 hover:underline">RunKit</a></li>
                <li><a href="https://jsfiddle.net" target="_blank" rel="noopener" className="text-blue-500 hover:underline">JSFiddle</a></li>
                <li><a href="https://codepen.io" target="_blank" rel="noopener" className="text-blue-500 hover:underline">CodePen</a></li>
                <li><a href="https://jsbin.com" target="_blank" rel="noopener" className="text-blue-500 hover:underline">JSBin</a></li>
              </ul>
            </p>

          </div>

          <div className="mt-8 p-4">
            <h3 className="text-lg font-semibold mb-2">Step 3: Reconstruct and Verify the Merkle Root</h3>
            <p className="text-muted-foreground">
            You can now independently reconstruct the merkle root:

Hash the coinbase transaction.

Combine this hash with the merkle branches obtained from the block template using the standard Bitcoin Merkle Tree calculation.

The result will be the calculated merkle root. FIXME: add example
            </p>
          </div>

          <div className="mt-8 p-4">
            <h3 className="text-lg font-semibold mb-2">Step 4: Verify the Calculated Merkle Root Matches the Merkle Root in the Block Header</h3>
            <p className="text-muted-foreground">
            The final step is to compare the calculated merkle root you just computed against the merkle root provided in the block header you are mining. If they match exactly, you have cryptographic proof that:

              <ul className="list-disc pl-6 space-y-2">
                <li>The block you are mining includes the coinbase transaction you inspected.</li>
                <li>The block will reward the exact Bitcoin address you confirmed earlier.</li>
                <li>There is no hidden replacement of your reward address behind the scenes.</li>
                <li>There is no hidden replacement of your reward address behind the scenes.</li>
              </ul>

              <p className="mt-4 text-muted-foreground">
              This verification process is entirely local and does not rely on trusting the backend beyond the transparency of the provided data. Even if you are using an untrusted network or intermediary, you can confirm independently that you are mining for your own reward.
              </p>

              <p className="mt-4 text-muted-foreground">
              This mechanism ensures a provable alignment between the miner and their expected payout.
              </p>
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
        </CardContent>

      </Card>
    </div>
  );
}