import React from "react";
import { TypedLink } from "@/components/TypedLink";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChartContainer, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  FIXED_NETWORK_HASHRATE,
  FIXED_NETWORK_HASHRATE_LABEL,
  HASH_RATE_UNIT_ROWS,
  HASHES_PER_ZETTAHASH,
  HOME_MINING_DEVICE_BASELINES,
  HOME_MINING_DEVICE_BASELINES_BY_KEY,
  HOME_MINING_DEVICE_BASELINE_CHART_DATA,
  HOME_MINING_HASH_RATE_CHART_DATA,
  HOME_MINING_PERCENT_CHART_DATA,
  HOME_MINING_SCENARIOS,
  HOME_MINING_SCENARIOS_BY_KEY,
  HOME_MINING_USERS_TO_EQUAL_NETWORK_CHART_DATA,
  formatHashRate,
  formatHashRateMultiplier,
  formatLongParticipantCount,
  formatPercentOfNetwork,
  formatShortParticipantCount,
  formatUsersNeededToEqualNetwork,
  type HomeMiningDeviceBaselineChartPoint,
  type HomeMiningScenarioReport,
} from "@/lib/homeBitcoinMiningReport";
import {
  Activity,
  ArrowRight,
  BarChart3,
  Calculator,
  Cpu,
  Home,
  Info,
  Smartphone,
  Target,
  Zap,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ReferenceLine,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const CHART_CONFIG = {
  iphoneCpu: { label: "Modern iPhone CPUs", color: "#22d3ee" },
  macbookWebGpu: { label: "Modern MacBook Pro WebGPU", color: "#818cf8" },
  gpu: { label: "Consumer GPUs", color: "#60a5fa" },
  homeMiner: { label: "1 TH/s home miners", color: "#34d399" },
  asic: { label: "200 TH/s ASICs", color: "#f97316" },
  editorialBaseline: { label: "Editorial baseline", color: "#facc15" },
  liveBaseline: { label: "Live estimate", color: "#a78bfa" },
} as const;

const HASH_RATE_AXIS_TICKS = [1e13, 1e15, 1e18, 1e21, 1e24];
const PERCENT_AXIS_TICKS = [1e-6, 1e-4, 1e-2, 1, 100, 10_000, 1_000_000];
const USERS_AXIS_TICKS = [1e6, 1e7, 1e9, 1e12, 1e13];
const DEVICE_BASELINE_HASH_RATE_AXIS_TICKS = [1e4, 1e6, 1e9, 1e12, 1e15, 1e18, 1e21];

const MOBILE_PARTICIPANT_AXIS_TICKS = [1_000_000, 100_000_000, 8_000_000_000];
const MOBILE_HASH_RATE_AXIS_TICKS = [1e13, 1e18, 1e21, 1e24];
const MOBILE_PERCENT_AXIS_TICKS = [1e-6, 1e-2, 1, 10_000, 1_000_000];
const MOBILE_USERS_AXIS_TICKS = [1e6, 1e9, 1e13];
const MOBILE_DEVICE_BASELINE_HASH_RATE_AXIS_TICKS = [1e4, 1e8, 1e12, 1e18, 1e21];

const GPU_INSIGHTS = [
  `At ${HOME_MINING_SCENARIOS_BY_KEY.gpu.rows.at(-1)?.participantCountLabel}, GPUs still contribute less than 0.05% of the network.`,
  "This is why GPU mining is effectively obsolete for Bitcoin.",
];

const HOME_MINER_INSIGHTS = [
  `${HOME_MINING_SCENARIOS_BY_KEY.homeMiner.rows[2].participantCountLabel} at 1 TH/s each would contribute about ${HOME_MINING_SCENARIOS_BY_KEY.homeMiner.rows[2].percentOfNetworkLabel} of the network.`,
  `${HOME_MINING_SCENARIOS_BY_KEY.homeMiner.rows[3].participantCountLabel} at 1 TH/s each would roughly match today’s baseline.`,
];

const ASIC_INSIGHTS = [
  `${HOME_MINING_SCENARIOS_BY_KEY.asic.rows[0].participantCountLabel} operating 200 TH/s ASICs would already reach ${HOME_MINING_SCENARIOS_BY_KEY.asic.rows[0].percentOfNetworkLabel} of the network.`,
  `${HOME_MINING_SCENARIOS_BY_KEY.asic.usersNeededToEqualNetworkLabel} would roughly equal the current editorial baseline.`,
];

type ZettahashPerspective = {
  iphoneCpu: string;
  macbookWebGpu: string;
  gpu: string;
  homeMiner: string;
  asic: string;
};

type HomeBitcoinMiningReportProps = {
  maybeNetworkDifficulty?: number;
  maybeFormattedNetworkDifficulty?: string;
  maybeLiveNetworkHashRate?: number;
  maybeLiveBaselineDelta?: number;
  zettahashPerspective: ZettahashPerspective;
};

function ChartTooltipCard({
  active,
  label,
  payload,
  labelFormatter,
  valueFormatter,
}: {
  active?: boolean;
  label?: string | number;
  payload?: ReadonlyArray<{
    color?: string;
    dataKey?: string | number;
    name?: string | number;
    value?: unknown;
  }>;
  labelFormatter: (label: string | number | undefined) => string;
  valueFormatter: (value: number, dataKey: string) => string;
}) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="max-w-[calc(100vw-2rem)] min-w-0 rounded-lg border border-border/70 bg-background/95 px-3 py-2 text-[11px] shadow-xl sm:text-xs">
      <div className="mb-2 break-words font-medium text-foreground">{labelFormatter(label)}</div>
      <div className="space-y-1.5">
        {payload
          .filter((entry): entry is {
            color?: string;
            dataKey?: string | number;
            name?: string | number;
            value: number;
          } => typeof entry.value === "number")
          .map((entry) => {
            const dataKey = String(entry.dataKey ?? entry.name ?? "value");
            return (
              <div key={dataKey} className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-sm"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="break-words text-muted-foreground">
                    {CHART_CONFIG[dataKey as keyof typeof CHART_CONFIG]?.label ?? entry.name ?? dataKey}
                  </span>
                </div>
                <span className="font-mono text-foreground">{valueFormatter(entry.value, dataKey)}</span>
              </div>
            );
          })}
      </div>
    </div>
  );
}

