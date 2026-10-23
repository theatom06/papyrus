import { NextResponse } from "next/server";
import { listPoorPerformingPapers } from "@/db/db-service";
import { requireAdmin } from "@/lib/admin-auth";
import log from "@/lib/admin-logger";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  const papers = await listPoorPerformingPapers();
  await log("papers.poor_performing_list", { count: papers.length });
  return NextResponse.json({ papers });
}
