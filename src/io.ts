import { readFile } from 'node:fs/promises';

export async function readJsonFile(path: string): Promise<unknown> {
  const raw = await readFile(path, 'utf8');
  return JSON.parse(raw) as unknown;
}

export function parseRequirements(requirements: string | undefined): unknown {
  if (!requirements || requirements.trim().length === 0) {
    throw new Error('Order requirements were empty. CAP Sentinel expects a JSON payload.');
  }

  try {
    return JSON.parse(requirements) as unknown;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Order requirements must be valid JSON: ${message}`);
  }
}
