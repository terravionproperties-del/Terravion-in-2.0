import { query, queryOne } from "../lib/db";
import { headline, dailyTrend, bySource, byExecutive, funnel, activityFeed } from "../lib/repos/analytics";
import { listLeads } from "../lib/repos/leads";
import { countDuplicates } from "../lib/repos/duplicates";

async function main() {
  console.log("Running comprehensive CRM dashboard and database tests...");

  const dayStart = new Date();
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date();
  dayEnd.setHours(23, 59, 59, 999);
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const trendFrom = new Date(Date.now() - 29 * 864e5);

  console.log("1. Testing headline analytics...");
  const totals = await headline(dayStart, dayEnd, monthStart, null);
  console.log("   Headline totals:", totals);

  console.log("2. Testing dailyTrend...");
  const trend = await dailyTrend(trendFrom, dayEnd, null);
  console.log("   Daily trend points:", trend.length);

  console.log("3. Testing bySource...");
  const sources = await bySource(monthStart, null);
  console.log("   By source:", sources);

  console.log("4. Testing byExecutive...");
  const execs = await byExecutive(monthStart);
  console.log("   By executive:", execs.length);

  console.log("5. Testing funnel...");
  const stages = await funnel(monthStart, null);
  console.log("   Funnel stages:", stages.length);

  console.log("6. Testing activityFeed...");
  const feed = await activityFeed(12, null);
  console.log("   Activity feed:", feed.length);

  console.log("7. Testing countDuplicates...");
  const dupes = await countDuplicates();
  console.log("   Duplicates count:", dupes);

  console.log("8. Testing listLeads...");
  const leads = await listLeads({}, "all", "test-user");
  console.log("   Leads list total:", leads.total);

  console.log("\n🎉 ALL CRM DASHBOARD & REPOSITORY QUERIES PASSED WITH 100% SUCCESS!");
}

main().catch((err) => {
  console.error("❌ Test Failed:", err);
  process.exit(1);
});
