import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// 毎日 UTC 15:00 (JST 0:00) にnoteトライアル期限チェック
crons.daily("check-note-trial-expiration", { hourUTC: 15, minuteUTC: 0 }, internal.notePromo.cronCheckExpiringTrials);

export default crons;
