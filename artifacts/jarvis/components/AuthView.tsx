'use client';

import { useState } from 'react';
import GeorgianFlag from './GeorgianFlag';
import { getSupabase } from '@/lib/supabase';

export default function AuthView() {
  const [email, setEmail] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<'pro' | 'max'>('pro');
  const [error, setError] = useState<{ text: string; isSuccess: boolean } | null>(null);
  const [isSending, setIsSending] = useState(false);

  const sb = getSupabase();

  function showAuthError(msg: string, isSuccess = false) {
    setError({ text: msg, isSuccess });
  }
  function clearAuthError() {
    setError(null);
  }

  async function handleGoogleLogin() {
    clearAuthError();
    const { error } = await sb.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.href },
    });
    if (error) showAuthError('Google ავტორიზაცია ვერ მოხერხდა: ' + error.message);
  }

  async function handleContinue() {
    clearAuthError();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showAuthError('გთხოვთ შეიყვანოთ სწორი ელ-ფოსტა ან გამოიყენოთ Google');
      return;
    }
    setIsSending(true);
    const { error } = await sb.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.href },
    });
    setIsSending(false);
    if (error) {
      showAuthError('შეცდომა: ' + error.message);
    } else {
      showAuthError('✅ Magic link გამოგზავნილია! შეამოწმეთ ელ-ფოსტა.', true);
    }
  }

  return (
    <div className="view active" id="view-auth">
      <div className="auth-glow" />

      <div className="auth-top">
        <GeorgianFlag width={56} height={40} />
        <div className="brand-wordmark">
          JARVIS<span className="ai-badge">A.I</span>
        </div>
        <div className="auth-tagline ka">თქვენი ქართული AI ასისტენტი</div>
      </div>

      <div className="auth-panel">
        <div className="auth-title ka">შემოგვიერთდი</div>
        <div className="auth-sub ka">დარეგისტრირდი და დაიწყე საუბარი JARVIS-თან</div>

        <button className="btn-google" onClick={handleGoogleLogin}>
          <svg viewBox="0 0 48 48">
            <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l5.7-5.7C34.6 6 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z" />
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 16 19 13 24 13c3.1 0 5.8 1.1 8 3l5.7-5.7C34.6 6 29.6 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
            <path fill="#4CAF50" d="M24 44c5.5 0 10.4-1.9 14.1-5.1l-6.5-5.5C29.5 35.4 26.9 36 24 36c-5.2 0-9.6-3.3-11.2-7.9l-6.6 5.1C9.6 39.6 16.3 44 24 44z" />
            <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.2-4.1 5.5l6.5 5.5C41.4 35.6 44 30.2 44 24c0-1.3-.1-2.7-.4-3.5z" />
          </svg>
          <span>Continue with Google</span>
        </button>

        <div className="divider">OR</div>

        <input
          type="email"
          className="input-email"
          placeholder="შეიყვანე ელ-ფოსტა"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleContinue()}
        />

        {error && (
          <div
            className="ka"
            style={{
              color: error.isSuccess ? '#4caf50' : '#e0566c',
              fontSize: '12.5px',
              textAlign: 'center',
              marginTop: '-6px',
            }}
          >
            {error.text}
          </div>
        )}

        <div className="auth-plans">
          <div
            className={`plan-card${selectedPlan === 'pro' ? ' selected' : ''}`}
            data-plan="pro"
            onClick={() => setSelectedPlan('pro')}
          >
            <div className="plan-name ka">Pro</div>
            <div className="plan-price">₾20 / თვე</div>
          </div>
          <div
            className={`plan-card${selectedPlan === 'max' ? ' selected' : ''}`}
            data-plan="max"
            onClick={() => setSelectedPlan('max')}
          >
            <div className="plan-name ka">Max</div>
            <div className="plan-price">₾40 / თვე</div>
          </div>
        </div>

        <button
          className="btn-primary ka"
          onClick={handleContinue}
          disabled={isSending}
        >
          {isSending ? 'იგზავნება...' : 'გაგრძელება'}
        </button>
        <div className="auth-switch ka">
          უკვე გაქვს ანგარიში?{' '}
          <span onClick={handleContinue}>შესვლა</span>
        </div>
        <div className="auth-legal ka">
          გაგრძელებით თქვენ ეთანხმებით{' '}
          <a href="#">წესებსა და პირობებს</a>
        </div>
      </div>
    </div>
  );
}
