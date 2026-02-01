type Log = {
  log_id: any;
  server_id: string;
  message: string;
  message_lower: string;
  level: number;
  logged_at: Date;
  environment: string;
  userid: number | null;
  count: number | null;
};

export type { Log };