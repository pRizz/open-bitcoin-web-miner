import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { HelpCircle } from "lucide-react";
import { FlashingText } from "./FlashingText";
import { formatLargeNumber } from "@/utils/formatters";

export const OddsExplanation = ({ maybeServerStartingMinLeadingZeroCount }: { maybeServerStartingMinLeadingZeroCount: number | undefined }) => (
  <div className="text-muted-foreground text-xs">
                  The odds any random hash has <FlashingText value={" " + maybeServerStartingMinLeadingZeroCount?.toLocaleString()} defaultValue="n" /> leading zeros are 1 in 2^
    <FlashingText value={maybeServerStartingMinLeadingZeroCount?.toLocaleString()} defaultValue="n" />
    {maybeServerStartingMinLeadingZeroCount && <span className="text-muted-foreground"> or ~ 1 in {formatLargeNumber(Math.pow(2, maybeServerStartingMinLeadingZeroCount || 0), 0)}</span>}
    <Dialog>
      <DialogTrigger>
        <HelpCircle className="h-4 w-4 inline ml-1 cursor-help text-muted-foreground hover:text-foreground" />
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Understanding the Odds of Leading Zeros</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          <p>
                        The probability of finding a hash with a specific number of leading zeros can be understood using a simple coin flip analogy.
          </p>

          <div className="space-y-2">
            <p className="font-semibold">Coin Flip Analogy:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Each bit in a hash has a 50/50 chance of being 0 or 1, just like a coin flip</li>
              <li>For one leading zero, the probability is 50% (1/2)</li>
              <li>For two leading zeros, the probability is 25% (1/4)</li>
              <li>For three leading zeros, the probability is 12.5% (1/8)</li>
              <li>And so on...</li>
            </ul>
          </div>

          <div className="space-y-2">
            <p className="font-semibold">Mathematical Proof:</p>
            <p>For n leading zeros, the probability is (1/2)^n, which equals 1/2^n</p>
            <p>This means the odds are 1 in 2^n</p>
            {maybeServerStartingMinLeadingZeroCount &&
                        <>
                          <p>For example, with {maybeServerStartingMinLeadingZeroCount} leading zeros:</p>
                          <ul className="list-disc list-inside space-y-1">
                            <li>Probability = 1/2^{maybeServerStartingMinLeadingZeroCount}</li>
                            <li>Odds = 1 in 2^{maybeServerStartingMinLeadingZeroCount} = 1 in {Math.pow(2, maybeServerStartingMinLeadingZeroCount || 0).toLocaleString()}</li>
                          </ul>
                        </>
            }
          </div>

          <div className="mt-4 p-4 bg-gray-900 rounded-md space-y-3">
            <p className="font-semibold text-green-400">Why This Matters for Mining:</p>
            <p>
                          Bitcoin mining requires finding a hash with a specific number of leading zeros. The more zeros required, the harder it is to find a valid hash. This is what makes Bitcoin mining a competitive process - miners must perform many hash calculations to find one that meets the difficulty requirement.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  </div>
);
