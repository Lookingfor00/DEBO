import { NextResponse } from "next/server";

import { listEnabledPlans } from "@/lib/api/plans";

export async function GET() {
  const plans = await listEnabledPlans();
  return NextResponse.json(plans);
}