function MetricDetail({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="rounded-lg border bg-background/30 p-3">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={`mt-2 break-words text-sm text-foreground ${mono ? "font-mono" : ""}`}>
        {value}
      </div>
    </div>
  );
}

function ScenarioRowCards({
  rows,
}: {
  rows: HomeMiningScenarioReport["rows"];
}) {
  return (
    <div className="space-y-3 lg:hidden">
      {rows.map((row) => (
        <div key={row.participantCount} className="rounded-lg border bg-muted/10 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                Consumers mining
              </div>
              <div className="mt-1 text-base font-semibold text-foreground">
                {row.participantCountLabel}
              </div>
            </div>
            <div className="rounded-full border border-blue-500/20 bg-blue-500/5 px-3 py-1 text-sm font-mono text-blue-200">
              {row.percentOfNetworkLabel}
            </div>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <MetricDetail label="Per-user rate" value={row.perUserHashRateLabel} mono />
            <MetricDetail label="Combined rate" value={row.combinedHashRateLabel} mono />
            <MetricDetail label="Compared to network" value={row.comparedToNetworkLabel} mono />
            <MetricDetail label="% of global hash rate" value={row.percentOfNetworkLabel} mono />
          </div>
        </div>
      ))}
    </div>
  );
}

function ScenarioTable({
  rows,
}: {
  rows: HomeMiningScenarioReport["rows"];
}) {
  return (
    <>
      <ScenarioRowCards rows={rows} />
      <div className="hidden lg:block">
        <Table className="min-w-[900px]">
          <TableHeader className="sticky top-0 bg-card">
            <TableRow>
              <TableHead>Consumers mining</TableHead>
              <TableHead>Per-user rate</TableHead>
              <TableHead>Combined rate</TableHead>
              <TableHead>Compared to network</TableHead>
              <TableHead className="text-right">% of global hash rate</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.participantCount}>
                <TableCell>{row.participantCountLabel}</TableCell>
                <TableCell className="font-mono">{row.perUserHashRateLabel}</TableCell>
                <TableCell className="font-mono">{row.combinedHashRateLabel}</TableCell>
                <TableCell className="font-mono">{row.comparedToNetworkLabel}</TableCell>
                <TableCell className="text-right font-mono">{row.percentOfNetworkLabel}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}

