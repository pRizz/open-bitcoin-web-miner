export type BuildInfo = {
  version: string;
  builtAtIso: string;
  commitSha?: string;
  commitShortSha?: string;
  commitUrl?: string;
};

function maybeBuildValue(value: string): string | undefined {
  return value.trim() ? value : undefined;
}

export function formatBuildTimestamp(builtAtIso: string): string {
  const maybeDateSeparatorIndex = builtAtIso.indexOf('T');

  if (maybeDateSeparatorIndex === -1 || builtAtIso.length < 16) {
    return builtAtIso;
  }

  return `${builtAtIso.slice(0, 16).replace('T', ' ')} UTC`;
}

export const buildInfo: BuildInfo = {
  version: import.meta.env.PACKAGE_VERSION,
  builtAtIso: import.meta.env.BUILD_TIME,
  commitSha: maybeBuildValue(import.meta.env.GIT_COMMIT_SHA),
  commitShortSha: maybeBuildValue(import.meta.env.GIT_COMMIT_SHORT_SHA),
  commitUrl: maybeBuildValue(import.meta.env.GIT_COMMIT_URL),
};
