import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Check and expire premium orders every hour
crons.interval(
  "expire premium orders",
  { hours: 1 },
  internal.premium.expireOrders
);

export default crons;
