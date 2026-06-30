'use client';

import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { getSupabase } from '@/lib/supabase';
import AuthView from '@/components/AuthView';
import ChatView from '@/components/ChatView';

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const sb = getSupabase();

  async function upsertUser(authUser: User) {
    const meta = authUser.user_metadata || {};
    await sb.from('users').upsert(
      {
        id: authUser.id,
        email: authUser.email,
        auth_provider: authUser.app_metadata?.provider || 'email',
        google_id: meta.sub || null,
        display_name: meta.full_name || meta.name || authUser.email,
        last_login_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );
  }

  useEffect(() => {
    // Apply saved theme on initial load (before auth check)
    if (typeof window !== 'undefined') {
      if (localStorage.getItem('jarvis_theme') === 'light') {
        document.body.classList.add('light');
      }
    }

    // Init: restore session on load
    sb.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        await upsertUser(session.user);
        setUser(session.user);
      }
      setLoading(false);
    });

    // Auth state listener — mirrors original onAuthStateChange exactly
    const {
      data: { subscription },
    } = sb.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await upsertUser(session.user);
        setUser(session.user);
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Show nothing while checking session to avoid flash
  if (loading) return null;

  return (
    <>
      {/* Auth view — visible when no user */}
      {!user && <AuthView />}

      {/* Chat view — visible when user is authenticated */}
      {user && (
        <ChatView
          user={user}
          onLogout={() => setUser(null)}
        />
      )}
    </>
  );
}
