import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SiteForm } from "@/components/admin/site-form";
import { createSiteAction } from "@/server/actions/sites";

export const metadata: Metadata = { title: "Thêm Site Mới" };

export default function NewSitePage() {
  return (
    <div>
      <PageHeader
        title="Thêm Site Mới"
        description="Tạo tenant website mới trong hệ thống 30Nice."
        action={
          <Link href="/admin/sites">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4" />
              Quay lại
            </Button>
          </Link>
        }
      />
      <Card>
        <CardContent className="pt-6">
          <SiteForm action={createSiteAction} isNew />
        </CardContent>
      </Card>
    </div>
  );
}
