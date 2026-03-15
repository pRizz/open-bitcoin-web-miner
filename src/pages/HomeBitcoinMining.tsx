import React from "react";
import { TypedLink } from "@/components/TypedLink";
import { PageTransition } from "@/components/PageTransition";
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
import { useNetworkInfo } from "@/contexts/NetworkInfoContext";
import {
  calculateUsersNeededToEqualNetwork,
  FIXED_NETWORK_HASHRATE,
  FIXED_NETWORK_HASHRATE_LABEL,
  HASH_RATE_UNIT_ROWS,
  HASHES_PER_ZETTAHASH,
  HOME_MINING_HASH_RATE_CHART_DATA,
  HOME_MINING_PERCENT_CHART_DATA,
  HOME_MINING_SCENARIOS,
  HOME_MINING_SCENARIOS_BY_KEY,
  HOME_MINING_USERS_TO_EQUAL_NETWORK_CHART_DATA,
  estimateBitcoinNetworkHashRateFromDifficulty,
  formatHashRate,
  formatLongParticipantCount,
  formatPercentOfNetwork,
  formatShortParticipantCount,
  formatUsersNeededToEqualNetwork,
} from "@/lib/homeBitcoinMiningReport";
import {
  Activity,
  ArrowRight,
  BarChart3,
  Calculator,
  Cpu,
  Home,
  Info,
  Target,
  Zap,
} from "lucide-react";
import { useMemo } from "react";
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
  gpu: { label: "Consumer GPUs", color: "#60a5fa" },
  homeMiner: { label: "1 TH/s home miners", color: "#34d399" },
  asic: { label: "200 TH/s ASICs", color: "#f97316" },
  editorialBaseline: { label: "Editorial baseline", color: "#facc15" },
  liveBaseline: { label: "Live estimate", color: "#a78bfa" },
} as const;

const HASH_RATE_AXIS_TICKS = [1e13, 1e15, 1e18, 1e21, 1e24];
const PERCENT_AXIS_TICKS = [1e-6, 1e-4, 1e-2, 1, 100, 10_000, 1_000_000];
const USERS_AXIS_TICKS = [1e6, 1e7, 1e9, 1e12, 1e13];

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
    <div className="min-w-[14rem] rounded-lg border border-border/70 bg-background/95 px-3 py-2 text-xs shadow-xl">
      <div className="mb-2 font-medium text-foreground">{labelFormatter(label)}</div>
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
              <div key={dataKey} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-sm"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-muted-foreground">
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

function ScenarioTable({
  rows,
}: {
  rows: typeof HOME_MINING_SCENARIOS[number]["rows"];
}) {
  return (
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
  );
}

