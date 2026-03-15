import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BITAXE_ANCHOR_COMPONENT } from "@/constants/urls";
import { useEffect, useState } from "react";

export default function About() {

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const videoWidth = isMobile ? 400 : 700;
  const videoHeight = isMobile ? 315 : 500;

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* <h1 className="text-4xl font-bold mb-8">About Bitcoin Mining</h1> */}

      <Card>
        <CardHeader>
          <CardTitle>What is Bitcoin Mining?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            Bitcoin mining is the process of validating and adding new transactions to the Bitcoin blockchain.
            Miners compete to solve a mathematical puzzle, and the first one to find a solution gets to
            add a new block of transactions to the blockchain and is rewarded with newly created bitcoins.
          </p>
          <p>
            The difficulty of these puzzles automatically adjusts to maintain a target block time of approximately
            10 minutes, regardless of the total computational power of the network. This is what makes Bitcoin
            mining "hard" - as more miners join the network, the difficulty increases to maintain the target
            block time.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>The Technical Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            At its core, Bitcoin mining involves finding a specific input (called a nonce) that, when combined
            with the block's data and processed through the double SHA-256 hash function, produces a hash value
            that is numerically less than a target value set by the network's difficulty.
          </p>
          <p>
            The formula is simple but computationally non-trivial:
          </p>
          <div className="bg-muted p-4 rounded-lg font-mono text-sm">
            SHA256(SHA256(block_header + nonce)) &lt; target
          </div>
          <p>
            The block header contains important information including:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Previous block's hash (linking blocks together)</li>
            <li>Merkle root hash of all transactions in the block. This acts as a cryptographic summary of all transactions in the block. Any small change to the transactions in the block will drastically change the Merkle root.</li>
            <li>Timestamp</li>
            <li>Current difficulty target</li>
            <li>Nonce (the value miners modify to find a valid hash)</li>
          </ul>
          <p>
            The target value is a 256-bit number that represents the maximum allowed hash value. The lower the
            target, the more difficult it is to find a valid nonce. This target is what the network adjusts to
            maintain the 10-minute block time - if blocks are being found too quickly, the target becomes more
            difficult (lower), and if blocks are being found too slowly, the target becomes easier (higher).
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Purpose of This Website</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            This website provides a platform for real Bitcoin mining on consumer hardware. While the chances of
            successfully mining a block are extremely low due to the comparatively high block difficulty, this platform primarily serves as an educational tool to help people understand Bitcoin mining in a
            more intuitive way. We aim to:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Demonstrate the fundamental concepts of Bitcoin mining</li>
            <li>Show how mining difficulty works and adjusts</li>
            <li>Help users understand the relationship between computational power and mining success</li>
            <li>Gain an intuitive understanding of the relative mining power of different hardware</li>
            <li>Provide hands-on experience with real Bitcoin mining on consumer hardware</li>
            <li>Engage with other users via a mining leaderboard</li>
            <li>Provide a fun way to participate in "lottery mining"</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            Our platform performs real Bitcoin mining by:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Implementing the actual Bitcoin mining algorithm (double SHA-256)</li>
            <li>Allowing users to contribute their computational power to the mining process</li>
            <li>Maintaining a leaderboard to track contributions and mining attempts</li>
            <li>Providing real-time feedback on mining progress and difficulty</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Real Bitcoin Mining</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            While this platform performs real Bitcoin mining, mining on consumer hardware is extremely unlikely
            to be successful due to the highly competitive nature of the Bitcoin network. Professional Bitcoin
            mining requires:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Specialized hardware (ASICs) designed specifically for mining</li>
            <li>Significant electrical power and cooling infrastructure</li>
            <li>Access to cheap electricity</li>
            <li>Considerable capital investment</li>
          </ul>
          <p>
            Think of this as a fun way to participate in "lottery mining" - while the chances of winning are
            extremely low (as we're competing against the entire Bitcoin network's computational power), it's an
            engaging way to learn about Bitcoin mining and potentially get lucky! Every hash attempt could theoretically be the winning one, even though the odds are
            astronomical. The educational value and understanding gained from participating in real Bitcoin mining
            can be invaluable for learning about how Bitcoin works.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Where does the rest of the block reward go?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            The remaining block reward goes to the developer of this website, Peter Ryszkiewicz of Bright Builds LLC, in order to cover the costs of running the website. I don't actually expect to actually find a block via this website, but I do plan on creating other projects that will use this backend as a service, with the possibility of supporting stronger hardware, such as the {BITAXE_ANCHOR_COMPONENT} and others, as well as run a more general purpose mining pool after more testing.
          </p>
          <p>
            Also, if you've done some digging into the coinbase transaction, you'll notice that the miner indentifier references "degen p00l". The "degen" is an acronym for "Digital Energy GENerator", where the phrase "digital energy" is a reference to Michael Saylor's "Bitcoin is digital energy" idea. See the video below for an explanation from Michael Saylor himself.
          </p>
          <div className="flex justify-center">
            <iframe
              width={videoWidth}
              height={videoHeight}
              src="https://www.youtube.com/embed/qBPtUf50XVg?si=fP8ovyk-5ssCkqBA&amp;start=3344" title="YouTube video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen></iframe>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}