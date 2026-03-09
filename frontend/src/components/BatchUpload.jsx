import { useState, useRef } from "react";
import { api } from "../api";

export default function BatchUpload({ onBatchResult }) {
  const [file, setFile]       = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  const handleFile = (f) => {
    if (!f) return;
    if (!f.name.toLowerCase().endsWith(".csv")) {
      setError("Only .csv files are accepted.");
      setFile(null);
      return;
    }
    setError("");
    setFile(f);
  };

  const handleUpload = async () => {
    setError("");
    if (!file) { setError("Please select a CSV file first."); return; }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("file", file);
      const res = await api.post("/predict_batch", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onBatchResult(res.data);
    } catch (err) {
      setError(err.message || "API error — check FastAPI logs.");
    } finally {
      setLoading(false);
    }
  };

  // Drag & drop handlers
  const onDragOver  = (e) => { e.preventDefault(); setDragOver(true);  };
  const onDragLeave = ()  => setDragOver(false);
  const onDrop      = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files?.[0] ?? null);
  };

  return (
    <div>

      {/* Drop zone */}
      <div
        style={{ ...S.dropZone, ...(dragOver ? S.dropZoneActive : {}), ...(file ? S.dropZoneReady : {}) }}
        onClick={() => inputRef.current?.click()}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          style={{ display: "none" }}
          onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
        />

        {file ? (
          <>
            <div style={S.fileIcon}>⊞</div>
            <div style={S.fileName}>{file.name}</div>
            <div style={S.fileSize}>{(file.size / 1024).toFixed(1)} KB</div>
          </>
        ) : (
          <>
            <div style={S.uploadIcon}>⬆</div>
            <div style={S.dropLabel}>Drop CSV here or click to browse</div>
            <div style={S.dropHint}>Columns expected: <code style={S.code}>text</code> or <code style={S.code}>comment_text</code></div>
          </>
        )}
      </div>

      {/* Error */}
      {error && (
        <div style={S.errorBox}>✖ {error}</div>
      )}

      {/* Actions row */}
      <div style={S.actionsRow}>
        {file && (
          <button
            onClick={() => { setFile(null); setError(""); }}
            style={S.btnClear}
            onMouseEnter={(e) => { e.target.style.borderColor = "#ff3c3c"; e.target.style.color = "#ff3c3c"; }}
            onMouseLeave={(e) => { e.target.style.borderColor = "#2a2a35"; e.target.style.color = "#666680"; }}
          >
            ✕ Remove
          </button>
        )}

        <button
          onClick={handleUpload}
          disabled={loading || !file}
          style={{ ...S.btnSubmit, ...(!file || loading ? S.btnDisabled : {}) }}
          onMouseEnter={(e) => { if (file && !loading) e.target.style.background = "#cc2222"; }}
          onMouseLeave={(e) => { if (file && !loading) e.target.style.background = "#ff3c3c"; }}
        >
          {loading
            ? <span style={S.btnInner}><span style={S.spinner} /> Processing...</span>
            : <span style={S.btnInner}>▶ Predict batch</span>
          }
        </button>
      </div>

    </div>
  );
}

const S = {
  dropZone: {
    border: "1px dashed #2a2a35",
    borderRadius: "6px",
    padding: "1.6rem 1rem",
    textAlign: "center",
    cursor: "pointer",
    transition: "border-color 0.2s, background 0.2s",
    marginBottom: "0.8rem",
    background: "#0e0e11",
  },
  dropZoneActive: {
    borderColor: "#ff3c3c",
    background: "#1a0e0e",
  },
  dropZoneReady: {
    borderColor: "#00e090",
    borderStyle: "solid",
    background: "#0e1a14",
  },
  uploadIcon: { fontSize: "1.5rem", color: "#444458", marginBottom: "0.5rem" },
  dropLabel:  { fontSize: "0.78rem", color: "#666680", marginBottom: "0.4rem" },
  dropHint:   { fontSize: "0.65rem", color: "#444458" },
  code: {
    background: "#1c1c24",
    border: "1px solid #2a2a35",
    borderRadius: "2px",
    padding: "0 4px",
    color: "#ff8c00",
    fontFamily: "'IBM Plex Mono', monospace",
  },
  fileIcon: { fontSize: "1.4rem", color: "#00e090", marginBottom: "0.4rem" },
  fileName: { fontSize: "0.8rem", color: "#d4d4e0", fontWeight: "600", marginBottom: "0.2rem" },
  fileSize: { fontSize: "0.65rem", color: "#444458" },

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

  actionsRow: {
    display: "flex",
    gap: "0.6rem",
  },
  btnClear: {
    background: "none",
    border: "1px solid #2a2a35",
    borderRadius: "4px",
    color: "#666680",
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: "0.72rem",
    padding: "0.65rem 1rem",
    cursor: "pointer",
    transition: "border-color 0.2s, color 0.2s",
    whiteSpace: "nowrap",
  },
  btnSubmit: {
    flex: 1,
    background: "#ff3c3c",
    border: "none",
    borderRadius: "4px",
    color: "#fff",
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: "0.8rem",
    fontWeight: "600",
    padding: "0.7rem",
    cursor: "pointer",
    letterSpacing: "0.06em",
    transition: "background 0.2s",
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
    width: "13px", height: "13px",
    border: "2px solid #884444",
    borderTopColor: "#fff",
    borderRadius: "50%",
    animation: "spin 0.7s linear infinite",
  },
};