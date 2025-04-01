import { cn } from "@/lib/utils";
import { Pickaxe } from "lucide-react";

interface MiningPickaxeProps {
  className?: string;
  isMining?: boolean;
}

export const MiningPickaxe = ({ className, isMining = false }: MiningPickaxeProps) => {
  return (
    <div className={cn("relative w-6 h-6", className)}>
      <div 
        className={cn(
          "absolute inset-0",
          isMining && "animate-mining-pickaxe"
        )}
        style={{ transformOrigin: "35% 75%" }}
      >
        <Pickaxe className="w-full h-full text-primary" />
      </div>
    </div>
  );
}; 