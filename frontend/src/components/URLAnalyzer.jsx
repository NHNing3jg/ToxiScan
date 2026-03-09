import { useState, useRef } from "react";
import { api } from "../api";

export default function URLAnalyzer({ onUrlResult }) {
  const [url, setUrl]             = useState("");
  const [threshold, setThreshold] = useState(0.35);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);
  const inputRef = useRef(null);

  const analyzeURL = async () => {
    const cleanedURL = url.trim();
    if (!cleanedURL) { inputRef.current?.focus(); return; }

    setLoading(true);
    setError(null);

    try {
      const response = await api.post("/predict_url", {
        url: cleanedURL,
        threshold,
        max_texts: 50,
      });
      // Send results UP to App.jsx → displayed in right panel via ResultsDisplay
      onUrlResult(response.data);
    } catch (err) {
      setError(err.message || "Error analyzing URL.");
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => { if (e.key === "Enter") analyzeURL(); };

  return (
    <div>
      {/* Input */}
      <div style={{ marginBottom: "0.8rem" }}>
        <input
          ref={inputRef}
          type="text"
          placeholder="http://localhost:9000/demo_toxic_page.html"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={handleKey}
          disabled={loading}
          style={S.input}
        />
      </div>

      {/* Threshold slider */}
      <div style={S.sliderRow}>
        <span style={S.sliderLabel}>
          Threshold <span style={{ color: "#ff3c3c", fontWeight: 600 }}>{threshold.toFixed(2)}</span>
        </span>
        <input
          type="range" min="0.1" max="0.9" step="0.05"
          value={threshold}
          onChange={(e) => setThreshold(parseFloat(e.target.value))}
          style={{ accentColor: "#ff3c3c", cursor: "pointer", flex: 1 }}
        />
        <span style={S.sliderHint}>
          {threshold <= 0.3 ? "Sensitive" : threshold <= 0.5 ? "Balanced" : "Strict"}
        </span>
      </div>

      {/* Error */}
      {error && <div style={S.errorBox}>✖ {error}</div>}

      {/* Submit */}
      <button
        onClick={analyzeURL}
        disabled={loading || !url.trim()}
        style={{ ...S.btn, ...(loading || !url.trim() ? S.btnOff : {}) }}
        onMouseEnter={(e) => { if (!loading && url.trim()) e.target.style.background = "#cc2222"; }}
        onMouseLeave={(e) => { if (!loading && url.trim()) e.target.style.background = "#ff3c3c"; }}
      >
        {loading
          ? <span style={S.inner}><span style={S.spinner} />  Scanning...</span>
          : <span style={S.inner}>▶  Analyze URL</span>
        }
      </button>
    </div>
  );
}

const S = {
  input: {
    width: "100%", background: "#0e0e11",
    border: "1px solid #2a2a35", borderRadius: "5px",
    color: "#d4d4e0", fontFamily: "'IBM Plex Mono', monospace",
    fontSize: "0.82rem", padding: "0.7rem 1rem",
    outline: "none", transition: "border-color 0.2s",
  },
  sliderRow: {
    display: "flex", alignItems: "center", gap: "0.8rem",
    marginBottom: "0.9rem", flexWrap: "wrap",
  },
  sliderLabel: { fontSize: "0.7rem", color: "#666680", whiteSpace: "nowrap" },
  sliderHint:  { fontSize: "0.62rem", color: "#444458", whiteSpace: "nowrap" },
  errorBox: {
    background: "#1a0808", border: "1px solid #cc000066",
    borderLeft: "3px solid #cc0000", borderRadius: "4px",
    padding: "0.6rem 1rem", color: "#ff6666",
    fontSize: "0.75rem", marginBottom: "0.8rem",
    fontFamily: "'IBM Plex Mono', monospace",
  },
  btn: {
    width: "100%", background: "#ff3c3c", border: "none",
    borderRadius: "5px", color: "#fff",
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: "0.8rem", fontWeight: "600",
    padding: "0.72rem", cursor: "pointer",
    letterSpacing: "0.06em", transition: "background 0.2s",
  },
  btnOff: { background: "#3a1a1a", color: "#884444", cursor: "not-allowed" },
  inner:  { display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" },
  spinner: {
    display: "inline-block", width: "13px", height: "13px",
    border: "2px solid #884444", borderTopColor: "#fff",
    borderRadius: "50%", animation: "spin 0.7s linear infinite",
  },
};