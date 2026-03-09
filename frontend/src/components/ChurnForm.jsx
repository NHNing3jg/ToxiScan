import { useState } from "react";
import { api } from "../api";

export default function ChurnForm({ onResult }) {
  const [text, setText]       = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const handlePredict = async (e) => {
    e.preventDefault();
    setError("");

    if (!text.trim()) {
      setError("Please enter a text to analyze.");
      return;
    }

    try {
      setLoading(true);
      const res = await api.post("/predict", { text });
      onResult(res.data);
    } catch (err) {
      setError(err.message || "API error — check FastAPI logs.");
    } finally {
      setLoading(false);
    }
  };

  const charCount = text.length;
  const isEmpty   = !text.trim();

  return (
    <div>

      {/* Textarea */}
      <div style={S.textareaWrap}>
        <textarea
          rows={5}
          placeholder="Ex: You are stupid and I hate you..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && e.ctrlKey) handlePredict(e);
          }}
          style={S.textarea}
          disabled={loading}
        />
        <div style={S.textareaFooter}>
          <span style={{ color: charCount > 500 ? "#ff8c00" : "#444458" }}>
            {charCount} chars
          </span>
          <span style={S.hint}>Ctrl+Enter to submit</span>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={S.errorBox}>
          ✖ {error}
        </div>
      )}

      {/* Submit */}
      <button
        onClick={handlePredict}
        disabled={loading || isEmpty}
        style={{
          ...S.btn,
          ...(loading || isEmpty ? S.btnDisabled : {}),
        }}
        onMouseEnter={(e) => {
          if (!loading && !isEmpty) e.target.style.background = "#cc2222";
        }}
        onMouseLeave={(e) => {
          if (!loading && !isEmpty) e.target.style.background = "#ff3c3c";
        }}
      >
        {loading ? (
          <span style={S.btnInner}>
            <span style={S.spinner} /> Analyzing...
          </span>
        ) : (
          <span style={S.btnInner}>
            ▶ Predict toxicity
          </span>
        )}
      </button>

    </div>
  );
}

const S = {
  textareaWrap: {
    marginBottom: "0.8rem",
  },
  textarea: {
    width: "100%",
    background: "#0e0e11",
    border: "1px solid #2a2a35",
    borderRadius: "5px",
    color: "#d4d4e0",
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: "0.83rem",
    lineHeight: "1.6",
    padding: "0.8rem 1rem",
    resize: "vertical",
    outline: "none",
    transition: "border-color 0.2s, box-shadow 0.2s",
    display: "block",
  },
  textareaFooter: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: "0.4rem",
    fontSize: "0.62rem",
    fontFamily: "'IBM Plex Mono', monospace",
  },
  hint: { color: "#444458" },
  errorBox: {
    background: "#1a0808",
    border: "1px solid #cc000066",
    borderLeft: "3px solid #cc0000",
    borderRadius: "4px",
    padding: "0.7rem 1rem",
    color: "#ff6666",
    fontSize: "0.75rem",
    marginBottom: "0.8rem",
    fontFamily: "'IBM Plex Mono', monospace",
  },
  btn: {
    width: "100%",
    background: "#ff3c3c",
    border: "none",
    borderRadius: "5px",
    color: "#fff",
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: "0.8rem",
    fontWeight: "600",
    padding: "0.75rem",
    cursor: "pointer",
    letterSpacing: "0.06em",
    transition: "background 0.2s, transform 0.1s",
  },
  btnDisabled: {
    background: "#3a1a1a",
    color: "#884444",
    cursor: "not-allowed",
  },
  btnInner: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.6rem",
  },
  spinner: {
    display: "inline-block",
    width: "13px",
    height: "13px",
    border: "2px solid #884444",
    borderTopColor: "#fff",
    borderRadius: "50%",
    animation: "spin 0.7s linear infinite",
  },
};