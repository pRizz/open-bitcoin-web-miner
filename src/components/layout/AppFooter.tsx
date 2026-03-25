import React from "react";
import { TypedLink } from "@/components/TypedLink";
import { buildInfo, formatBuildTimestamp } from "@/lib/buildInfo";
import type { RouteName } from "@/routes";
import { SourceCodeLink } from "@/components/SourceCodeLink";

const footerLinks: Array<{ label: string; routeKeyName: RouteName }> = [
  { label: "Home", routeKeyName: "home" },
  { label: "Leaderboard", routeKeyName: "leaderboard" },
  { label: "Mining Viability", routeKeyName: "homeBitcoinMining" },
  { label: "About", routeKeyName: "about" },
];

export function AppFooter() {
  const formattedBuildTimestamp = formatBuildTimestamp(buildInfo.builtAtIso);
  const shouldShowCommitLink = Boolean(
    buildInfo.commitShortSha && buildInfo.commitUrl,
  );
  const provenanceLabel = [buildInfo.branchName, buildInfo.deployHost]
    .filter(Boolean)
    .join(" @ ");
  const provenanceTitle = [
    buildInfo.branchName ? `Branch: ${buildInfo.branchName}` : undefined,
    buildInfo.deployHost ? `Canonical host: ${buildInfo.deployHost}` : undefined,
  ]
    .filter(Boolean)
    .join("\n");
  const commitTitle = [
    buildInfo.commitSha ? `Commit: ${buildInfo.commitSha}` : undefined,
    provenanceTitle || undefined,
  ]
    .filter(Boolean)
    .join("\n");

  return (
    <footer className="border-t border-border/80 bg-background/95">
      <div className="flex flex-col gap-4 px-6 py-4 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground/70">
            Win3Bitco.in
          </span>
          {footerLinks.map((link) => (
            <TypedLink
              key={link.routeKeyName}
              routeKeyName={link.routeKeyName}
              className="transition-colors duration-200 hover:text-foreground"
            >
              {link.label}
            </TypedLink>
          ))}
          <SourceCodeLink
            mode="labeled"
            labeledDisplay="link"
          />
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs md:justify-end">
          <span>v{buildInfo.version}</span>
          <span title={buildInfo.builtAtIso}>
            Built {formattedBuildTimestamp}
          </span>
          {provenanceLabel && (
            <span title={provenanceTitle}>
              {provenanceLabel}
            </span>
          )}
          {shouldShowCommitLink && (
            <a
              className="transition-colors duration-200 hover:text-foreground"
              href={buildInfo.commitUrl}
              rel="noreferrer noopener"
              target="_blank"
              title={commitTitle}
            >
              Commit {buildInfo.commitShortSha}
            </a>
          )}
        </div>
      </div>
    </footer>
  );
}
