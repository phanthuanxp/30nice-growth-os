import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getSession } from "@/server/auth/session";
import { KeywordProjectForm } from "@/components/admin/keyword-project-form";

export const metadata: Metadata = { title: "Tạo Keyword Project" };

export default async function NewKeywordProjectPage() {
  const session = await getSession();
  if (!session) redirect("/login?from=/admin/seo/keywords/new");

  return (
    <div>
      <PageHeader
        title="Tạo Keyword Project mới"
        description="Mỗi project là một chiến dịch nghiên cứu từ khóa độc lập."
        action={
          <Link href="/admin/seo/keywords">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4" />
              Quay lại
            </Button>
          </Link>
        }
      />

      <Card className="p-6 max-w-xl">
        <KeywordProjectForm />
      </Card>
    </div>
  );
}
