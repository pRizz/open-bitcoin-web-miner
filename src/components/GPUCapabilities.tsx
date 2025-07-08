import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GPUCapabilities } from "@/contexts/mining/types";

interface GPUCapabilitiesProps {
  capabilities?: GPUCapabilities,
  // limits: GPUSupportedLimits // Cannot be cloned from the worker side
}

export function GPUCapabilitiesComponent(capabilitiesProps: GPUCapabilitiesProps) {
  const { capabilities } = capabilitiesProps;
  console.log("GPUCapabilities: ", capabilities);
  if (!capabilities) return null;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>GPU Capabilities</CardTitle>
        <CardDescription>{capabilities.gpuAdapterInfo.vendor} {capabilities.gpuAdapterInfo.architecture} {capabilities.gpuAdapterInfo.device} {capabilities.gpuAdapterInfo.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <div>
              <div className="font-medium">Vendor</div>
              <div className="text-muted-foreground">{capabilities.gpuAdapterInfo.vendor || "N/A"}</div>
            </div>
            <div>
              <div className="font-medium">Architecture</div>
              <div className="text-muted-foreground">{capabilities.gpuAdapterInfo.architecture || "N/A"}</div>
            </div>
            <div>
              <div className="font-medium">Device</div>
              <div className="text-muted-foreground">{capabilities.gpuAdapterInfo.device || "N/A"}</div>
            </div>
            <div>
              <div className="font-medium">Description</div>
              <div className="text-muted-foreground">{capabilities.gpuAdapterInfo.description || "N/A"}</div>
            </div>
            <div>
              <div className="font-medium">Max Storage Buffer</div>
              <div className="text-muted-foreground">{capabilities.maxStorageBufferSize}</div>
            </div>
            <div>
              <div className="font-medium">Max Workgroups Per Dimension</div>
              <div className="text-muted-foreground">{capabilities.maxWorkgroupsPerDimension}</div>
            </div>
          </div>
          <div className="space-y-2">
            <div>
              <div className="font-medium">Max Invocations Per Workgroup</div>
              <div className="text-muted-foreground">{capabilities.maxInvocationsPerWorkgroup}</div>
            </div>
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