"use server";

import { revalidatePath } from "next/cache";
import { promises as dns } from "node:dns";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import { z } from "zod";
import { prisma } from "@/server/db";
import { requireTenantAccess } from "@/server/permissions/guard";

const execAsync = promisify(exec);

export type DomainActionState = { ok?: boolean; error?: string; resolved?: string[] };

const hostSchema = z
  .string()
  .min(3)
  .max(253)
  .regex(/^(?!-)[a-z0-9-]{1,63}(?<!-)(\.(?!-)[a-z0-9-]{1,63}(?<!-))+$/i, "Domain không hợp lệ");

export async function addDomainAction(tenantId: string, rawHost: string): Promise<DomainActionState> {
  try {
    await requireTenantAccess(tenantId, "TENANT_ADMIN");
    const host = rawHost.trim().toLowerCase()
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .replace(/\/.*$/, "");
    const parsed = hostSchema.safeParse(host);
    if (!parsed.success) return { error: "Domain không hợp lệ (vd: taxiabc.vn)" };

    const exists = await prisma.domain.findUnique({ where: { host: parsed.data } });
    if (exists) return { error: "Domain này đã được thêm vào hệ thống" };

    const isFirst = (await prisma.domain.count({ where: { tenantId } })) === 0;
    await prisma.domain.create({
      data: { tenantId, host: parsed.data, primary: isFirst },
    });
    revalidatePath(`/admin/sites/${tenantId}/settings`);
    return { ok: true };
  } catch (err) {
    console.error("addDomainAction:", err);
    return { error: "Lỗi khi thêm domain" };
  }
}

export async function deleteDomainAction(tenantId: string, domainId: string): Promise<DomainActionState> {
  try {
    await requireTenantAccess(tenantId, "TENANT_ADMIN");
    const owned = await prisma.domain.findUnique({ where: { id: domainId }, select: { tenantId: true, host: true } });
    if (!owned || owned.tenantId !== tenantId) return { error: "Domain không thuộc site này" };
    await prisma.domain.delete({ where: { id: domainId } });
    revalidatePath(`/admin/sites/${tenantId}/settings`);
    return { ok: true };
  } catch (err) {
    console.error("deleteDomainAction:", err);
    return { error: "Lỗi khi xóa domain" };
  }
}

export async function setPrimaryDomainAction(tenantId: string, domainId: string): Promise<DomainActionState> {
  try {
    await requireTenantAccess(tenantId, "TENANT_ADMIN");
    const domain = await prisma.domain.findUnique({ where: { id: domainId }, select: { host: true, tenantId: true } });
    if (!domain || domain.tenantId !== tenantId) return { error: "Không tìm thấy domain" };

    await prisma.$transaction([
      prisma.domain.updateMany({ where: { tenantId }, data: { primary: false } }),
      prisma.domain.update({ where: { id: domainId }, data: { primary: true } }),
      prisma.tenant.update({ where: { id: tenantId }, data: { primaryDomain: domain.host } }),
    ]);
    revalidatePath(`/admin/sites/${tenantId}/settings`);
    return { ok: true };
  } catch (err) {
    console.error("setPrimaryDomainAction:", err);
    return { error: "Lỗi khi đặt domain chính" };
  }
}

export async function verifyDomainAction(tenantId: string, domainId: string): Promise<DomainActionState> {
  try {
    await requireTenantAccess(tenantId, "TENANT_ADMIN");
    const domain = await prisma.domain.findUnique({ where: { id: domainId }, select: { host: true, tenantId: true } });
    if (!domain || domain.tenantId !== tenantId) return { error: "Không tìm thấy domain" };

    const serverIp = process.env.SERVER_PUBLIC_IP?.trim() ?? "5.189.185.36";

    let addresses: string[] = [];
    try {
      addresses = await dns.resolve4(domain.host);
    } catch {
      return { error: `Chưa phân giải được DNS cho ${domain.host}. Hãy tạo bản ghi A trỏ về ${serverIp} và đợi 5–30 phút.` };
    }

    const verified = addresses.includes(serverIp);
    await prisma.domain.update({ where: { id: domainId }, data: { verified } });
    revalidatePath(`/admin/sites/${tenantId}/settings`);

    if (!verified) {
      return {
        error: `DNS đang trỏ về ${addresses.join(", ")} — chưa khớp IP server (${serverIp}). Cập nhật bản ghi A và thử lại sau vài phút.`,
        resolved: addresses,
      };
    }

    // DNS verified → auto provision nginx + SSL (non-blocking, log errors only)
    provisionNginxSsl(domain.host).catch((e) =>
      console.error(`[provision] Failed for ${domain.host}:`, e)
    );

    return { ok: true, resolved: addresses };
  } catch (err) {
    console.error("verifyDomainAction:", err);
    return { error: "Lỗi khi xác thực domain" };
  }
}

export async function provisionDomainAction(tenantId: string, domainId: string): Promise<DomainActionState> {
  try {
    await requireTenantAccess(tenantId, "TENANT_ADMIN");
    const domain = await prisma.domain.findUnique({ where: { id: domainId }, select: { host: true, tenantId: true, verified: true } });
    if (!domain || domain.tenantId !== tenantId) return { error: "Không tìm thấy domain" };
    if (!domain.verified) return { error: "Domain chưa được xác thực DNS. Hãy verify trước." };

    await provisionNginxSsl(domain.host);
    return { ok: true };
  } catch (err) {
    return { error: `Lỗi provision: ${String(err)}` };
  }
}

async function provisionNginxSsl(host: string): Promise<void> {
  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@30nice.vn";
  const script = `/usr/local/bin/provision-site-domain.sh`;
  const { stdout, stderr } = await execAsync(`bash ${script} "${host}" "${adminEmail}"`, {
    timeout: 120_000,
  });
  if (stdout) console.log(`[provision:${host}]`, stdout);
  if (stderr) console.error(`[provision:${host}]`, stderr);
}
