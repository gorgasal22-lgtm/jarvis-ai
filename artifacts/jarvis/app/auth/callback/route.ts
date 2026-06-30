import { NextResponse } from 'next/server';

/**
 * Supabase OAuth callback handler.
 * Supabase injects the session via URL hash which the client-side
 * onAuthStateChange listener picks up automatically when this page loads.
 * We simply redirect to root and let the client handle the session.
 */
export async function GET() {
  return NextResponse.redirect(
    process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  );
}
