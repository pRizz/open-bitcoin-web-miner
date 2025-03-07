import {
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function BinaryZeroesHelp() {
  return (
    <DialogContent className="max-h-[80vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Understanding Binary Zeroes in Hash Values</DialogTitle>
      </DialogHeader>
      <div className="space-y-4 text-sm">
        <p>
          When we talk about leading zeroes in hash values, we count them in binary (base-2) format rather than hexadecimal (base-16) format. This gives us more precise control over the difficulty since each hexadecimal digit represents 4 binary digits (bits).
        </p>

        <div className="space-y-2">
          <p className="font-semibold text-green-400">Example 1: Multiple Leading Zeroes</p>
          <p>Let's look at this hash value:</p>
          <div className="font-mono bg-gray-900 p-4 rounded-md">
            0x0000f423...
          </div>

          <p>In hexadecimal format, this has 4 leading zeroes.</p>

          <p>When we convert it to binary:</p>
          <div className="font-mono bg-gray-900 p-4 rounded-md whitespace-pre-wrap break-all">
            0000 0000 0000 0000 1111 0100...
          </div>

          <p>We can see it has 16 leading zeroes in binary!</p>
        </div>

        <div className="space-y-2 mt-6">
          <p className="font-semibold text-green-400">Example 2: Hidden Binary Zeroes</p>
          <p>Now let's look at a hash starting with 3:</p>
          <div className="font-mono bg-gray-900 p-4 rounded-md">
            0x3423...
          </div>

          <p>In hexadecimal format, this has no leading zeroes.</p>

          <p>But when we convert 3 to binary:</p>
          <div className="font-mono bg-gray-900 p-4 rounded-md whitespace-pre-wrap break-all">
            0011 0100...
          </div>

          <p className="text-green-400">Notice that even though the hex value starts with 3, its binary representation still has 2 leading zeroes!</p>
        </div>

        <div className="mt-4 p-4 bg-gray-900 rounded-md space-y-2">
          <p className="font-semibold text-green-400">Why Binary is Better:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Each hex digit represents 4 binary digits</li>
            <li>Using hex, we can only increase difficulty in steps of 4 bits</li>
            <li>Binary allows for more fine-grained difficulty adjustment</li>
            <li>We can set the required zeroes to any number, not just multiples of 4</li>
          </ul>
        </div>

        <div className="mt-6 p-4 bg-gray-900 rounded-md space-y-3">
          <p className="font-semibold text-green-400">Statistical Intuition with Binary</p>
          <p>
            Binary representation makes probability calculations much more intuitive. Here's why:
          </p>
          <ul className="list-disc list-inside space-y-2">
            <li>Each bit in a hash has exactly 50% chance of being 0 or 1</li>
            <li>For n leading zeroes, the probability is simply (1/2)^n</li>
            <li>Example: For 10 leading zeroes, probability = 1/1024 (2^10)</li>
          </ul>
        </div>

        <div className="mt-6 p-4 bg-gray-900 rounded-md space-y-3">
          <p className="font-semibold text-green-400">Comparison with Bitcoin's Network Difficulty</p>
          <p>
            Bitcoin's network difficulty is expressed as a large decimal number that represents how many times harder it is to find a block than the original difficulty. While this format works well for the Bitcoin network, it's less intuitive for understanding probabilities:
          </p>
          <ul className="list-disc list-inside space-y-2">
            <li>Bitcoin difficulty of 1.0 means a target of 2^224</li>
            <li>Difficulty of 2.0 means target is halved</li>
            <li>Current difficulties are in the trillions (e.g., 53,000,000,000,000)</li>
          </ul>
          <p className="mt-2">
            In contrast, our binary leading zeroes format:
          </p>
          <ul className="list-disc list-inside space-y-2">
            <li>Directly shows the probability (1/2^n)</li>
            <li>Makes it easy to calculate chances mentally</li>
            <li>Provides intuitive difficulty steps (each +1 = twice as hard)</li>
            <li>Uses small, manageable numbers (e.g., 32 zeroes vs 53 trillion difficulty)</li>
          </ul>
        </div>
      </div>
    </DialogContent>
  );
}