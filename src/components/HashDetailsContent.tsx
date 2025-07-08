
import { HashSolution } from "@/types/mining";
import { formatDuration } from "@/utils/formatters";
import { Copy } from "lucide-react";
import { showSuccess, showError } from "@/utils/notifications";
import { Button } from "@/components/ui/button";

interface HashDetailsContentProps {
  hash: HashSolution;
}

export function HashDetailsContent({ hash }: HashDetailsContentProps) {
  const handleCopy = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showSuccess(
        "Copied!",
        `${field} copied to clipboard`
      );
    } catch (err) {
      showError(
        "Copy Failed",
        "Failed to copy to clipboard"
      );
    }
  };

  // Example JSON output:
  // {
  //   "hash": "000003f069a43c303640fa1b13ea32c4ca125fe2657c1f709368c30d93f1105e",
  //   "timeToFind": "11s",
  //   "nonce": 8234380,
  //   "previousBlock": "f167e04fdaa430cd65de5f0446dc6cc983eb1b29bc4373dd82d0ae7058330000",
  //   "merkleRoot": "73000150bb7c00e4a312667078db12b3aa85e8aedf66863b4141fa17f1a61f31",
  //   "timestamp": {
  //     "unix": 1742252897655,
  //     "formatted": "10/18/57179, 9:14:15 PM"
  //   },
  //   "version": 805306368,
  //   "bits": "ffff7f20"
  // }
  const handleCopyAll = async () => {
    try {
      const jsonData = {
        hash: hash.hash,
        timeToFind: formatDuration(hash.timeToFindMs),
        nonce: hash.nonceNumber,
        previousBlock: hash.previousBlockHex,
        merkleRoot: hash.merkleRootHex,
        timestamp: {
          unix: hash.timestamp,
          formatted: new Date(hash.timestamp * 1000).toLocaleString()
        },
        version: hash.versionNumber,
        bits: hash.bitsHex
      };
      await navigator.clipboard.writeText(JSON.stringify(jsonData, null, 2));
      showSuccess(
        "Copied!",
        "All hash details copied as JSON"
      );
    } catch (err) {
      showError(
        "Copy Failed",
        "Failed to copy JSON to clipboard"
      );
    }
  };

  return (
    <div className="space-y-4 font-mono text-sm">
      <div>
        <div className="text-gray-400">Hash</div>
        <div className="flex items-center gap-2">
          <div className="break-all">{hash.hash}</div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => handleCopy(hash.hash, "Hash")}
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div>
        <div className="text-gray-400">Time to Find</div>
        <div className="flex items-center gap-2">
          <div>{formatDuration(hash.timeToFindMs)}</div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => handleCopy(formatDuration(hash.timeToFindMs), "Time to Find")}
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div>
        <div className="text-gray-400">Nonce</div>
        <div className="flex items-center gap-2">
          <div>{hash.nonceNumber}</div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => handleCopy(hash.nonceNumber.toString(), "Nonce")}
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div>
        <div className="text-gray-400">Previous Block</div>
        <div className="flex items-center gap-2">
          <div className="break-all">{hash.previousBlockHex}</div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => handleCopy(hash.previousBlockHex, "Previous Block")}
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div>
        <div className="text-gray-400">Merkle Root</div>
        <div className="flex items-center gap-2">
          <div className="break-all">{hash.merkleRootHex}</div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => handleCopy(hash.merkleRootHex, "Merkle Root")}
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div>
        <div className="text-gray-400">Timestamp</div>
        <div className="flex items-center gap-2">
          <div>{new Date(hash.timestamp * 1000).toLocaleString()}</div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => handleCopy(new Date(hash.timestamp * 1000).toLocaleString(), "Timestamp")}
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div>
        <div className="text-gray-400">Version</div>
        <div className="flex items-center gap-2">
          <div>{hash.versionNumber}</div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => handleCopy(hash.versionNumber.toString(), "Version")}
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div>
        <div className="text-gray-400">Bits</div>
        <div className="flex items-center gap-2">
          <div>{hash.bitsHex}</div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => handleCopy(hash.bitsHex.toString(), "Bits")}
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="pt-2 border-t">
        <Button
          variant="outline"
          className="w-full"
          onClick={handleCopyAll}
        >
          <Copy className="h-4 w-4 mr-2" />
        Copy All as JSON
        </Button>
      </div>
    </div>
  );
}