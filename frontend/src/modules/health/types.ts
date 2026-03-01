export type HealthStatus = {
  status: string;
  message: string;
  database?: string;
};

export type DbStatus = 'connected' | 'disconnected' | 'checking';
