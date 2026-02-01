type Log = {
  log_id: string;
  server_id: string | null;
  message: string | null;
  message_lower: string | null;
  level: number | null;
  logged_at: Date | null;
  environment: string | null;
  userid: number | null;
  count: number | null;
};

export type { Log };