'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import GeorgianFlag from './GeorgianFlag';
import {
  getSupabase,
  JARVIS_FUNCTION_URL,
  FREE_LIMIT,
  RESET_MS,
} from '@/lib/supabase';

interface Message {
  id: number;
  role: 'user' | 'ai';
  content: string;
}

interface PaywallState {
  remain: number;
}

interface Props {
  user: User;
  onLogout: () => void;
}

function msToHm(ms: number): string {
  const totalMin = Math.max(0, Math.ceil(ms / 60000));
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return (h > 0 ? h + ' სთ ' : '') + m + ' წთ';
}

export default function ChatView({ user, onLogout }: Props) {
  const sb = getSupabase();

  // ── UI state ──────────────────────────────────────────────────────────────
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [paywall, setPaywall] = useState<PaywallState | null>(null);
  const [inputText, setInputText] = useState('');
  const [isLight, setIsLight] = useState(false);

  // ── Non-reactive refs (preserve exactly from original) ────────────────────
  const conversationHistory = useRef<{ role: string; content: string }[]>([]);
  const isSending = useRef(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const msgIdCounter = useRef(0);

  // ── Theme init ────────────────────────────────────────────────────────────
  useEffect(() => {
    const saved = localStorage.getItem('jarvis_theme');
    if (saved === 'light') {
      setIsLight(true);
      document.body.classList.add('light');
    }
  }, []);

  // ── Auto-scroll on new messages / typing ──────────────────────────────────
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  // Mobile sidebar: collapsed by default on small screens
  useEffect(() => {
    if (window.innerWidth <= 860) setSidebarCollapsed(true);
  }, []);

  // ── Load history + update last_login on mount ─────────────────────────────
  useEffect(() => {
    async function enterChat() {
      conversationHistory.current = [];
      await sb.from('users').update({ last_login_at: new Date().toISOString() }).eq('id', user.id);
      await loadChatHistory();
    }
    enterChat();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id]);

  // ── LOAD PAST CHAT HISTORY (last 20 messages) ─────────────────────────────
  async function loadChatHistory() {
    const { data } = await sb
      .from('chat_messages')
      .select('role, content, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (!data || data.length === 0) return;

    const msgs = data.reverse();
    conversationHistory.current = msgs.map((m) => ({ role: m.role, content: m.content }));
    setMessages(
      msgs.map((m) => ({
        id: ++msgIdCounter.current,
        role: m.role === 'user' ? 'user' : 'ai',
        content: m.content,
      }))
    );
  }

  // ── ADD MESSAGE ───────────────────────────────────────────────────────────
  const addMsg = useCallback((text: string, isUser: boolean) => {
    setMessages((prev) => [
      ...prev,
      { id: ++msgIdCounter.current, role: isUser ? 'user' : 'ai', content: text },
    ]);
  }, []);

  // ── NEW CHAT ──────────────────────────────────────────────────────────────
  function startNewChat() {
    setMessages([]);
    setPaywall(null);
    conversationHistory.current = [];
    if (window.innerWidth <= 860) setSidebarCollapsed(true);
  }

  // ── JARVIS STORY (demo conversation) ─────────────────────────────────────
  function loadJarvisStory() {
    startNewChat();
    setTimeout(() => {
      addMsg('მომიყევი ჯარვისის შექმნის ისტორია', true);
      setTimeout(() => {
        addMsg(
          'როდესაც მსოფლიოს უმსხვილესი კომპანიები ხელოვნურ ინტელექტში მილიარდებს დებდნენ, პატარა გუნდმა საქართველოში გადაწყვიტა: ჩვენს ქვეყანასაც უნდა ჰქონდეს საკუთარი, ქართულ ენაზე მოაზროვნე AI ასისტენტი.\n\nასე დაიბადა JARVIS — საქართველოს პირველი AI ასისტენტი, რომელიც ქართულ კულტურას, ენას და კონტექსტს ნამდვილად ესმის.',
          false
        );
      }, 600);
    }, 0);
    if (window.innerWidth <= 860) setSidebarCollapsed(true);
  }

  // ── THEME ─────────────────────────────────────────────────────────────────
  function toggleTheme() {
    const next = !isLight;
    setIsLight(next);
    document.body.classList.toggle('light', next);
    localStorage.setItem('jarvis_theme', next ? 'light' : 'dark');
  }

  // ── LOGOUT ────────────────────────────────────────────────────────────────
  async function logout() {
    await sb.auth.signOut();
    conversationHistory.current = [];
    onLogout();
  }

  // ── TRIAL HELPERS (preserved exactly) ────────────────────────────────────
  async function getTrialState() {
    const { data } = await sb
      .from('trial_usage')
      .select('message_count,window_start')
      .eq('user_id', user.id)
      .single();
    if (!data) return { count: 0, windowStart: Date.now() };
    const ws = new Date(data.window_start).getTime();
    if (Date.now() - ws >= RESET_MS) {
      await sb.from('trial_usage').upsert(
        { user_id: user.id, message_count: 0, window_start: new Date().toISOString(), updated_at: new Date().toISOString() },
        { onConflict: 'user_id' }
      );
      return { count: 0, windowStart: Date.now() };
    }
    return { count: data.message_count, windowStart: ws };
  }

  async function incrementTrial() {
    const { data } = await sb
      .from('trial_usage')
      .select('message_count')
      .eq('user_id', user.id)
      .single();
    const newCount = ((data && data.message_count) || 0) + 1;
    await sb.from('trial_usage').upsert(
      { user_id: user.id, message_count: newCount, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    );
    return newCount;
  }

  async function isPaidUser() {
    const { data } = await sb
      .from('subscriptions')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle();
    return !!data;
  }

  // ── PAYWALL ───────────────────────────────────────────────────────────────
  function showPaywall(remain: number) {
    setPaywall({ remain });
  }

  // ── SUBSCRIBE (pending until payment) ────────────────────────────────────
  async function subscribe(plan: 'pro' | 'max') {
    await sb.from('subscriptions').upsert(
      {
        user_id: user.id,
        plan,
        status: 'pending',
        started_at: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      },
      { onConflict: 'user_id' }
    );
    addMsg(
      'გადახდის გვერდზე გადამისამართება... ₾' +
        (plan === 'max' ? '40' : '20') +
        '/თვე — ' +
        plan.toUpperCase() +
        ' გეგმა',
      false
    );
    // TODO: redirect to payment URL (Stripe / BOG Pay) when ready
    // window.location.href = paymentUrls[plan];
  }

  // ── CALL JARVIS AI (routes through Supabase Edge Function) ───────────────
  async function callJarvisAI(session: { access_token: string }) {
    const response = await fetch(JARVIS_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + session.access_token,
      },
      body: JSON.stringify({
        messages: conversationHistory.current,
        userId: user.id,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error('API Error: ' + err);
    }

    const data = await response.json();
    return data.reply as string;
  }

  // ── SEND MESSAGE ──────────────────────────────────────────────────────────
  async function sendMessage() {
    const text = inputText.trim();
    const files = pendingFiles.slice();
    if ((!text && files.length === 0) || isSending.current) return;

    // Paid check
    const paid = await isPaidUser();
    if (!paid) {
      const { count, windowStart } = await getTrialState();
      if (count >= FREE_LIMIT) {
        setInputText('');
        setPendingFiles([]);
        if (fileInputRef.current) fileInputRef.current.value = '';
        showPaywall(RESET_MS - (Date.now() - windowStart));
        return;
      }
    }

    // Build display text (preserves attachment display)
    let displayText = text;
    if (files.length) displayText += (text ? '\n' : '') + '📎 ' + files.map((f) => f.name).join(', ');

    addMsg(displayText, true);
    setInputText('');
    setPendingFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = '';

    isSending.current = true;

    // Show typing
    setIsTyping(true);

    // Add to history BEFORE api call
    conversationHistory.current.push({ role: 'user', content: displayText });

    // Save user message to DB
    sb.from('chat_messages').insert({ user_id: user.id, role: 'user', content: displayText });

    try {
      const {
        data: { session },
      } = await sb.auth.getSession();

      let reply: string;
      try {
        reply = await callJarvisAI(session!);
      } catch (apiErr: unknown) {
        const msg = apiErr instanceof Error ? apiErr.message : String(apiErr);
        console.warn('Edge Function not deployed yet, using fallback:', msg);
        reply =
          'Edge Function ჯერ არ არის deploy-ირებული. გთხოვთ გამართოთ Supabase Edge Function "jarvis-chat". დეტალები: ' +
          msg;
      }

      setIsTyping(false);
      addMsg(reply, false);

      conversationHistory.current.push({ role: 'assistant', content: reply });
      sb.from('chat_messages').insert({ user_id: user.id, role: 'assistant', content: reply });

      // Increment trial if not paid
      if (!paid) {
        const newCount = await incrementTrial();
        if (newCount >= FREE_LIMIT) {
          const { windowStart } = await getTrialState();
          setTimeout(() => showPaywall(RESET_MS - (Date.now() - windowStart)), 300);
        }
      }
    } catch (err: unknown) {
      setIsTyping(false);
      const msg = err instanceof Error ? err.message : String(err);
      addMsg('შეცდომა მოხდა. სცადეთ ხელახლა. (' + msg + ')', false);
      conversationHistory.current.pop();
    } finally {
      isSending.current = false;
      chatInputRef.current?.focus();
    }
  }

  // ── FILE ATTACHMENTS ──────────────────────────────────────────────────────
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setPendingFiles(Array.from(e.target.files || []));
  }

  function removeFile(index: number) {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
  }

  // ── RENDER ────────────────────────────────────────────────────────────────
  const isEmpty = messages.length === 0;

  return (
    <div className="view active" id="view-chat">
      {/* ── Mobile backdrop — closes drawer on tap ── */}
      {!sidebarCollapsed && (
        <div
          className="sidebar-backdrop"
          aria-hidden="true"
          onClick={() => setSidebarCollapsed(true)}
        />
      )}

      {/* ── Sidebar ── */}
      <div
        id="jarvis-sidebar"
        className={`sidebar${sidebarCollapsed ? ' collapsed' : ''}`}
      >
        <div className="sidebar-top">
          <button
            className="icon-btn"
            title="ჩაკეცვა"
            onClick={() => setSidebarCollapsed(true)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="4" y1="7" x2="20" y2="7" />
              <line x1="4" y1="12" x2="20" y2="12" />
              <line x1="4" y1="17" x2="20" y2="17" />
            </svg>
          </button>
          <div className="brand" style={{ fontSize: '14px' }}>
            <GeorgianFlag width={24} height={17} />
            <span className="brand-wordmark" style={{ fontSize: '14px' }}>
              JARVIS<span className="ai-badge" style={{ fontSize: '11px' }}>A.I</span>
            </span>
          </div>
        </div>

        <button className="new-chat-btn ka" onClick={startNewChat}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          ახალი ჩატი
        </button>

        <div className="chat-history">
          <div className="last-chat-item" onClick={loadJarvisStory}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            ჯარვისის შექმნის ისტორია
          </div>
        </div>

        <div className="sidebar-bottom">
          {/* Theme toggle */}
          <div className="theme-toggle">
            <span className="label ka">ღამე / დღე</span>
            <div
              className={`daynight-toggle${isLight ? ' is-light' : ''}`}
              onClick={toggleTheme}
              role="button"
              aria-label="Toggle theme"
            >
              <div className="dn-stars">
                <span className="dn-star" style={{ top: '6px', left: '10px' }} />
                <span className="dn-star" style={{ top: '14px', left: '18px' }} />
                <span className="dn-star" style={{ top: '9px', left: '24px' }} />
                <span className="dn-star" style={{ top: '18px', left: '30px' }} />
              </div>
              <div className="dn-knob">
                <svg className="dn-icon-moon" viewBox="0 0 24 24" fill="#1c2b4a">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z" />
                </svg>
                <svg className="dn-icon-sun" viewBox="0 0 24 24" fill="#f5a623">
                  <circle cx="12" cy="12" r="4" />
                  <path stroke="#f5a623" strokeWidth="2" d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
                </svg>
              </div>
            </div>
          </div>

          {/* Logout */}
          <button className="sidebar-action logout ka" onClick={logout}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            გამოსვლა
          </button>
        </div>
      </div>

      {/* ── Main chat area ── */}
      <div className="chat-main">
        {/* Topbar */}
        <div className="chat-topbar">
          <div className="topbar-left">
            {/* Hamburger — always visible on mobile (hidden on desktop via CSS) */}
            <button
              className="icon-btn mobile-hamburger"
              aria-label="მენიუ"
              onClick={() => setSidebarCollapsed((prev) => !prev)}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="4" y1="7" x2="20" y2="7" />
                <line x1="4" y1="12" x2="20" y2="12" />
                <line x1="4" y1="17" x2="20" y2="17" />
              </svg>
            </button>
            <div className="brand-wordmark" style={{ fontSize: '15px' }}>
              JARVIS<span className="ai-badge" style={{ fontSize: '12px' }}>A.I</span>
            </div>
          </div>
          <GeorgianFlag width={30} height={21} />
        </div>

        {/* Scroll area */}
        <div className="chat-scroll" ref={chatScrollRef}>
          {/* Empty state */}
          {isEmpty && !paywall && (
            <div className="chat-empty">
              <GeorgianFlag width={64} height={46} className="empty-flag" />
              <div className="empty-greeting ka">Jarvis-ი გისმენთ</div>
            </div>
          )}

          {/* Messages */}
          <div className="chat-inner">
            {messages.map((m) => (
              <div key={m.id} className={`msg ${m.role} ka`}>
                {m.content}
              </div>
            ))}

            {/* Typing indicator */}
            {isTyping && (
              <div className="typing-indicator">
                <div className="typing-dot" />
                <div className="typing-dot" />
                <div className="typing-dot" />
              </div>
            )}

            {/* Paywall card */}
            {paywall && (
              <div className="paywall-card">
                <div className="paywall-title ka">უფასო მცდელობები ამოიწურა</div>
                <div className="paywall-sub ka">გააგრძელეთ შეუზღუდავად Pro ან Max გეგმით</div>
                <div className="paywall-plans">
                  <div className="paywall-plan" onClick={() => subscribe('pro')}>
                    <div className="name ka">Pro</div>
                    <div className="price">₾20 / თვე</div>
                    <div className="features ka">შეუზღუდავი შეტყობინებები</div>
                  </div>
                  <div className="paywall-plan" onClick={() => subscribe('max')}>
                    <div className="name ka">Max</div>
                    <div className="price">₾40 / თვე</div>
                    <div className="features ka">შეუზღუდავი + პრიორიტეტი</div>
                  </div>
                </div>
                <div className="paywall-timer ka">
                  ან დაელოდეთ {msToHm(paywall.remain)} — კიდევ {FREE_LIMIT} უფასო მცდელობა
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Attach preview chips */}
        {pendingFiles.length > 0 && (
          <div className="attach-preview">
            {pendingFiles.map((f, i) => (
              <div key={i} className="attach-chip ka" onClick={() => removeFile(i)}>
                {f.name} ✕
              </div>
            ))}
          </div>
        )}

        {/* Input bar */}
        <div className="chat-input-wrap">
          <div className="chat-input-bar">
            <button
              type="button"
              className="attach-btn"
              title="ფაილის ატვირთვა"
              onClick={() => fileInputRef.current?.click()}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
              </svg>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              style={{ position: 'absolute', width: '1px', height: '1px', padding: 0, margin: '-1px', overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0 }}
              multiple
              accept="image/*,video/*,.pdf,.doc,.docx,.txt"
              onChange={handleFileChange}
            />
            <input
              type="text"
              className="chat-input ka"
              ref={chatInputRef}
              placeholder="დაწერეთ შეტყობინება..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
            />
            <button
              type="button"
              className="send-btn"
              disabled={isSending.current}
              onClick={sendMessage}
            >
              <svg viewBox="0 0 24 24">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
