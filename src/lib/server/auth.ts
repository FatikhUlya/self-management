import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

type AuthResult = { ok: true; userId: string } | { ok: false; response: NextResponse };

/**
 * Verifies the Supabase access token sent as `Authorization: Bearer <jwt>`.
 * Every API route that spends money (Gemini) must call this first.
 */
export async function requireUser(request: NextRequest): Promise<AuthResult> {
  const header = request.headers.get('authorization') || '';
  const jwt = header.startsWith('Bearer ') ? header.slice(7).trim() : '';

  if (!jwt || !supabaseUrl || !supabaseAnonKey) {
    return { ok: false, response: NextResponse.json({ error: 'Silakan masuk terlebih dahulu.' }, { status: 401 }) };
  }

  const client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await client.auth.getUser(jwt);
  if (error || !data.user) {
    return { ok: false, response: NextResponse.json({ error: 'Sesi tidak valid. Silakan masuk ulang.' }, { status: 401 }) };
  }

  if (!rateLimit(data.user.id)) {
    return { ok: false, response: NextResponse.json({ error: 'Terlalu banyak permintaan. Coba lagi sebentar lagi.' }, { status: 429 }) };
  }

  return { ok: true, userId: data.user.id };
}

// Best-effort per-instance limiter (serverless instances don't share memory).
// It stops runaway loops and casual abuse; use Upstash/Vercel KV for a hard limit.
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 10;
const hits = new Map<string, number[]>();

function rateLimit(key: string): boolean {
  const now = Date.now();
  const recent = (hits.get(key) || []).filter(t => now - t < WINDOW_MS);
  if (recent.length >= MAX_PER_WINDOW) {
    hits.set(key, recent);
    return false;
  }
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) hits.clear();
  return true;
}
