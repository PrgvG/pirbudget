import type { HealthStatus } from './types';

function isHealthStatus(data: unknown): data is HealthStatus {
  return (
    typeof data === 'object' &&
    data !== null &&
    'status' in data &&
    'message' in data &&
    typeof (data as Record<string, unknown>).status === 'string' &&
    typeof (data as Record<string, unknown>).message === 'string'
  );
}

export async function fetchHealth(): Promise<HealthStatus> {
  const res = await fetch('/health');
  if (!res.ok) {
    throw new Error('Health check failed');
  }
  const data: unknown = await res.json();
  if (!isHealthStatus(data)) {
    throw new Error('Invalid health response');
  }
  return data;
}