export default function HomeBitcoinMiningPage() {
  const { maybeNetworkDifficulty, maybeFormattedNetworkDifficulty } = useNetworkInfo();

  const zettahashPerspective = useMemo(() => ({
    gpu: formatUsersNeededToEqualNetwork(
      calculateUsersNeededToEqualNetwork(HOME_MINING_SCENARIOS_BY_KEY.gpu.perUserHashRate, HASHES_PER_ZETTAHASH),
    ),
    homeMiner: formatUsersNeededToEqualNetwork(
      calculateUsersNeededToEqualNetwork(HOME_MINING_SCENARIOS_BY_KEY.homeMiner.perUserHashRate, HASHES_PER_ZETTAHASH),
    ),
    asic: formatUsersNeededToEqualNetwork(
      calculateUsersNeededToEqualNetwork(HOME_MINING_SCENARIOS_BY_KEY.asic.perUserHashRate, HASHES_PER_ZETTAHASH),
    ),
  }), []);

  const maybeLiveNetworkHashRate = useMemo(
    () => estimateBitcoinNetworkHashRateFromDifficulty(maybeNetworkDifficulty),
    [maybeNetworkDifficulty],
  );

  const maybeLiveBaselineDelta = useMemo(() => {
    if (!maybeLiveNetworkHashRate) {
      return undefined;
    }

    return ((maybeLiveNetworkHashRate - FIXED_NETWORK_HASHRATE) / FIXED_NETWORK_HASHRATE) * 100;
  }, [maybeLiveNetworkHashRate]);

  return (
    <PageTransition>
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6">
        <Card className="overflow-hidden border-blue-500/20 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.18),_transparent_38%),radial-gradient(circle_at_top_right,_rgba(250,204,21,0.14),_transparent_34%),hsl(var(--card))]">
          <CardHeader className="gap-4">
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
                <CardTitle className="text-4xl leading-tight">
                  Home mining is a scale problem before it is a software problem.
                </CardTitle>
                <CardDescription className="max-w-3xl text-base leading-7 text-muted-foreground">
                  This page compares three consumer mining scenarios against the Bitcoin network:
                  browser-era GPU speeds, 1 TH/s home miners, and modern 200 TH/s ASICs. The goal
                  is not to ask whether one device can “mine Bitcoin,” but whether home participation
                  can matter at all once it is measured against nearly a zettahash-scale network.
                </CardDescription>
              </div>
              <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                <div className="rounded-lg border border-white/10 bg-black/20 p-4">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">GPUs needed</div>
                  <div className="mt-2 text-2xl font-semibold">{HOME_MINING_SCENARIOS_BY_KEY.gpu.usersNeededToEqualNetworkLabel}</div>
                </div>
                <div className="rounded-lg border border-white/10 bg-black/20 p-4">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">1 TH/s homes needed</div>
                  <div className="mt-2 text-2xl font-semibold">{HOME_MINING_SCENARIOS_BY_KEY.homeMiner.usersNeededToEqualNetworkLabel}</div>
                </div>
                <div className="rounded-lg border border-white/10 bg-black/20 p-4">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">200 TH/s ASICs needed</div>
                  <div className="mt-2 text-2xl font-semibold">{HOME_MINING_SCENARIOS_BY_KEY.asic.usersNeededToEqualNetworkLabel}</div>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Calculator className="h-5 w-5 text-blue-400" />
                <CardTitle>Assumptions and Formula</CardTitle>
              </div>
              <CardDescription>
                The report keeps one editorial baseline so the tables, summary, and charts are comparable end to end.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border bg-muted/30 p-4">
                  <div className="text-sm font-medium text-foreground">Fixed network baseline</div>
                  <div className="mt-2 font-mono text-2xl text-yellow-300">{FIXED_NETWORK_HASHRATE_LABEL}</div>
                </div>
                <div className="rounded-lg border bg-muted/30 p-4">
                  <div className="text-sm font-medium text-foreground">Percent contribution</div>
                  <div className="mt-2 font-mono text-sm text-muted-foreground">
                    percentage = (combined_hashrate / {FIXED_NETWORK_HASHRATE_LABEL}) × 100
                  </div>
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
                <div className="space-y-3">
                  <div className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Unit conversions</div>
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
                  <div className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Reference conversions</div>
                  <div className="rounded-lg border bg-muted/30 p-4 font-mono text-sm leading-7 text-muted-foreground">
                    <div>50 MH/s = 0.00000000005 EH/s</div>
                    <div>1 TH/s = 0.000001 EH/s</div>
                    <div>200 TH/s = 0.0002 EH/s</div>
                  </div>
                  <p className="text-sm leading-7 text-muted-foreground">
                    The combined-rate tables below are generated directly from these per-user assumptions,
                    so the copy, tables, and charts all point back to the same calculations.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {maybeLiveNetworkHashRate && (
            <Card className="border-violet-500/20">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Activity className="h-5 w-5 text-violet-400" />
                  <CardTitle>Current Network Snapshot</CardTitle>
                </div>
                <CardDescription>
                  Derived locally from live Bitcoin difficulty using difficulty × 2^32 / 600.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-lg border bg-muted/30 p-4">
                    <div className="text-sm text-muted-foreground">Network difficulty</div>
                    <div className="mt-2 text-2xl font-semibold">
                      {maybeFormattedNetworkDifficulty ?? maybeNetworkDifficulty?.toLocaleString()}
                    </div>
                  </div>
                  <div className="rounded-lg border bg-muted/30 p-4">
                    <div className="text-sm text-muted-foreground">Approximate live hash rate</div>
                    <div className="mt-2 text-2xl font-semibold text-violet-200">{formatHashRate(maybeLiveNetworkHashRate)}</div>
                  </div>
                </div>
                <div className="rounded-lg border border-violet-500/20 bg-violet-500/5 p-4 text-sm leading-7 text-muted-foreground">
                  <p>
                    The editorial tables on this page stay anchored to {FIXED_NETWORK_HASHRATE_LABEL}, but the
                    current estimate gives you a moving reference point for how far today’s live network sits from that baseline.
                  </p>
                  {typeof maybeLiveBaselineDelta === "number" && (
                    <p className="mt-2">
                      Relative to the editorial baseline, the live estimate is{" "}
                      <span className="font-mono text-foreground">{formatPercentOfNetwork(Math.abs(maybeLiveBaselineDelta))}</span>{" "}
                      {maybeLiveBaselineDelta >= 0 ? "higher" : "lower"}.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <BarChart3 className="h-5 w-5 text-green-400" />
              <CardTitle>How Consumer Mining Scales Against the Network</CardTitle>
            </div>
            <CardDescription>
              Log-scale charts make the gap visible without hiding the smaller hardware classes.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="space-y-4">
              <div>
                <div className="text-lg font-semibold">Combined hash rate vs participant count</div>
                <p className="text-sm text-muted-foreground">
                  Solid yellow marks the report baseline. Dashed violet marks the live estimate when current difficulty is available.
                </p>
              </div>
              <ChartContainer
                config={CHART_CONFIG}
                className="h-[360px] w-full aspect-auto rounded-lg border bg-muted/20 p-2"
              >
                <LineChart data={[...HOME_MINING_HASH_RATE_CHART_DATA]} margin={{ top: 20, right: 12, left: 12, bottom: 8 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    type="number"
                    dataKey="participantCount"
                    scale="log"
                    ticks={[...HOME_MINING_HASH_RATE_CHART_DATA.map((point) => point.participantCount)]}
                    tickFormatter={formatShortParticipantCount}
                    domain={[1_000_000, 8_000_000_000]}
                    stroke="#94a3b8"
                  />
                  <YAxis
                    type="number"
                    scale="log"
                    ticks={HASH_RATE_AXIS_TICKS}
                    tickFormatter={formatHashRate}
                    domain={[1e13, 1e24]}
                    width={90}
                    stroke="#94a3b8"
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
                  <ChartLegend content={<ChartLegendContent />} />
                  <ReferenceLine
                    y={FIXED_NETWORK_HASHRATE}
                    stroke={CHART_CONFIG.editorialBaseline.color}
                    strokeWidth={2}
                    strokeDasharray="6 4"
                  />
                  {maybeLiveNetworkHashRate && (
                    <ReferenceLine
                      y={maybeLiveNetworkHashRate}
                      stroke={CHART_CONFIG.liveBaseline.color}
                      strokeWidth={2}
                      strokeDasharray="2 6"
                    />
                  )}
                  <Line
                    type="monotone"
                    dataKey="gpu"
                    stroke={CHART_CONFIG.gpu.color}
                    strokeWidth={2.5}
                    dot={{ r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="homeMiner"
                    stroke={CHART_CONFIG.homeMiner.color}
                    strokeWidth={2.5}
                    dot={{ r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="asic"
                    stroke={CHART_CONFIG.asic.color}
                    strokeWidth={2.5}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ChartContainer>
            </div>

            <div className="space-y-4">
              <div>
                <div className="text-lg font-semibold">Percent of the global network</div>
                <p className="text-sm text-muted-foreground">
                  Percentages stay anchored to the fixed {FIXED_NETWORK_HASHRATE_LABEL} editorial baseline for consistency.
                </p>
              </div>
              <ChartContainer
                config={CHART_CONFIG}
                className="h-[360px] w-full aspect-auto rounded-lg border bg-muted/20 p-2"
              >
                <LineChart data={[...HOME_MINING_PERCENT_CHART_DATA]} margin={{ top: 20, right: 12, left: 12, bottom: 8 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    type="number"
                    dataKey="participantCount"
                    scale="log"
                    ticks={[...HOME_MINING_PERCENT_CHART_DATA.map((point) => point.participantCount)]}
                    tickFormatter={formatShortParticipantCount}
                    domain={[1_000_000, 8_000_000_000]}
                    stroke="#94a3b8"
                  />
                  <YAxis
                    type="number"
                    scale="log"
                    ticks={PERCENT_AXIS_TICKS}
                    tickFormatter={formatPercentOfNetwork}
                    domain={[1e-6, 1e6]}
                    width={100}
                    stroke="#94a3b8"
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
                  <ChartLegend content={<ChartLegendContent />} />
                  <Line
                    type="monotone"
                    dataKey="gpu"
                    stroke={CHART_CONFIG.gpu.color}
                    strokeWidth={2.5}
                    dot={{ r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="homeMiner"
                    stroke={CHART_CONFIG.homeMiner.color}
                    strokeWidth={2.5}
                    dot={{ r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="asic"
                    stroke={CHART_CONFIG.asic.color}
                    strokeWidth={2.5}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ChartContainer>
            </div>

            <div className="space-y-4">
              <div>
                <div className="text-lg font-semibold">Users needed to equal the network baseline</div>
                <p className="text-sm text-muted-foreground">
                  This is the cleanest summary of why hardware efficiency dominates Bitcoin mining.
                </p>
              </div>
              <ChartContainer
                config={CHART_CONFIG}
                className="h-[300px] w-full aspect-auto rounded-lg border bg-muted/20 p-2"
              >
                <BarChart
                  data={[...HOME_MINING_USERS_TO_EQUAL_NETWORK_CHART_DATA]}
                  layout="vertical"
                  margin={{ top: 20, right: 24, left: 24, bottom: 8 }}
                >
                  <CartesianGrid horizontal={false} />
                  <XAxis
                    type="number"
                    scale="log"
                    domain={[1e6, 3e13]}
                    ticks={USERS_AXIS_TICKS}
                    tickFormatter={formatShortParticipantCount}
                    stroke="#94a3b8"
                  />
                  <YAxis
                    type="category"
                    dataKey="scenarioLabel"
                    width={100}
                    stroke="#94a3b8"
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
                      <Cell
                        key={entry.scenarioKey}
                        fill={CHART_CONFIG[entry.scenarioKey].color}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6">
          {HOME_MINING_SCENARIOS.map((scenario) => {
            const icon = scenario.key === "gpu" ? Cpu : scenario.key === "homeMiner" ? Home : Zap;
            const insights = scenario.key === "gpu"
              ? GPU_INSIGHTS
              : scenario.key === "homeMiner"
                ? HOME_MINER_INSIGHTS
                : ASIC_INSIGHTS;
            const Icon = icon;

            return (
              <Card key={scenario.key}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5 text-primary" />
                    <CardTitle>{scenario.title}</CardTitle>
                  </div>
                  <CardDescription>{scenario.narrative}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                    <div className="rounded-lg border bg-muted/20 p-4 text-sm leading-7 text-muted-foreground">
                      <div className="mb-2 flex items-center gap-2 font-medium text-foreground">
                        <Info className="h-4 w-4 text-blue-400" />
                        Key insight
                      </div>
                      <ul className="space-y-2">
                        {insights.map((insight) => (
                          <li key={insight}>• {insight}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-lg border bg-muted/20 p-4">
                      <div className="text-sm uppercase tracking-wide text-muted-foreground">Users needed to equal {FIXED_NETWORK_HASHRATE_LABEL}</div>
                      <div className="mt-3 text-3xl font-semibold">{scenario.usersNeededToEqualNetworkLabel}</div>
                      <div className="mt-2 text-sm text-muted-foreground">
                        {scenario.shortTitle} hardware required to reach today’s editorial network baseline.
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
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Target className="h-5 w-5 text-yellow-400" />
                <CardTitle>Comparison Summary</CardTitle>
              </div>
              <CardDescription>
                Roughly zettahash-scale Bitcoin mining turns device-level differences into network-level consequences.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table className="min-w-[520px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Hardware</TableHead>
                    <TableHead>Hash rate per user</TableHead>
                    <TableHead>Users needed to equal network</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {HOME_MINING_SCENARIOS.map((scenario) => (
                    <TableRow key={scenario.key}>
                      <TableCell>{scenario.shortTitle}</TableCell>
                      <TableCell className="font-mono">{scenario.perUserHashRateLabel}</TableCell>
                      <TableCell>{scenario.usersNeededToEqualNetworkLabel}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Target className="h-5 w-5 text-yellow-400" />
                <CardTitle>Major Takeaways</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-7 text-muted-foreground">
              <div className="rounded-lg border bg-muted/20 p-4">
                <div className="font-medium text-foreground">1. Bitcoin mining is industrialized</div>
                <p className="mt-2">
                  At nearly one zettahash per second, the network is far beyond the range where incidental consumer GPUs can matter.
                </p>
              </div>
              <div className="rounded-lg border bg-muted/20 p-4">
                <div className="font-medium text-foreground">2. Small home miners only matter at huge adoption</div>
                <p className="mt-2">
                  Tens or hundreds of millions of 1 TH/s homes can become meaningful. Anything much smaller still sits at the margins.
                </p>
              </div>
              <div className="rounded-lg border bg-muted/20 p-4">
                <div className="font-medium text-foreground">3. ASIC efficiency dominates the outcome</div>
                <p className="mt-2">
                  A 200 TH/s ASIC is about four million times faster than a 50 MH/s GPU. That gap explains the industry’s hardware transition.
                </p>
              </div>
              <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-4">
                <div className="font-medium text-foreground">Near-zettahash perspective</div>
                <p className="mt-2">
                  Reaching {formatHashRate(HASHES_PER_ZETTAHASH)} takes roughly {zettahashPerspective.gpu} GPUs,
                  {zettahashPerspective.homeMiner} 1 TH/s home miners, or {zettahashPerspective.asic} modern ASICs.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-green-500/20 bg-[radial-gradient(circle_at_left,_rgba(34,197,94,0.16),_transparent_35%),hsl(var(--card))]">
          <CardHeader>
            <div className="flex items-center gap-3">
              <ArrowRight className="h-5 w-5 text-green-400" />
              <CardTitle>What this means for home mining on this site</CardTitle>
            </div>
            <CardDescription>
              The takeaway is not that home mining is economically competitive. The takeaway is that it becomes legible, tangible, and a lot more interesting when you can see your own hash rate in context.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm leading-7 text-muted-foreground">
            <p>
              Browser-based mining is best understood as educational participation and lottery-style experimentation.
              It lets you feel the asymmetry directly: how many hashes your device can produce, how tiny that looks
              next to the network, and why specialized home hardware changes the equation.
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild size="lg" className="bg-green-600 text-white hover:bg-green-700">
              <TypedLink routeKeyName="simpleMining">
                Try Simple Mode
                <ArrowRight className="h-4 w-4" />
              </TypedLink>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </PageTransition>
  );
}
