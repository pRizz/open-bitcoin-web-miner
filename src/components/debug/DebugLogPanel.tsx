import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Toggle } from "@/components/ui/toggle";
import { Lock, LockOpen } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useDebug } from "@/contexts/DebugContext";
import { useEffect, useRef, useState } from "react";

export function DebugLogPanel() {
  const { logs, clearLogs } = useDebug();
  const [lockToBottom, setLockToBottom] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const logText = logs.join("\n");

  // Auto-scroll to bottom when logs change and lock is enabled
  useEffect(() => {
    if (lockToBottom && textareaRef.current) {
      textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
    }
  }, [logs, lockToBottom]);

  return (
    <Card className="p-6">
      <Accordion type="single" collapsible>
        <AccordionItem value="debug-logs">
          <AccordionTrigger>Debug Logs</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              <div className="flex justify-end items-center gap-2">
                <Toggle
                  pressed={lockToBottom}
                  onPressedChange={setLockToBottom}
                  aria-label="Toggle auto-scroll to bottom"
                >
                  {lockToBottom ? (
                    <Lock className="mr-1" />
                  ) : (
                    <LockOpen className="mr-1" />
                  )}
                  Lock to Bottom
                </Toggle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearLogs}
                >
                  Clear Logs
                </Button>
              </div>
              {logs.length === 0 ? (
                <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                  No logs yet...
                </div>
              ) : (
                <Textarea
                  ref={textareaRef}
                  value={logText}
                  readOnly
                  className="font-mono text-sm h-[200px]"
                />
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  );
}