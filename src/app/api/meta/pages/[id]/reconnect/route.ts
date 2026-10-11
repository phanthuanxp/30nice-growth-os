import { NextResponse } from "next/server";
import { reconnectMetaPageById } from "@/server/meta/pages-service";

export const dynamic = "force-dynamic";

function errorResponse(error: unknown) {
  if (error instanceof Error && error.message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ error: error instanceof Error ? error.message : "Internal Server Error" }, { status: 500 });
}

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const result = await reconnectMetaPageById(id);
    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    return errorResponse(error);
  }
}
