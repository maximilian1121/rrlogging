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

export function AbbreviateNumber(Number: number, Decimals?: number): string {
    const dec = Decimals ?? 3;
    if (Number < 1) {
        return Number.toFixed(dec);
    }
    const log10 = Math.log10(Number);
    const power = Math.floor(log10 / 3) * 3;
    const scaled = Math.floor(Number / 10 ** power * 10 ** dec) / 10 ** dec;
    const suffixes = ["k", "M", "B", "T", "Qa", "Qn", "Sx", "Sp", "Oc", "N"];
    const suffix = suffixes[Math.floor(log10 / 3) - 1] || "";
    return scaled.toString() + suffix;
}