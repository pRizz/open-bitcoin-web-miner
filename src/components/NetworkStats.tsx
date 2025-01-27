import { Card } from "@/components/ui/card";
import { NetworkStats as NetworkStatsType } from "@/types/mining";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { HelpCircle } from "lucide-react";

interface NetworkStatsProps {
  stats: NetworkStatsType;
}

export function NetworkStats({ stats }: NetworkStatsProps) {
  return (
    <Card className="p-6 glass-card">
      <h2 className="text-2xl font-bold mb-4">Network Stats</h2>
      <div className="space-y-4">
        <div>
          <label className="text-sm text-gray-400">Block Height</label>
          <p className="text-xl font-mono">{stats.blockHeight.toLocaleString()}</p>
        </div>
        <div>
          <label className="text-sm text-gray-400">Network Difficulty</label>
          <p className="text-xl font-mono">{(stats.difficulty / 1e12).toFixed(2)} T</p>
        </div>
        <div>
          <label className="text-sm text-gray-400 flex items-center gap-2">
            Required Binary Zeroes
            <Dialog>
              <DialogTrigger>
                <HelpCircle className="h-4 w-4 cursor-help text-gray-400 hover:text-gray-300" />
              </DialogTrigger>
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

                  <div className="mt-4">
                    <p>
                      For example, if we required 6 leading zeroes in hex, that would actually mean 24 binary zeroes (6 × 4 = 24). By using binary counting, we can set the difficulty to any precise number of bits we want, like 10, 15, or 23 zeroes.
                    </p>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </label>
          <p className="text-xl font-mono">{stats.requiredBinaryZeroes}</p>
        </div>
      </div>
    </Card>
  );
}