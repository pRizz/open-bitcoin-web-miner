import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useDebug } from "@/contexts/DebugContext";

export function DebugLogPanel() {
  const { logs, clearLogs } = useDebug();

  const logText = logs.join("\n");

  return (
    <Card className="p-6">
      <Accordion type="single" collapsible>
        <AccordionItem value="debug-logs">
          <AccordionTrigger>Debug Logs</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearLogs}
                >
                  Clear Logs
                </Button>
              </div>
              <Textarea
                value={logText}
                readOnly
                className="font-mono text-sm h-[200px]"
              />
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  );
}