import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdir, writeFile, appendFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const execute = promisify(execFile);
export const runDirectory = resolve('.codex/domains', new Date().toISOString().replaceAll(':', '-'));

export async function initializeRun() {
  await mkdir(runDirectory, { recursive: true, mode: 0o700 });
}

export async function log(message: string) {
  const line = `${new Date().toISOString()} ${message}`;
  console.log(line);
  await appendFile(join(runDirectory, 'run.log'), line + '\n', { mode: 0o600 });
}

export async function snapshot(name: string, value: unknown): Promise<string> {
  const target = join(runDirectory, name + '.json');
  await writeFile(target, JSON.stringify(value, null, 2) + '\n', { mode: 0o600 });
  return target;
}

export async function cli<T>(executable: string, args: string[]): Promise<T> {
  const result = await execute(executable, args, { timeout: 60_000, maxBuffer: 8 * 1024 * 1024 });
  return result.stdout.trim() ? JSON.parse(result.stdout) as T : undefined as T;
}

export function aws<T>(...args: string[]): Promise<T> {
  return cli<T>('aws', [...args, '--region', 'us-east-1', '--output', 'json', '--no-cli-pager',
    '--cli-connect-timeout', '10', '--cli-read-timeout', '30']);
}

export async function waitFor(label: string, probe: () => Promise<boolean>, timeoutMs = 20 * 60_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await probe()) { await log(`${label}: ready`); return; }
    await log(`Waiting for ${label}`);
    await new Promise(resolve => setTimeout(resolve, 20_000));
  }
  throw new Error(`Timed out waiting for ${label}; rerun the same phase to resume`);
}
