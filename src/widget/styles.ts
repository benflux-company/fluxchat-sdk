/**
 * Self-contained, namespaced widget styles. Everything is prefixed with `.fcw`
 * and driven by CSS variables so a single theme object restyles the widget.
 */
export function widgetCss(): string {
  return `
.fcw-root, .fcw-root * { box-sizing: border-box; }
.fcw-root {
  --fcw-primary: #4f46e5;
  --fcw-primary-dark: #3730a3;
  --fcw-primary-contrast: #ffffff;
  --fcw-bg: #ffffff;
  --fcw-surface: #f5f6fa;
  --fcw-text: #0f172a;
  --fcw-muted: #64748b;
  --fcw-border: #e2e8f0;
  --fcw-bot-bubble: #ffffff;
  --fcw-radius: 20px;
  --fcw-shadow: 0 32px 80px rgba(15,23,42,.18), 0 8px 24px rgba(15,23,42,.1);
  position: fixed; bottom: 24px; z-index: 2147483000;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  color: var(--fcw-text);
}
.fcw-root[data-theme="dark"] {
  --fcw-bg: #0f1117;
  --fcw-surface: #181c27;
  --fcw-text: #f1f5f9;
  --fcw-muted: #94a3b8;
  --fcw-border: #1e2535;
  --fcw-bot-bubble: #1e2535;
  --fcw-shadow: 0 32px 80px rgba(0,0,0,.5), 0 8px 24px rgba(0,0,0,.3);
}
.fcw-root[data-position="right"] { right: 24px; }
.fcw-root[data-position="left"]  { left: 24px; }

/* ── Launcher ── */
.fcw-launcher {
  width: 60px; height: 60px; border-radius: 50%; border: none; cursor: pointer;
  background: linear-gradient(135deg, var(--fcw-primary), var(--fcw-primary-dark));
  color: var(--fcw-primary-contrast);
  box-shadow: 0 8px 28px color-mix(in srgb, var(--fcw-primary) 50%, transparent), 0 2px 8px rgba(0,0,0,.15);
  display: grid; place-items: center;
  transition: transform .2s cubic-bezier(.34,1.56,.64,1), box-shadow .2s ease;
}
.fcw-launcher:hover { transform: translateY(-3px) scale(1.06); box-shadow: 0 14px 40px color-mix(in srgb, var(--fcw-primary) 60%, transparent), 0 4px 12px rgba(0,0,0,.2); }
.fcw-launcher:active { transform: scale(.94); }
.fcw-launcher svg { width: 26px; height: 26px; }

/* Notification dot on launcher */
.fcw-launcher-dot {
  position: absolute; top: -2px; right: -2px;
  width: 14px; height: 14px; border-radius: 50%;
  background: #ef4444; border: 2px solid white;
  display: none;
}
.fcw-launcher-dot.visible { display: block; }

/* ── Panel ── */
.fcw-panel {
  position: absolute; bottom: 76px; width: 390px; max-width: calc(100vw - 32px);
  height: 620px; max-height: calc(100vh - 120px);
  background: var(--fcw-bg); border: 1px solid var(--fcw-border);
  border-radius: var(--fcw-radius); overflow: hidden; display: flex; flex-direction: column;
  box-shadow: var(--fcw-shadow);
  opacity: 0; transform: translateY(16px) scale(.97); pointer-events: none;
  transition: opacity .22s ease, transform .22s cubic-bezier(.34,1.3,.64,1);
}
.fcw-root[data-position="right"] .fcw-panel { right: 0; }
.fcw-root[data-position="left"]  .fcw-panel { left: 0; }
.fcw-root[data-open="true"] .fcw-panel { opacity: 1; transform: translateY(0) scale(1); pointer-events: auto; }

/* Inline mode */
.fcw-root[data-mode="inline"] { position:static; bottom:auto; right:auto; left:auto; width:100%; height:100%; min-height:480px; display:flex; }
.fcw-root[data-mode="inline"] .fcw-panel { position:static; width:100%; height:100%; max-width:none; max-height:none; flex:1; opacity:1; transform:none; pointer-events:auto; box-shadow:none; }
.fcw-root[data-mode="inline"] .fcw-close { display:none !important; }

/* ── Header ── */
.fcw-header {
  display: flex; align-items: center; gap: 12px; padding: 14px 16px 13px;
  background: linear-gradient(135deg, var(--fcw-primary) 0%, var(--fcw-primary-dark) 100%);
  color: var(--fcw-primary-contrast);
  position: relative; overflow: hidden;
  flex-shrink: 0;
}
/* Subtle shimmer pattern */
.fcw-header::before {
  content:''; position:absolute; inset:0;
  background: radial-gradient(ellipse at 80% -20%, rgba(255,255,255,.15) 0%, transparent 60%);
  pointer-events:none;
}
.fcw-avatar {
  width: 40px; height: 40px; border-radius: 50%; flex: 0 0 auto;
  background: rgba(255,255,255,.2); border: 1.5px solid rgba(255,255,255,.35);
  display: grid; place-items: center;
  font-weight: 700; font-size: 16px; overflow: hidden;
}
.fcw-avatar img { width:100%; height:100%; object-fit:cover; }
.fcw-head-text { display:flex; flex-direction:column; line-height:1.3; min-width:0; flex:1; }
.fcw-title { font-weight: 700; font-size: 14.5px; letter-spacing: -.01em; }
.fcw-subtitle {
  font-size: 11.5px; opacity: .85;
  display: flex; align-items: center; gap: 5px; margin-top: 1px;
}
.fcw-dot {
  width: 7px; height: 7px; border-radius: 50%; background: #4ade80;
  box-shadow: 0 0 0 2px rgba(74,222,128,.35);
  animation: fcw-pulse 2.4s ease-in-out infinite;
}
@keyframes fcw-pulse { 0%,100%{box-shadow:0 0 0 2px rgba(74,222,128,.35)} 50%{box-shadow:0 0 0 5px rgba(74,222,128,.15)} }
.fcw-hbtns { display:flex; gap:4px; margin-left:auto; align-items:center; }
.fcw-dev-badge {
  font-size: 9.5px; font-weight: 700; letter-spacing: .7px; text-transform: uppercase;
  background: rgba(251,191,36,.22); color: #fde68a; border: 1px solid rgba(251,191,36,.4);
  border-radius: 5px; padding: 2px 7px; line-height: 1.5; white-space: nowrap;
}
.fcw-hbtn {
  background: rgba(255,255,255,.14); border: none; cursor: pointer; color: inherit;
  width: 28px; height: 28px; border-radius: 7px; display: grid; place-items: center;
  transition: background .15s ease;
}
.fcw-hbtn:hover { background: rgba(255,255,255,.26); }
.fcw-hbtn svg { width: 15px; height: 15px; }

/* ── Messages ── */
.fcw-messages {
  flex: 1; overflow-y: auto; padding: 16px 14px;
  background: var(--fcw-surface);
  display: flex; flex-direction: column; gap: 8px;
  scroll-behavior: smooth;
}
.fcw-messages::-webkit-scrollbar { width: 4px; }
.fcw-messages::-webkit-scrollbar-track { background: transparent; }
.fcw-messages::-webkit-scrollbar-thumb { background: var(--fcw-border); border-radius: 99px; }

.fcw-row { display:flex; align-items:flex-end; gap: 7px; animation: fcw-slide-in .18s ease forwards; }
@keyframes fcw-slide-in { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
.fcw-row.user { justify-content:flex-end; }
.fcw-row.bot  { justify-content:flex-start; }

/* Small bot avatar in messages */
.fcw-row-avatar {
  width: 26px; height: 26px; border-radius: 50%; flex-shrink: 0;
  background: linear-gradient(135deg, var(--fcw-primary), var(--fcw-primary-dark));
  display: grid; place-items: center; color: #fff;
  font-size: 11px; font-weight: 700; margin-bottom: 2px;
}

.fcw-bubble {
  max-width: 78%; padding: 10px 13px; font-size: 13.5px; line-height: 1.55;
  word-wrap: break-word; white-space: pre-wrap;
  border-radius: 16px;
}
.fcw-row.bot .fcw-bubble {
  background: var(--fcw-bot-bubble);
  color: var(--fcw-text);
  border: 1px solid var(--fcw-border);
  border-bottom-left-radius: 4px;
  box-shadow: 0 1px 3px rgba(0,0,0,.06);
}
.fcw-row.user .fcw-bubble {
  background: linear-gradient(135deg, var(--fcw-primary), var(--fcw-primary-dark));
  color: var(--fcw-primary-contrast);
  border-bottom-right-radius: 4px;
  box-shadow: 0 2px 8px color-mix(in srgb, var(--fcw-primary) 40%, transparent);
}
.fcw-bubble a { color:inherit; text-decoration:underline; }
.fcw-bubble strong { font-weight:700; }

/* ── Typing indicator ── */
.fcw-typing {
  display: inline-flex; gap: 4px; align-items: center; padding: 13px 16px;
}
.fcw-typing span {
  width: 6px; height: 6px; border-radius: 50%;
  background: var(--fcw-muted); opacity:.5;
  animation: fcw-bounce 1.3s infinite ease-in-out;
}
.fcw-typing span:nth-child(2) { animation-delay: .18s; }
.fcw-typing span:nth-child(3) { animation-delay: .36s; }
@keyframes fcw-bounce { 0%,80%,100%{transform:translateY(0);opacity:.4} 40%{transform:translateY(-6px);opacity:1} }

/* ── Suggestion chip (autocorrect) ── */
.fcw-suggestion {
  display: none; align-items: center; gap: 6px;
  padding: 6px 12px 2px; background: var(--fcw-bg);
  border-top: 1px solid var(--fcw-border);
  flex-shrink: 0;
}
.fcw-suggestion.visible { display: flex; }
.fcw-suggestion-chip {
  flex: 1; text-align: left; font: inherit; font-size: 12.5px;
  padding: 5px 10px; border-radius: 8px; cursor: pointer; border: none;
  background: color-mix(in srgb, var(--fcw-primary) 8%, transparent);
  color: var(--fcw-text); transition: background .15s; min-width: 0;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.fcw-suggestion-chip:hover { background: color-mix(in srgb, var(--fcw-primary) 14%, transparent); }
.fcw-suggestion-label {
  font-size: 10.5px; color: var(--fcw-muted); white-space: nowrap; flex-shrink: 0;
}
.fcw-suggestion-send {
  font: inherit; font-size: 11.5px; font-weight: 600; cursor: pointer; border: none;
  background: var(--fcw-primary); color: #fff;
  padding: 4px 10px; border-radius: 7px; flex-shrink: 0;
  transition: opacity .15s;
}
.fcw-suggestion-send:hover { opacity: .88; }
.fcw-suggestion-dismiss {
  background: none; border: none; cursor: pointer; color: var(--fcw-muted);
  font-size: 15px; line-height: 1; padding: 2px 4px; flex-shrink: 0;
  transition: color .15s;
}
.fcw-suggestion-dismiss:hover { color: var(--fcw-text); }

/* ── Quick replies ── */
.fcw-quick-replies {
  display: flex; gap: 7px; padding: 4px 14px 10px;
  overflow-x: auto; flex-wrap: nowrap; flex-shrink: 0;
  background: var(--fcw-surface);
  scrollbar-width: none;
}
.fcw-quick-replies::-webkit-scrollbar { display: none; }
.fcw-qr-chip {
  font: inherit; font-size: 12.5px; white-space: nowrap;
  padding: 6px 13px; border-radius: 99px; cursor: pointer;
  background: var(--fcw-bg); color: var(--fcw-primary);
  border: 1.5px solid color-mix(in srgb, var(--fcw-primary) 50%, transparent);
  transition: background .15s, color .15s, border-color .15s;
  flex-shrink: 0;
}
.fcw-qr-chip:hover {
  background: var(--fcw-primary); color: var(--fcw-primary-contrast);
  border-color: var(--fcw-primary);
}
.fcw-qr-chip:active { opacity: .85; }

/* ── Composer ── */
.fcw-composer {
  display: flex; gap: 8px; padding: 10px 12px 12px;
  background: var(--fcw-bg); border-top: 1px solid var(--fcw-border);
  align-items: flex-end; flex-shrink: 0;
}
.fcw-input {
  flex: 1; resize: none; border: 1.5px solid var(--fcw-border); border-radius: 14px;
  padding: 9px 13px; font: inherit; font-size: 13.5px;
  max-height: 110px; background: var(--fcw-surface); color: var(--fcw-text); outline: none;
  transition: border-color .15s, background .15s;
  line-height: 1.5;
}
.fcw-input::placeholder { color: var(--fcw-muted); }
.fcw-input:focus { border-color: var(--fcw-primary); background: var(--fcw-bg); }
.fcw-send {
  flex: 0 0 auto; width: 38px; height: 38px; border: none; border-radius: 11px; cursor: pointer;
  background: linear-gradient(135deg, var(--fcw-primary), var(--fcw-primary-dark));
  color: var(--fcw-primary-contrast); display: grid; place-items: center;
  transition: opacity .15s, transform .1s;
  box-shadow: 0 2px 8px color-mix(in srgb, var(--fcw-primary) 40%, transparent);
}
.fcw-send:hover { opacity: .9; transform: translateY(-1px); }
.fcw-send:active { transform: scale(.92); }
.fcw-send:disabled { opacity: .38; cursor: not-allowed; transform: none; box-shadow: none; }
.fcw-send svg { width: 16px; height: 16px; }

/* ── Footer ── */
.fcw-footer {
  padding: 7px 12px; text-align: center;
  font-size: 10.5px; color: var(--fcw-muted);
  background: var(--fcw-bg); border-top: 1px solid var(--fcw-border);
  flex-shrink: 0; letter-spacing: .01em;
}
.fcw-footer a { color: var(--fcw-muted); text-decoration: none; font-weight: 600; }
.fcw-footer a:hover { color: var(--fcw-primary); }

/* ── Responsive ── */
@media (max-width: 440px) {
  .fcw-panel { width: calc(100vw - 20px); height: calc(100svh - 100px); }
}
`;
}