function ComparisonSummary() {
  return (
    <>
      <div className="space-y-3 md:hidden">
        {HOME_MINING_DEVICE_BASELINES.map((baseline) => (
          <div key={baseline.key} className="rounded-lg border bg-muted/20 p-4">
            <div className="text-base font-semibold text-foreground">{baseline.shortTitle}</div>
            <div className="mt-4 grid gap-3">
              <MetricDetail label="Hash rate per device" value={baseline.perUserHashRateLabel} mono />
              <MetricDetail
                label="Devices needed to equal network"
                value={baseline.usersNeededToEqualNetworkLabel}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="hidden md:block">
        <Table className="min-w-[720px]">
          <TableHeader>
            <TableRow>
              <TableHead>Hardware</TableHead>
              <TableHead>Hash rate per device</TableHead>
              <TableHead>Devices needed to equal network</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {HOME_MINING_DEVICE_BASELINES.map((baseline) => (
              <TableRow key={baseline.key}>
                <TableCell>{baseline.shortTitle}</TableCell>
                <TableCell className="font-mono">{baseline.perUserHashRateLabel}</TableCell>
                <TableCell>{baseline.usersNeededToEqualNetworkLabel}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}

function BaselineSummaryCards() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {HOME_MINING_DEVICE_BASELINES.map((baseline) => (
        <div key={baseline.key} className="rounded-lg border bg-background/30 p-4">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">
            {baseline.shortTitle}
          </div>
          <div className="mt-2 text-lg font-semibold text-foreground">{baseline.perUserHashRateLabel}</div>
          <div className="mt-1 text-sm text-muted-foreground">
            {baseline.usersNeededToEqualNetworkLabel} devices to reach {FIXED_NETWORK_HASHRATE_LABEL}.
          </div>
        </div>
      ))}
    </div>
  );
}

function BaselineChartTooltipCard({
  active,
  payload,
}: {
  active?: boolean;
  payload?: ReadonlyArray<{
    payload?: HomeMiningDeviceBaselineChartPoint;
  }>;
}) {
  const maybePoint = payload?.[0]?.payload;

  if (!active || !maybePoint) {
    return null;
  }

  const maybeGpuHashRate = HOME_MINING_DEVICE_BASELINES_BY_KEY.gpu.perUserHashRate;
  const maybeMultiplier =
    maybeGpuHashRate && maybePoint.hashRate > 0 ? maybePoint.hashRate / maybeGpuHashRate : undefined;

  return (
    <div className="max-w-[calc(100vw-2rem)] rounded-lg border border-border/70 bg-background/95 px-3 py-2 text-[11px] shadow-xl sm:text-xs">
      <div className="font-medium text-foreground">{maybePoint.title}</div>
      <div className="mt-2 space-y-1.5">
        <div className="flex items-center justify-between gap-3">
          <span className="text-muted-foreground">Per-device hash rate</span>
          <span className="font-mono text-foreground">{maybePoint.hashRateLabel}</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-muted-foreground">Devices to equal network</span>
          <span className="text-foreground">{maybePoint.usersNeededLabel}</span>
        </div>
        {typeof maybeMultiplier === "number" && (
          <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground">Relative to 50 MH/s GPU</span>
            <span className="text-foreground">{formatHashRateMultiplier(maybeMultiplier)}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function BaselineChartDot({
  cx,
  cy,
  maybeBaselineKey,
  radius,
}: {
  cx?: number;
  cy?: number;
  maybeBaselineKey?: keyof typeof CHART_CONFIG;
  radius: number;
}) {
  if (typeof cx !== "number" || typeof cy !== "number" || !maybeBaselineKey) {
    return null;
  }

  return (
    <circle
      cx={cx}
      cy={cy}
      r={radius}
      fill={CHART_CONFIG[maybeBaselineKey].color}
      stroke="#0f172a"
      strokeWidth={2}
    />
  );
}

function getScenarioInsights(scenario: HomeMiningScenarioReport) {
  if (scenario.key === "gpu") {
    return { Icon: Cpu, insights: GPU_INSIGHTS };
  }

  if (scenario.key === "homeMiner") {
    return { Icon: Home, insights: HOME_MINER_INSIGHTS };
  }

  return { Icon: Zap, insights: ASIC_INSIGHTS };
}

export function HomeBitcoinMiningReport({
  maybeNetworkDifficulty,
  maybeFormattedNetworkDifficulty,
  maybeLiveNetworkHashRate,
  maybeLiveBaselineDelta,
  zettahashPerspective,
}: HomeBitcoinMiningReportProps) {
  const isMobile = useIsMobile();

  const participantAxisTicks = isMobile
    ? MOBILE_PARTICIPANT_AXIS_TICKS
    : HOME_MINING_HASH_RATE_CHART_DATA.map((point) => point.participantCount);
  const hashRateAxisTicks = isMobile ? MOBILE_HASH_RATE_AXIS_TICKS : HASH_RATE_AXIS_TICKS;
  const percentAxisTicks = isMobile ? MOBILE_PERCENT_AXIS_TICKS : PERCENT_AXIS_TICKS;
  const usersAxisTicks = isMobile ? MOBILE_USERS_AXIS_TICKS : USERS_AXIS_TICKS;
  const baselineHashRateAxisTicks = isMobile
    ? MOBILE_DEVICE_BASELINE_HASH_RATE_AXIS_TICKS
    : DEVICE_BASELINE_HASH_RATE_AXIS_TICKS;
  const lineChartMargin = isMobile
    ? { top: 16, right: 8, left: 0, bottom: 0 }
    : { top: 20, right: 12, left: 12, bottom: 8 };
  const barChartMargin = isMobile
    ? { top: 16, right: 8, left: 0, bottom: 0 }
    : { top: 20, right: 24, left: 24, bottom: 8 };
  const baselineLineChartMargin = isMobile
    ? { top: 16, right: 8, left: 0, bottom: 24 }
    : { top: 20, right: 12, left: 12, bottom: 8 };
  const lineDot = { r: isMobile ? 3 : 4 };
  const legendContent = (
    <ChartLegendContent className="flex-wrap justify-start gap-x-3 gap-y-2 text-[11px] sm:justify-center sm:text-xs" />
  );
  const chartTick = { fontSize: isMobile ? 11 : 12 };

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-0 py-4 sm:gap-6 sm:px-4 sm:py-6">
      <Card className="overflow-hidden border-blue-500/20 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.18),_transparent_38%),radial-gradient(circle_at_top_right,_rgba(250,204,21,0.14),_transparent_34%),hsl(var(--card))]">
        <CardHeader className="gap-4 p-4 sm:p-6">
          <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
            <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-blue-200">
              Bitcoin mining viability
            </span>
            <span className="rounded-full border border-yellow-500/30 bg-yellow-500/10 px-3 py-1 text-yellow-200">
              Baseline: {FIXED_NETWORK_HASHRATE_LABEL}
            </span>
          </div>
          <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr] lg:items-end">
            <div className="space-y-4">
              <CardTitle className="text-3xl leading-tight sm:text-4xl">
                Home mining is a scale problem before it is a software problem.
              </CardTitle>
              <CardDescription className="max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
                This page now compares a fuller ladder of mining hardware against the Bitcoin
                network: modern iPhone CPUs, modern MacBook Pro WebGPU mining, browser-era GPUs,
                1 TH/s home miners, and modern 200 TH/s ASICs. The goal is not to ask whether one
                device can &ldquo;mine Bitcoin,&rdquo; but to show how quickly the network turns
                hardware differences into orders-of-magnitude consequences.
              </CardDescription>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-lg border border-white/10 bg-black/20 p-4">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  iPhone CPUs needed
                </div>
                <div className="mt-2 break-words text-xl font-semibold sm:text-2xl">
                  {HOME_MINING_DEVICE_BASELINES_BY_KEY.iphoneCpu.usersNeededToEqualNetworkLabel}
                </div>
              </div>
              <div className="rounded-lg border border-white/10 bg-black/20 p-4">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  MacBook WebGPU devices needed
                </div>
                <div className="mt-2 break-words text-xl font-semibold sm:text-2xl">
                  {HOME_MINING_DEVICE_BASELINES_BY_KEY.macbookWebGpu.usersNeededToEqualNetworkLabel}
                </div>
              </div>
              <div className="rounded-lg border border-white/10 bg-black/20 p-4">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  GPUs needed
                </div>
                <div className="mt-2 break-words text-xl font-semibold sm:text-2xl">
                  {HOME_MINING_SCENARIOS_BY_KEY.gpu.usersNeededToEqualNetworkLabel}
                </div>
              </div>
              <div className="rounded-lg border border-white/10 bg-black/20 p-4">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  1 TH/s homes needed
                </div>
                <div className="mt-2 break-words text-xl font-semibold sm:text-2xl">
                  {HOME_MINING_SCENARIOS_BY_KEY.homeMiner.usersNeededToEqualNetworkLabel}
                </div>
              </div>
              <div className="rounded-lg border border-white/10 bg-black/20 p-4 sm:col-span-2 lg:col-span-1">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  200 TH/s ASICs needed
                </div>
                <div className="mt-2 break-words text-xl font-semibold sm:text-2xl">
                  {HOME_MINING_SCENARIOS_BY_KEY.asic.usersNeededToEqualNetworkLabel}
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <div className="flex items-center gap-3">
              <Calculator className="h-5 w-5 text-blue-400" />
              <CardTitle>Assumptions and Formula</CardTitle>
            </div>
            <CardDescription>
              The report keeps one editorial baseline so the tables, summary, and charts are
              comparable end to end.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 p-4 pt-0 sm:p-6 sm:pt-0">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border bg-muted/30 p-4">
                <div className="text-sm font-medium text-foreground">Fixed network baseline</div>
                <div className="mt-2 break-words font-mono text-xl text-yellow-300 sm:text-2xl">
                  {FIXED_NETWORK_HASHRATE_LABEL}
                </div>
              </div>
              <div className="rounded-lg border bg-muted/30 p-4">
                <div className="text-sm font-medium text-foreground">Percent contribution</div>
                <div className="mt-2 break-words font-mono text-sm text-muted-foreground">
                  percentage = (combined_hashrate / {FIXED_NETWORK_HASHRATE_LABEL}) × 100
                </div>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="space-y-3">
                <div className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Unit conversions
                </div>
                <Table className="min-w-0">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Unit</TableHead>
                      <TableHead>Hashes per second</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {HASH_RATE_UNIT_ROWS.map((row) => (
                      <TableRow key={row.unit}>
                        <TableCell className="font-mono">{row.unit}</TableCell>
                        <TableCell className="font-mono">{row.hashesPerSecond}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="space-y-3">
                <div className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Reference conversions
                </div>
                <div className="rounded-lg border bg-muted/30 p-4 font-mono text-sm leading-7 text-muted-foreground">
                  <div>50 KH/s = 0.00000000000005 EH/s</div>
                  <div>20 MH/s = 0.00000000002 EH/s</div>
                  <div>50 MH/s = 0.00000000005 EH/s</div>
                  <div>1 TH/s = 0.000001 EH/s</div>
                  <div>200 TH/s = 0.0002 EH/s</div>
                </div>
                <p className="text-sm leading-7 text-muted-foreground">
                  The single-device comparison and the multi-participant scenario tables below are
                  generated directly from these assumptions, so the copy, tables, and charts all
                  point back to the same calculations.
                </p>
              </div>
            </div>
            <BaselineSummaryCards />
          </CardContent>
        </Card>

        {maybeLiveNetworkHashRate && (
          <Card className="border-violet-500/20">
            <CardHeader className="p-4 sm:p-6">
              <div className="flex items-center gap-3">
                <Activity className="h-5 w-5 text-violet-400" />
                <CardTitle>Current Network Snapshot</CardTitle>
              </div>
              <CardDescription>
                Derived locally from live Bitcoin difficulty using difficulty × 2^32 / 600.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-4 pt-0 sm:p-6 sm:pt-0">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border bg-muted/30 p-4">
                  <div className="text-sm text-muted-foreground">Network difficulty</div>
                  <div className="mt-2 break-words text-xl font-semibold sm:text-2xl">
                    {maybeFormattedNetworkDifficulty ?? maybeNetworkDifficulty?.toLocaleString()}
                  </div>
                </div>
                <div className="rounded-lg border bg-muted/30 p-4">
                  <div className="text-sm text-muted-foreground">Approximate live hash rate</div>
                  <div className="mt-2 break-words text-xl font-semibold text-violet-200 sm:text-2xl">
                    {formatHashRate(maybeLiveNetworkHashRate)}
                  </div>
                </div>
              </div>
              <div className="rounded-lg border border-violet-500/20 bg-violet-500/5 p-4 text-sm leading-7 text-muted-foreground">
                <p>
                  The editorial tables on this page stay anchored to {FIXED_NETWORK_HASHRATE_LABEL}
                  , but the current estimate gives you a moving reference point for how far today’s
                  live network sits from that baseline.
                </p>
                {typeof maybeLiveBaselineDelta === "number" && (
                  <p className="mt-2">
                    Relative to the editorial baseline, the live estimate is{" "}
                    <span className="font-mono text-foreground">
                      {formatPercentOfNetwork(Math.abs(maybeLiveBaselineDelta))}
                    </span>{" "}
                    {maybeLiveBaselineDelta >= 0 ? "higher" : "lower"}.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Card>
        <CardHeader className="p-4 sm:p-6">
          <div className="flex items-center gap-3">
            <BarChart3 className="h-5 w-5 text-green-400" />
            <CardTitle>How Consumer Mining Scales Against the Network</CardTitle>
          </div>
          <CardDescription>
            Log-scale comparisons make the gap visible without flattening the slower hardware into
            zero.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8 p-4 pt-0 sm:p-6 sm:pt-0">
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2 text-base font-semibold sm:text-lg">
                <Smartphone className="h-4 w-4 text-cyan-400" />
                <span>Single-device baseline comparison</span>
              </div>
              <p className="text-sm text-muted-foreground">
                One logarithmic chart puts phone CPUs, laptop WebGPU, GPUs, BitAxe-class home
                miners, and ASICs on the same scale. Solid yellow marks the editorial network
                baseline, and dashed violet marks the live estimate when current difficulty is
                available.
              </p>
            </div>
            <ChartContainer
              config={CHART_CONFIG}
              className="h-[340px] w-full aspect-auto rounded-lg border bg-muted/20 p-2 sm:h-[380px] sm:p-3 lg:h-[420px]"
            >
              <LineChart
                data={[...HOME_MINING_DEVICE_BASELINE_CHART_DATA]}
                margin={baselineLineChartMargin}
              >
                <CartesianGrid vertical={false} />
                <YAxis
                  type="number"
                  scale="log"
                  domain={[1e4, 1e21]}
                  ticks={baselineHashRateAxisTicks}
                  tickFormatter={formatHashRate}
                  width={isMobile ? 72 : 94}
                  stroke="#94a3b8"
                  tick={chartTick}
                />
                <XAxis
                  type="category"
                  dataKey="chartLabel"
                  stroke="#94a3b8"
                  tick={chartTick}
                  interval={0}
                  angle={isMobile ? -22 : 0}
                  textAnchor={isMobile ? "end" : "middle"}
                  height={isMobile ? 72 : 36}
                  tickMargin={isMobile ? 10 : 8}
                />
                <Tooltip
                  content={({ active, payload }) => (
                    <BaselineChartTooltipCard active={active} payload={payload} />
                  )}
                />
                <ReferenceLine
                  y={FIXED_NETWORK_HASHRATE}
                  stroke={CHART_CONFIG.editorialBaseline.color}
                  strokeWidth={isMobile ? 1.5 : 2}
                  strokeDasharray="6 4"
                />
                {maybeLiveNetworkHashRate && (
                  <ReferenceLine
                    y={maybeLiveNetworkHashRate}
                    stroke={CHART_CONFIG.liveBaseline.color}
                    strokeWidth={isMobile ? 1.5 : 2}
                    strokeDasharray="2 6"
                  />
                )}
                <Line
                  type="monotone"
                  dataKey="hashRate"
                  stroke="#e2e8f0"
                  strokeWidth={isMobile ? 2 : 2.5}
                  activeDot={false}
                  dot={({ cx, cy, payload }) => (
                    <BaselineChartDot
                      cx={cx}
                      cy={cy}
                      maybeBaselineKey={(payload as HomeMiningDeviceBaselineChartPoint | undefined)?.baselineKey}
                      radius={isMobile ? 4 : 5}
                    />
                  )}
                />
              </LineChart>
            </ChartContainer>
          </div>

          <div className="space-y-4">
            <div>
              <div className="text-base font-semibold sm:text-lg">Combined hash rate vs participant count</div>
              <p className="text-sm text-muted-foreground">
                These three adoption scenarios use GPUs, 1 TH/s home miners, and 200 TH/s ASICs to
                show what changes once millions or billions of devices participate. Solid yellow
                marks the report baseline. Dashed violet marks the live estimate when current
                difficulty is available.
              </p>
            </div>
            <ChartContainer
              config={CHART_CONFIG}
              className="h-[280px] w-full aspect-auto rounded-lg border bg-muted/20 p-2 sm:h-[320px] sm:p-3 lg:h-[360px]"
            >
              <LineChart data={[...HOME_MINING_HASH_RATE_CHART_DATA]} margin={lineChartMargin}>
                <CartesianGrid vertical={false} />
                <XAxis
                  type="number"
                  dataKey="participantCount"
                  scale="log"
                  ticks={participantAxisTicks}
                  tickFormatter={formatShortParticipantCount}
                  domain={[1_000_000, 8_000_000_000]}
                  stroke="#94a3b8"
                  tick={chartTick}
                  tickMargin={isMobile ? 8 : 12}
                  minTickGap={isMobile ? 12 : 20}
                />
                <YAxis
                  type="number"
                  scale="log"
                  ticks={hashRateAxisTicks}
                  tickFormatter={formatHashRate}
                  domain={[1e13, 1e24]}
                  width={isMobile ? 68 : 90}
                  stroke="#94a3b8"
                  tick={chartTick}
                />
                <Tooltip
                  content={({ active, label, payload }) => (
                    <ChartTooltipCard
                      active={active}
                      label={label}
                      payload={payload}
                      labelFormatter={(currentLabel) => `${formatLongParticipantCount(Number(currentLabel))} participating`}
                      valueFormatter={(value) => formatHashRate(value)}
                    />
                  )}
                />
                <ChartLegend content={legendContent} />
                <ReferenceLine
                  y={FIXED_NETWORK_HASHRATE}
                  stroke={CHART_CONFIG.editorialBaseline.color}
                  strokeWidth={isMobile ? 1.5 : 2}
                  strokeDasharray="6 4"
                />
                {maybeLiveNetworkHashRate && (
                  <ReferenceLine
                    y={maybeLiveNetworkHashRate}
                    stroke={CHART_CONFIG.liveBaseline.color}
                    strokeWidth={isMobile ? 1.5 : 2}
                    strokeDasharray="2 6"
                  />
                )}
                <Line
                  type="monotone"
                  dataKey="gpu"
                  stroke={CHART_CONFIG.gpu.color}
                  strokeWidth={2.5}
                  dot={lineDot}
                />
                <Line
                  type="monotone"
                  dataKey="homeMiner"
                  stroke={CHART_CONFIG.homeMiner.color}
                  strokeWidth={2.5}
                  dot={lineDot}
                />
                <Line
                  type="monotone"
                  dataKey="asic"
                  stroke={CHART_CONFIG.asic.color}
                  strokeWidth={2.5}
                  dot={lineDot}
                />
              </LineChart>
            </ChartContainer>
          </div>

          <div className="space-y-4">
            <div>
              <div className="text-base font-semibold sm:text-lg">Percent of the global network</div>
              <p className="text-sm text-muted-foreground">
                Percentages stay anchored to the fixed {FIXED_NETWORK_HASHRATE_LABEL} editorial
                baseline so the scenario curves and the single-device baselines tell one consistent
                story.
              </p>
            </div>
            <ChartContainer
              config={CHART_CONFIG}
              className="h-[280px] w-full aspect-auto rounded-lg border bg-muted/20 p-2 sm:h-[320px] sm:p-3 lg:h-[360px]"
            >
              <LineChart data={[...HOME_MINING_PERCENT_CHART_DATA]} margin={lineChartMargin}>
                <CartesianGrid vertical={false} />
                <XAxis
                  type="number"
                  dataKey="participantCount"
                  scale="log"
                  ticks={participantAxisTicks}
                  tickFormatter={formatShortParticipantCount}
                  domain={[1_000_000, 8_000_000_000]}
                  stroke="#94a3b8"
                  tick={chartTick}
                  tickMargin={isMobile ? 8 : 12}
                  minTickGap={isMobile ? 12 : 20}
                />
                <YAxis
                  type="number"
                  scale="log"
                  ticks={percentAxisTicks}
                  tickFormatter={formatPercentOfNetwork}
                  domain={[1e-6, 1e6]}
                  width={isMobile ? 76 : 100}
                  stroke="#94a3b8"
                  tick={chartTick}
                />
                <Tooltip
                  content={({ active, label, payload }) => (
                    <ChartTooltipCard
                      active={active}
                      label={label}
                      payload={payload}
                      labelFormatter={(currentLabel) => `${formatLongParticipantCount(Number(currentLabel))} participating`}
                      valueFormatter={(value) => formatPercentOfNetwork(value)}
                    />
                  )}
                />
                <ChartLegend content={legendContent} />
                <Line
                  type="monotone"
                  dataKey="gpu"
                  stroke={CHART_CONFIG.gpu.color}
                  strokeWidth={2.5}
                  dot={lineDot}
                />
                <Line
                  type="monotone"
                  dataKey="homeMiner"
                  stroke={CHART_CONFIG.homeMiner.color}
                  strokeWidth={2.5}
                  dot={lineDot}
                />
                <Line
                  type="monotone"
                  dataKey="asic"
                  stroke={CHART_CONFIG.asic.color}
                  strokeWidth={2.5}
                  dot={lineDot}
                />
              </LineChart>
            </ChartContainer>
          </div>

          <div className="space-y-4">
            <div>
              <div className="text-base font-semibold sm:text-lg">
                Users needed to equal the network baseline
              </div>
              <p className="text-sm text-muted-foreground">
                This three-bar summary isolates the adoption scenarios; the single-device chart
                above shows the wider hardware ladder.
              </p>
            </div>
            <ChartContainer
              config={CHART_CONFIG}
              className="h-[260px] w-full aspect-auto rounded-lg border bg-muted/20 p-2 sm:h-[280px] sm:p-3 lg:h-[300px]"
            >
              <BarChart
                data={[...HOME_MINING_USERS_TO_EQUAL_NETWORK_CHART_DATA]}
                layout="vertical"
                margin={barChartMargin}
              >
                <CartesianGrid horizontal={false} />
                <XAxis
                  type="number"
                  scale="log"
                  domain={[1e6, 3e13]}
                  ticks={usersAxisTicks}
                  tickFormatter={formatShortParticipantCount}
                  stroke="#94a3b8"
                  tick={chartTick}
                  minTickGap={isMobile ? 12 : 20}
                />
                <YAxis
                  type="category"
                  dataKey="scenarioLabel"
                  width={isMobile ? 86 : 100}
                  stroke="#94a3b8"
                  tick={chartTick}
                />
                <Tooltip
                  content={({ active, label, payload }) => (
                    <ChartTooltipCard
                      active={active}
                      label={label}
                      payload={payload}
                      labelFormatter={(currentLabel) => String(currentLabel ?? "")}
                      valueFormatter={(value) => formatUsersNeededToEqualNetwork(value)}
                    />
                  )}
                />
                <Bar dataKey="usersNeeded" radius={[0, 6, 6, 0]}>
                  {HOME_MINING_USERS_TO_EQUAL_NETWORK_CHART_DATA.map((entry) => (
                    <Cell key={entry.scenarioKey} fill={CHART_CONFIG[entry.scenarioKey].color} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6">
        {HOME_MINING_SCENARIOS.map((scenario) => {
          const { Icon, insights } = getScenarioInsights(scenario);

          return (
            <Card key={scenario.key}>
              <CardHeader className="p-4 sm:p-6">
                <div className="flex items-center gap-3">
                  <Icon className="h-5 w-5 text-primary" />
                  <CardTitle>{scenario.title}</CardTitle>
                </div>
                <CardDescription>{scenario.narrative}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 p-4 pt-0 sm:p-6 sm:pt-0">
                <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                  <div className="rounded-lg border bg-muted/20 p-4 text-sm leading-7 text-muted-foreground">
                    <div className="mb-2 flex items-center gap-2 font-medium text-foreground">
                      <Info className="h-4 w-4 text-blue-400" />
                      Key insight
                    </div>
                    <ul className="space-y-2 pl-5">
                      {insights.map((insight) => (
                        <li key={insight} className="list-disc">
                          {insight}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-lg border bg-muted/20 p-4">
                    <div className="text-sm uppercase tracking-wide text-muted-foreground">
                      Users needed to equal {FIXED_NETWORK_HASHRATE_LABEL}
                    </div>
                    <div className="mt-3 break-words text-2xl font-semibold sm:text-3xl">
                      {scenario.usersNeededToEqualNetworkLabel}
                    </div>
                    <div className="mt-2 text-sm text-muted-foreground">
                      {scenario.shortTitle} hardware required to reach today’s editorial network
                      baseline.
                    </div>
                  </div>
                </div>
                <ScenarioTable rows={scenario.rows} />
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Card className="order-2 xl:order-1">
          <CardHeader className="p-4 sm:p-6">
            <div className="flex items-center gap-3">
              <Target className="h-5 w-5 text-yellow-400" />
              <CardTitle>Comparison Summary</CardTitle>
            </div>
            <CardDescription>
              Roughly zettahash-scale Bitcoin mining turns small device-level speed differences into
              massive network-level consequences.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
            <ComparisonSummary />
          </CardContent>
        </Card>

        <Card className="order-1 xl:order-2">
          <CardHeader className="p-4 sm:p-6">
            <div className="flex items-center gap-3">
              <Target className="h-5 w-5 text-yellow-400" />
              <CardTitle>Major Takeaways</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 p-4 pt-0 text-sm leading-7 text-muted-foreground sm:p-6 sm:pt-0">
            <div className="rounded-lg border bg-muted/20 p-4">
              <div className="font-medium text-foreground">1. Bitcoin mining is industrialized</div>
              <p className="mt-2">
                At nearly one zettahash per second, the network is far beyond the range where phone
                CPUs, laptop WebGPU, or incidental consumer GPUs can matter on their own.
              </p>
            </div>
            <div className="rounded-lg border bg-muted/20 p-4">
              <div className="font-medium text-foreground">
                2. Small home miners only matter at huge adoption
              </div>
              <p className="mt-2">
                Tens or hundreds of millions of 1 TH/s homes can become meaningful. The faster phone
                and laptop baselines still sit several more orders of magnitude below that.
              </p>
            </div>
            <div className="rounded-lg border bg-muted/20 p-4">
              <div className="font-medium text-foreground">3. ASIC efficiency dominates the outcome</div>
              <p className="mt-2">
                A 200 TH/s ASIC is about four million times faster than a 50 MH/s GPU, ten million
                times faster than a 20 MH/s MacBook WebGPU miner, and four billion times faster
                than a 50 KH/s iPhone CPU. That gap explains the industry’s hardware transition.
              </p>
            </div>
            <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-4">
              <div className="font-medium text-foreground">Near-zettahash perspective</div>
              <p className="mt-2">
                Reaching {formatHashRate(HASHES_PER_ZETTAHASH)} takes roughly{" "}
                {zettahashPerspective.iphoneCpu} iPhone CPUs,{" "}
                {zettahashPerspective.macbookWebGpu} MacBook Pro WebGPU miners,{" "}
                {zettahashPerspective.gpu} GPUs, {zettahashPerspective.homeMiner} 1 TH/s home
                miners, or {zettahashPerspective.asic} modern ASICs.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-green-500/20 bg-[radial-gradient(circle_at_left,_rgba(34,197,94,0.16),_transparent_35%),hsl(var(--card))]">
        <CardHeader className="p-4 sm:p-6">
          <div className="flex items-center gap-3">
            <ArrowRight className="h-5 w-5 text-green-400" />
            <CardTitle>What this means for home mining on this site</CardTitle>
          </div>
          <CardDescription>
            The takeaway is not that home mining is economically competitive. The takeaway is that
            it becomes legible, tangible, and a lot more interesting when you can see your own hash
            rate in context.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-0 text-sm leading-7 text-muted-foreground sm:p-6 sm:pt-0">
          <p>
            Browser-based mining is best understood as educational participation and lottery-style
            experimentation. It lets you feel the asymmetry directly: how many hashes your device
            can produce, how tiny that looks next to the network, how much faster laptop or desktop
            hardware can be, and why specialized home hardware changes the equation entirely.
          </p>
        </CardContent>
        <CardFooter className="flex-col items-stretch gap-3 p-4 pt-0 sm:items-start sm:p-6 sm:pt-0">
          <Button
            asChild
            size="lg"
            className="w-full justify-center bg-green-600 text-white hover:bg-green-700 sm:w-auto"
          >
            <TypedLink routeKeyName="simpleMining">
              Try Simple Mode
              <ArrowRight className="h-4 w-4" />
            </TypedLink>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
