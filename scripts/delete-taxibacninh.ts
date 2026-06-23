import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import fs from "node:fs";
import path from "node:path";

function loadEnv(file: string) {
  const p = path.join(process.cwd(), file);
  if (!fs.existsSync(p)) return;
  for (const raw of fs.readFileSync(p, "utf8").split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const k = line.slice(0, eq).trim();
    let v = line.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    if (!process.env[k]) process.env[k] = v;
  }
}
loadEnv(".env.local");
loadEnv(".env");

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required");
}
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

async function main() {
  const slug = "taxi-bac-ninh";
  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    include: {
      settings: true,
      domains: true,
      pages: true,
      posts: true,
      categories: true,
      mediaAssets: true,
      menus: { include: { items: true } },
      leads: true,
      aiUsageLogs: true,
      seoAudits: true,
      integrations: true,
      automationJobs: true,
      analyticsEvents: true,
      members: true,
    },
  });

  if (!tenant) {
    console.log(`Tenant slug='${slug}' khong ton tai. Khong co gi de xoa.`);
    return;
  }

  console.log(`Tim thay tenant: ${tenant.name} (id=${tenant.id})`);
  console.log("Records lien quan:");
  console.log(`  - Pages:           ${tenant.pages.length}`);
  console.log(`  - Posts:           ${tenant.posts.length}`);
  console.log(`  - Categories:      ${tenant.categories.length}`);
  console.log(`  - Media:           ${tenant.mediaAssets.length}`);
  console.log(`  - Menus:           ${tenant.menus.length}`);
  console.log(`  - Leads:           ${tenant.leads.length}`);
  console.log(`  - Domains:         ${tenant.domains.length}`);
  console.log(`  - Members:         ${tenant.members.length}`);
  console.log(`  - AnalyticsEvents: ${tenant.analyticsEvents.length}`);
  console.log(`  - SeoAudits:       ${tenant.seoAudits.length}`);
  console.log(`  - AiUsageLogs:     ${tenant.aiUsageLogs.length}`);
  console.log(`  - Integrations:    ${tenant.integrations.length}`);
  console.log(`  - AutomationJobs:  ${tenant.automationJobs.length}`);
  console.log(`  - Settings:        ${tenant.settings ? "yes" : "no"}`);

  const backupDir = path.join(process.cwd(), ".backup-v2");
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  const backupFile = path.join(backupDir, `taxibacninh-pre-delete-${ts}.json`);
  fs.writeFileSync(backupFile, JSON.stringify(tenant, null, 2));
  console.log(`\nBackup saved: ${backupFile}`);

  const dryRun = process.argv.includes("--dry-run");
  if (dryRun) {
    console.log("\n[DRY-RUN] Khong xoa. Chay lai khong co --dry-run de thuc su xoa.");
    return;
  }

  console.log(`\nXoa tenant '${slug}' (cascade)...`);
  await prisma.tenant.delete({ where: { id: tenant.id } });
  const remaining = await prisma.tenant.findUnique({ where: { slug } });
  if (remaining) {
    console.log(`LOI: tenant van con sau khi xoa.`);
    process.exit(1);
  }
  console.log(`Da xoa tenant '${slug}' va toan bo records lien quan.`);
}

main()
  .catch((e) => {
    console.error("Loi:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
