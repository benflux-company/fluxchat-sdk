/**
 * Self-contained, namespaced widget styles. Everything is prefixed with `.fcw`
 * and driven by CSS variables so a single theme object restyles the widget.
 */
export function widgetCss(): string {
  return `
.fcw-root, .fcw-root * { box-sizing: border-box; }
.fcw-root {
  --fcw-primary: #4f46e5;
  --fcw-primary-contrast: #ffffff;
  --fcw-bg: #ffffff;
  --fcw-surface: #f6f7f9;
  --fcw-text: #11181c;
  --fcw-muted: #6b7280;
  --fcw-border: #e6e8eb;
  --fcw-bot-bubble: #f1f3f5;
  --fcw-radius: 20px;
  position: fixed; bottom: 24px; z-index: 2147483000;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  color: var(--fcw-text);
}
.fcw-root[data-theme="dark"] {
  --fcw-bg: #15171a;
  --fcw-surface: #1d2024;
  --fcw-text: #f3f4f6;
  --fcw-muted: #9aa4af;
  --fcw-border: #2a2e33;
  --fcw-bot-bubble: #23272c;
}
.fcw-root[data-position="right"] { right: 24px; }
.fcw-root[data-position="left"] { left: 24px; }

/* Launcher */
.fcw-launcher {
  width: 60px; height: 60px; border-radius: 50%; border: none; cursor: pointer;
  background: var(--fcw-primary); color: var(--fcw-primary-contrast);
  box-shadow: 0 10px 30px rgba(0,0,0,.22); display: grid; place-items: center;
  transition: transform .18s ease, box-shadow .18s ease;
}
.fcw-launcher:hover { transform: translateY(-2px) scale(1.04); box-shadow: 0 14px 36px rgba(0,0,0,.28); }
.fcw-launcher:active { transform: scale(.96); }
.fcw-launcher svg { width: 28px; height: 28px; }

/* Panel */
.fcw-panel {
  position: absolute; bottom: 76px; width: 380px; max-width: calc(100vw - 32px);
  height: 600px; max-height: calc(100vh - 120px);
  background: var(--fcw-bg); border: 1px solid var(--fcw-border);
  border-radius: var(--fcw-radius); overflow: hidden; display: flex; flex-direction: column;
  box-shadow: 0 24px 60px rgba(0,0,0,.24);
  opacity: 0; transform: translateY(12px) scale(.98); pointer-events: none;
  transition: opacity .2s ease, transform .2s ease;
}
.fcw-root[data-position="right"] .fcw-panel { right: 0; }
.fcw-root[data-position="left"] .fcw-panel { left: 0; }
.fcw-root[data-open="true"] .fcw-panel { opacity: 1; transform: translateY(0) scale(1); pointer-events: auto; }

/* Header */
.fcw-header {
  display: flex; align-items: center; gap: 12px; padding: 16px 18px;
  background: var(--fcw-primary); color: var(--fcw-primary-contrast);
}
.fcw-avatar {
  width: 42px; height: 42px; border-radius: 50%; flex: 0 0 auto;
  background: rgba(255,255,255,.22); display: grid; place-items: center;
  font-weight: 700; font-size: 18px; overflow: hidden;
}
.fcw-avatar img { width: 100%; height: 100%; object-fit: cover; }
.fcw-head-text { display: flex; flex-direction: column; line-height: 1.25; min-width: 0; }
.fcw-title { font-weight: 700; font-size: 15px; }
.fcw-subtitle { font-size: 12px; opacity: .85; display: flex; align-items: center; gap: 6px; }
.fcw-dot { width: 8px; height: 8px; border-radius: 50%; background: #34d399; box-shadow: 0 0 0 2px rgba(255,255,255,.4); }
.fcw-close {
  margin-left: auto; background: rgba(255,255,255,.16); border: none; cursor: pointer;
  color: inherit; width: 30px; height: 30px; border-radius: 8px; display: grid; place-items: center;
  transition: background .15s ease;
}
.fcw-close:hover { background: rgba(255,255,255,.3); }

/* Messages */
.fcw-messages { flex: 1; overflow-y: auto; padding: 18px; background: var(--fcw-surface); display: flex; flex-direction: column; gap: 10px; }
.fcw-row { display: flex; }
.fcw-row.user { justify-content: flex-end; }
.fcw-bubble {
  max-width: 80%; padding: 10px 13px; border-radius: 16px; font-size: 14px; line-height: 1.5;
  word-wrap: break-word; white-space: pre-wrap;
}
.fcw-row.bot .fcw-bubble { background: var(--fcw-bot-bubble); color: var(--fcw-text); border-bottom-left-radius: 4px; }
.fcw-row.user .fcw-bubble { background: var(--fcw-primary); color: var(--fcw-primary-contrast); border-bottom-right-radius: 4px; }
.fcw-bubble a { color: inherit; text-decoration: underline; }
.fcw-bubble strong { font-weight: 700; }

/* Typing */
.fcw-typing { display: inline-flex; gap: 4px; align-items: center; padding: 12px 14px; }
.fcw-typing span { width: 7px; height: 7px; border-radius: 50%; background: var(--fcw-muted); opacity: .6; animation: fcw-bounce 1.2s infinite ease-in-out; }
.fcw-typing span:nth-child(2) { animation-delay: .15s; }
.fcw-typing span:nth-child(3) { animation-delay: .3s; }
@keyframes fcw-bounce { 0%, 80%, 100% { transform: translateY(0); opacity: .4; } 40% { transform: translateY(-5px); opacity: 1; } }

/* Composer */
.fcw-composer { display: flex; gap: 8px; padding: 12px; border-top: 1px solid var(--fcw-border); background: var(--fcw-bg); align-items: flex-end; }
.fcw-input {
  flex: 1; resize: none; border: 1px solid var(--fcw-border); border-radius: 12px; padding: 10px 12px;
  font: inherit; font-size: 14px; max-height: 120px; background: var(--fcw-bg); color: var(--fcw-text); outline: none;
}
.fcw-input:focus { border-color: var(--fcw-primary); }
.fcw-send {
  flex: 0 0 auto; width: 40px; height: 40px; border: none; border-radius: 12px; cursor: pointer;
  background: var(--fcw-primary); color: var(--fcw-primary-contrast); display: grid; place-items: center;
  transition: opacity .15s ease, transform .1s ease;
}
.fcw-send:hover { opacity: .92; }
.fcw-send:active { transform: scale(.94); }
.fcw-send:disabled { opacity: .45; cursor: not-allowed; }

/* Footer */
.fcw-footer { padding: 8px 12px; text-align: center; font-size: 11px; color: var(--fcw-muted); background: var(--fcw-bg); border-top: 1px solid var(--fcw-border); }
.fcw-footer a { color: var(--fcw-muted); text-decoration: none; font-weight: 600; }
.fcw-footer a:hover { color: var(--fcw-primary); }

@media (max-width: 440px) {
  .fcw-panel { width: calc(100vw - 24px); height: calc(100vh - 100px); }
}
`;
}
