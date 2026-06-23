import { aiGenerate } from "@/server/ai/generate";

export type ClusterSuggestion = {
  label: string;
  pillar: string;
  members: string[];
};

const CLUSTER_SYSTEM = `Bạn là chuyên gia SEO chuyên về keyword clustering. Nhiệm vụ: nhóm danh sách từ khóa thành các cluster có chủ đề liên kết để xây dựng nội dung pillar-cluster. Mỗi cluster nên có 3-10 từ khóa. Trả về JSON array, mỗi phần tử: {"label":"Tên cluster ngắn gọn","pillar":"từ khóa chính của cluster","members":["kw1","kw2",...]}. Chỉ trả JSON thuần, không markdown.`;

export async function suggestClusters(keywords: string[]): Promise<ClusterSuggestion[]> {
  if (keywords.length === 0) return [];

  const batches: string[][] = [];
  for (let i = 0; i < keywords.length; i += 80) {
    batches.push(keywords.slice(i, i + 80));
  }

  const allClusters: ClusterSuggestion[] = [];

  for (const batch of batches) {
    try {
      const prompt = `Nhóm các từ khóa sau thành clusters SEO:\n${batch.join("\n")}`;
      const { text } = await aiGenerate(CLUSTER_SYSTEM, prompt);

      const jsonStr = text.trim().replace(/^```json?\s*/i, "").replace(/```\s*$/i, "");
      const parsed = JSON.parse(jsonStr) as Array<{ label: string; pillar: string; members: string[] }>;

      for (const c of parsed) {
        if (c.label && Array.isArray(c.members) && c.members.length > 0) {
          allClusters.push({
            label: c.label,
            pillar: c.pillar ?? c.members[0],
            members: c.members,
          });
        }
      }
    } catch {
      // On parse failure, create one big cluster per batch
      allClusters.push({
        label: `Cluster ${allClusters.length + 1}`,
        pillar: batch[0],
        members: batch,
      });
    }
  }

  return allClusters;
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}
