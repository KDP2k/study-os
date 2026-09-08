import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

  if (!url || !serviceKey) {
    return NextResponse.json({ ok: false, database: false, error: "Server Supabase environment variables are missing." }, { status: 500 });
  }

  try {
    const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { error } = await admin.from("notes").select("id", { count: "exact", head: true });
    if (error) {
      return NextResponse.json({ ok: false, database: false, error: error.message }, { status: 500 });
    }
    return NextResponse.json({
      ok: true,
      database: true,
      openaiConfigured: Boolean(process.env.OPENAI_API_KEY),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({ ok: false, database: false, error: error instanceof Error ? error.message : "Backend health check failed." }, { status: 500 });
  }
}
