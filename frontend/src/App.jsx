import { useEffect, useState } from "react";
import { api } from "./api";

import ChurnForm from "./components/ChurnForm";
import BatchUpload from "./components/BatchUpload";
import ResultsDisplay from "./components/ResultsDisplay";
import URLAnalyzer from "./components/URLAnalyzer";

// ── Inject global styles once ────────────────────────────────
const injectGlobalStyles = () => {
  if (document.getElementById("toxiscan-global")) return;
  const style = document.createElement("style");
  style.id = "toxiscan-global";
  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600;700&family=Syne:wght@400;700;800&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --bg:       #0e0e11;
      --surface:  #16161c;
      --border:   #2a2a35;
      --accent:   #ff3c3c;
      --safe:     #00e090;
      --warn:     #ff8c00;
      --text:     #d4d4e0;
      --muted:    #666680;
      --faint:    #444458;
      --mono:     'IBM Plex Mono', monospace;
      --sans:     'Syne', sans-serif;
      --radius:   6px;
    }

    html, body, #root {
      height: 100%;
      background: var(--bg);
      color: var(--text);
      font-family: var(--mono);
      font-size: 14px;
      line-height: 1.6;
      -webkit-font-smoothing: antialiased;
    }

    ::-webkit-scrollbar { width: 5px; height: 5px; }
    ::-webkit-scrollbar-track { background: var(--bg); }
    ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }

    @keyframes spin     { to { transform: rotate(360deg); } }
    @keyframes fadeUp   { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
    @keyframes fadeDown { from { opacity:0; transform:translateY(-6px); } to { opacity:1; transform:translateY(0); } }
    @keyframes pulse    { 0%,100% { opacity:1; } 50% { opacity:0.35; } }
    @keyframes scanline { 0% { transform:translateY(-100%); } 100% { transform:translateY(100vh); } }

    .anim-fadeup   { animation: fadeUp   0.35s ease both; }
    .anim-fadedown { animation: fadeDown 0.35s ease both; }

    .tab-btn {
      background: none; border: none;
      border-bottom: 2px solid transparent;
      font-family: var(--mono); font-size: 0.72rem;
      letter-spacing: 0.1em; text-transform: uppercase;
      padding: 0.6rem 1.1rem; color: var(--muted);
      cursor: pointer; white-space: nowrap;
      transition: color 0.2s, border-color 0.2s;
      margin-bottom: -1px;
    }
    .tab-btn:hover  { color: var(--text); }
    .tab-btn.active { color: var(--accent); border-bottom-color: var(--accent); }

    .ts-panel {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 1.6rem;
    }

    .status-pill {
      display: inline-flex; align-items: center; gap: 0.5rem;
      font-size: 0.68rem; letter-spacing: 0.1em;
      padding: 0.35rem 0.85rem; border-radius: 3px;
      border: 1px solid; font-family: var(--mono);
    }
    .status-pill.ok  { color: var(--safe);   border-color: var(--safe);   background: #0a2a1a; }
    .status-pill.bad { color: var(--accent);  border-color: var(--accent); background: #1a0808; }
    .status-dot { width:6px; height:6px; border-radius:50%; background:currentColor; }
    .status-dot.blinking { animation: pulse 1.5s infinite; }
  `;
  document.head.appendChild(style);
};
injectGlobalStyles();

const TABS = [
  { id: "text",  label: "⌨ Text",      desc: "Analyze a single comment" },
  { id: "batch", label: "⊞ Batch CSV",  desc: "Upload a CSV file"        },
  { id: "url",   label: "⬡ URL",        desc: "Scan a web page"          },
];

export default function App() {
  const [health,    setHealth]    = useState(null);
  const [result,    setResult]    = useState(null);   // /predict   → single text
  const [batch,     setBatch]     = useState(null);   // /predict_batch → CSV
  const [urlResult, setUrlResult] = useState(null);   // /predict_url   → web page ← NEW
  const [tab,       setTab]       = useState("text");

  useEffect(() => {
    api.get("/health")
      .then((r) => setHealth(r.data))
      .catch(() => setHealth({ status: "error", model_loaded: false }));
  }, []);

  const apiReady = !!health?.model_loaded;

  const handleTab = (id) => {
    setTab(id);
    setResult(null);
    setBatch(null);
    setUrlResult(null);
  };

  const clearAll = () => { setResult(null); setBatch(null); setUrlResult(null); };
  const hasResult = result || batch || urlResult;

  return (
    <div style={css.page}>
      <div style={css.scanline} />

      {/* ══ TOPBAR ══ */}
      <header style={css.topbar}>
        <div style={css.brand}>
          <span style={css.logo}>TOXI<span style={{ color: "#d4d4e0" }}>SCAN</span></span>
          <span style={css.tagline}>Multi-label toxicity detection</span>
        </div>
        <div style={css.topRight}>
          {health && <span style={css.modelInfo}>TF-IDF · LogReg · 6 labels</span>}
          <div className={`status-pill ${apiReady ? "ok" : "bad"}`}>
            <div className={`status-dot ${health === null ? "blinking" : ""}`} />
            {health === null ? "Connecting..." : apiReady ? "Model ready" : "API error"}
          </div>
        </div>
      </header>

      {/* ══ MAIN ══ */}
      <main style={css.main}>

        {/* ── LEFT ── */}
        <aside style={css.left}>
          <div className="ts-panel">
            {/* Tabs */}
            <div style={css.tabBar}>
              {TABS.map((t) => (
                <button
                  key={t.id}
                  className={`tab-btn ${tab === t.id ? "active" : ""}`}
                  onClick={() => handleTab(t.id)}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <p style={css.tabDesc}>{TABS.find((t) => t.id === tab)?.desc}</p>

            {/* Tab content */}
            <div key={tab} className="anim-fadedown">
              {tab === "text" && (
                <ChurnForm onResult={(r) => { setResult(r); setBatch(null); setUrlResult(null); }} />
              )}
              {tab === "batch" && (
                <BatchUpload onBatchResult={(b) => { setBatch(b); setResult(null); setUrlResult(null); }} />
              )}
              {tab === "url" && (
                <URLAnalyzer onUrlResult={(u) => { setUrlResult(u); setResult(null); setBatch(null); }} />
              )}
            </div>
          </div>

          {/* Endpoints help card */}
          <div className="ts-panel" style={{ padding: "1.2rem 1.4rem" }}>
            <div style={css.helpTitle}>⬡ Endpoints</div>
            <div style={css.helpGrid}>
              {[
                { method: "POST", route: "/predict",       desc: "Single text",   color: "#ff8c00" },
                { method: "POST", route: "/predict_batch", desc: "CSV upload",    color: "#ff8c00" },
                { method: "POST", route: "/predict_url",   desc: "Web page URL",  color: "#ff8c00" },
                { method: "GET",  route: "/health",        desc: "Status",        color: "#00e090" },
              ].map((e) => (
                <div key={e.route} style={css.helpRow}>
                  <span style={{ ...css.methodTag, color: e.color }}>{e.method}</span>
                  <span style={css.routeText}>{e.route}</span>
                  <span style={css.routeDesc}>{e.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* ── RIGHT ── */}
        <section className="ts-panel" style={css.right}>
          <div style={css.rightHeader}>
            <span style={css.rightTitle}>Results</span>
            {hasResult && (
              <button onClick={clearAll} style={css.clearBtn}
                onMouseEnter={(e) => { e.target.style.color = "#ff3c3c"; e.target.style.borderColor = "#ff3c3c"; }}
                onMouseLeave={(e) => { e.target.style.color = "#444458"; e.target.style.borderColor = "#2a2a35"; }}
              >
                ✕ Clear
              </button>
            )}
          </div>

          {/* Pass all three result types */}
          <ResultsDisplay result={result} batch={batch} urlResult={urlResult} />
        </section>

      </main>

      {/* ══ FOOTER ══ */}
      <footer style={css.footer}>
        <span>FastAPI · React · Vite · TF-IDF + Logistic Regression</span>
        <span style={{ color: "#2a2a35" }}>ToxiScan v2.1</span>
      </footer>
    </div>
  );
}

const css = {
  page:    { minHeight: "100vh", display: "flex", flexDirection: "column", background: "#0e0e11", position: "relative", overflow: "hidden" },
  scanline:{ position: "fixed", top: 0, left: 0, right: 0, height: "2px", background: "linear-gradient(90deg,transparent,#ff3c3c22,transparent)", animation: "scanline 8s linear infinite", pointerEvents: "none", zIndex: 0 },
  topbar:  { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 2rem", height: "58px", background: "#16161c", borderBottom: "1px solid #2a2a35", position: "sticky", top: 0, zIndex: 100, flexShrink: 0 },
  brand:   { display: "flex", alignItems: "baseline", gap: "1rem" },
  logo:    { fontFamily: "'IBM Plex Mono',monospace", fontSize: "1.1rem", fontWeight: "700", color: "#ff3c3c", letterSpacing: "0.08em" },
  tagline: { fontSize: "0.65rem", color: "#444458", letterSpacing: "0.06em" },
  topRight:{ display: "flex", alignItems: "center", gap: "1rem" },
  modelInfo:{ fontSize: "0.62rem", color: "#444458", letterSpacing: "0.08em" },
  main:    { flex: 1, display: "grid", gridTemplateColumns: "360px 1fr", gap: "1.5rem", padding: "1.5rem 2rem", position: "relative", zIndex: 1, alignItems: "start" },
  left:    { display: "flex", flexDirection: "column", gap: "1rem", position: "sticky", top: "74px", maxHeight: "calc(100vh - 90px)", overflowY: "auto" },
  tabBar:  { display: "flex", borderBottom: "1px solid #2a2a35", marginBottom: "1rem" },
  tabDesc: { fontSize: "0.68rem", color: "#444458", letterSpacing: "0.06em", marginBottom: "1.2rem" },
  right:   { minHeight: "500px" },
  rightHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.2rem", paddingBottom: "0.8rem", borderBottom: "1px solid #2a2a35" },
  rightTitle:  { fontSize: "0.65rem", color: "#444458", textTransform: "uppercase", letterSpacing: "0.15em" },
  clearBtn: { background: "none", border: "1px solid #2a2a35", borderRadius: "3px", color: "#444458", fontFamily: "'IBM Plex Mono',monospace", fontSize: "0.62rem", padding: "2px 8px", cursor: "pointer", transition: "color 0.2s,border-color 0.2s" },
  helpTitle: { fontSize: "0.65rem", color: "#444458", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: "0.9rem" },
  helpGrid:  { display: "flex", flexDirection: "column", gap: "0.5rem" },
  helpRow:   { display: "flex", alignItems: "center", gap: "0.6rem", fontSize: "0.7rem" },
  methodTag: { fontWeight: "700", fontSize: "0.62rem", letterSpacing: "0.06em", width: "36px", flexShrink: 0 },
  routeText: { color: "#d4d4e0", flex: 1 },
  routeDesc: { color: "#444458", fontSize: "0.62rem" },
  footer:  { display: "flex", justifyContent: "space-between", padding: "0.75rem 2rem", borderTop: "1px solid #2a2a35", fontSize: "0.62rem", color: "#444458", letterSpacing: "0.06em", flexShrink: 0 },
};