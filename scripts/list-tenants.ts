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

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });

async function main() {
  const tenants = await prisma.tenant.findMany({
    include: {
      domains: true,
      _count: { select: { pages: true, posts: true, leads: true, mediaAssets: true, menus: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  console.log(`Tong so tenant: ${tenants.length}\n`);
  for (const t of tenants) {
    console.log(`- id: ${t.id}`);
    console.log(`  slug: ${t.slug}`);
    console.log(`  name: ${t.name}`);
    console.log(`  primaryDomain: ${t.primaryDomain ?? "(none)"}`);
    console.log(`  status: ${t.status}`);
    console.log(`  domains: ${t.domains.map((d) => d.host).join(", ") || "(none)"}`);
    console.log(`  counts: pages=${t._count.pages} posts=${t._count.posts} leads=${t._count.leads} media=${t._count.mediaAssets} menus=${t._count.menus}`);
    console.log("");
  }
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
