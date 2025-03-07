import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface GPUCapabilitiesProps {
  capabilities?: {
    maxStorageBufferSize: string;
    maxWorkgroupsPerDimension: string;
    maxWorkgroupSize: {
      x: string;
      y: string;
      z: string;
    };
    maxInvocationsPerWorkgroup: string;
    maxTextureDimension2D: string;
    adapterInfo: string;
  };
}

export function GPUCapabilities({ capabilities }: GPUCapabilitiesProps) {
  if (!capabilities) return null;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>GPU Capabilities</CardTitle>
        <CardDescription>{capabilities.adapterInfo}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <div>
              <div className="font-medium">Max Storage Buffer</div>
              <div className="text-muted-foreground">{capabilities.maxStorageBufferSize}</div>
            </div>
            <div>
              <div className="font-medium">Max Workgroups Per Dimension</div>
              <div className="text-muted-foreground">{capabilities.maxWorkgroupsPerDimension}</div>
            </div>
            <div>
              <div className="font-medium">Max Invocations Per Workgroup</div>
              <div className="text-muted-foreground">{capabilities.maxInvocationsPerWorkgroup}</div>
            </div>
          </div>
          <div className="space-y-2">
            <div>
              <div className="font-medium">Max Workgroup Size</div>
              <div className="text-muted-foreground">
                X: {capabilities.maxWorkgroupSize.x}<br />
                Y: {capabilities.maxWorkgroupSize.y}<br />
                Z: {capabilities.maxWorkgroupSize.z}
              </div>
            </div>
            <div>
              <div className="font-medium">Max Texture Dimension 2D</div>
              <div className="text-muted-foreground">{capabilities.maxTextureDimension2D}</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}