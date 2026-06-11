import type { Metadata } from "next";
import { Brain, Info } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AiProviderCard } from "@/components/admin/ai-provider-card";
import { getAiProviderConfigs } from "@/server/queries/ai-providers";
import type { AiProvider } from "@/app/api/ai/generate/route";

export const metadata: Metadata = { title: "Cấu hình AI Providers" };

const PROVIDERS: AiProvider[] = ["claude", "openai", "gemini", "niner_router"];

function getEnvConfigured(): Record<string, boolean> {
  return {
    claude: !!(process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_API_KEY.startsWith("sk-ant-api03-...")),
    openai: !!(process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY.startsWith("sk-...")),
    gemini: !!(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "YOUR_GEMINI_KEY"),
    niner_router: !!(process.env.NINER_ROUTER_API_KEY && process.env.NINER_ROUTER_API_KEY !== "YOUR_9ROUTER_KEY"),
  };
}

export default async function AiSettingsPage() {
  let configs: Awaited<ReturnType<typeof getAiProviderConfigs>> = [];
  let isDemo = false;

  try {
    configs = await getAiProviderConfigs();
  } catch {
    isDemo = true;
  }

  const envConfigured = getEnvConfigured();
  const configMap = Object.fromEntries(configs.map((c) => [c.provider, c]));

  const defaultProvider = configs.find((c) => c.isDefault);
  const fallbackProvider = configs.find((c) => c.isFallback);

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader
        title="Cấu hình AI Providers"
        description="Quản lý API key, chọn provider mặc định và dự phòng cho toàn hệ thống."
      />

      {isDemo && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-700">
          Chưa kết nối database — cấu hình sẽ được lưu khi database hoạt động.
        </div>
      )}

      {/* Current default/fallback summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Brain className="h-4 w-4 text-indigo-500" />
            Trạng thái hiện tại
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-xs font-medium text-slate-500 mb-1">Provider mặc định</p>
            {defaultProvider
              ? <p className="text-sm font-semibold text-slate-800">{defaultProvider.label}</p>
              : <p className="text-sm text-slate-400 italic">Chưa chọn — dùng Claude nếu có key</p>
            }
          </div>
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-xs font-medium text-slate-500 mb-1">Provider dự phòng</p>
            {fallbackProvider
              ? <p className="text-sm font-semibold text-slate-800">{fallbackProvider.label}</p>
              : <p className="text-sm text-slate-400 italic">Chưa chọn</p>
            }
          </div>
        </CardContent>
      </Card>

      {/* Provider cards */}
      <div className="space-y-3">
        {PROVIDERS.map((provider) => (
          <AiProviderCard
            key={provider}
            provider={provider}
            config={configMap[provider] ?? null}
            envConfigured={envConfigured[provider] ?? false}
          />
        ))}
      </div>

      {/* Info box */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xs text-slate-500">
            <Info className="h-3.5 w-3.5" />
            Cách hoạt động
          </CardTitle>
          <CardDescription className="text-xs space-y-1">
            <p>• <strong>Provider mặc định</strong>: được chọn tự động khi người dùng không chỉ định provider cụ thể.</p>
            <p>• <strong>Provider dự phòng</strong>: dùng khi provider mặc định gặp lỗi hoặc hết quota.</p>
            <p>• Cấu hình lưu trong DB <strong>ưu tiên cao hơn</strong> biến môi trường (.env).</p>
            <p>• Tắt checkbox &quot;Kích hoạt&quot; để tạm ngừng provider mà không xóa API key.</p>
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
