import { useState } from "react";
import { api } from "../api";
import { Upload, Loader2 } from "lucide-react";

export default function BatchUpload({ onBatchResult }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleUpload = async () => {
    setError("");

    if (!file) {
      setError("Veuillez choisir un fichier CSV.");
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("file", file);

      const res = await api.post("/predict_batch", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      onBatchResult(res.data);
    } catch (err) {
      setError(err?.response?.data?.detail || "Erreur API /predict_batch");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2>Batch prediction (CSV)</h2>

      <div className="row">
        <input
          type="file"
          accept=".csv"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />

        <button className="btn" onClick={handleUpload} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="icon spin" /> Upload...
            </>
          ) : (
            <>
              <Upload className="icon" /> Predict batch
            </>
          )}
        </button>
      </div>

      <p className="hint">
        CSV attendu : colonne <code>text</code> ou <code>comment_text</code>.
      </p>

      {error && <div className="error">{error}</div>}
    </div>
  );
}