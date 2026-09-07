import { bucketedReport, sourceBreakdown, executiveBreakdown, clampRange, reportProjects, reportOwners } from "../lib/repos/reports";

async function main() {
  console.log("Testing Reports queries...");

  const range = clampRange('DAY', new Date('2026-07-12'), new Date('2026-08-11T23:59:59.999Z'));
  const args = { period: 'DAY' as const, from: range.from, to: range.to, projectId: null, ownerId: null, source: null, mine: null };

  console.log("1. Running bucketedReport...");
  const buckets = await bucketedReport(args);
  console.log("   Buckets count:", buckets.length);
  if (buckets.length > 0) {
    console.log("   First bucket:", buckets[0]);
    console.log("   b.Leads type:", typeof buckets[0].Leads, "value:", buckets[0].Leads);
  }

  console.log("2. Running sourceBreakdown...");
  const sources = await sourceBreakdown(args);
  console.log("   Sources count:", sources.length);

  console.log("3. Running executiveBreakdown...");
  const execs = await executiveBreakdown(args);
  console.log("   Execs count:", execs.length);

  console.log("4. Running reportProjects and reportOwners...");
  const projects = await reportProjects();
  const owners = await reportOwners();
  console.log("   Projects:", projects.length, "Owners:", owners.length);

  console.log("\n✅ ALL REPORT QUERIES PASSED!");
}

main().catch((err) => {
  console.error("❌ Reports Test Failed:", err);
  process.exit(1);
});
