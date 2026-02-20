import { useState } from "react";
import { api } from "../api";
import { Send, Loader2 } from "lucide-react";

export default function ChurnForm({ onResult }) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handlePredict = async (e) => {
    e.preventDefault();
    setError("");

    if (!text.trim()) {
      setError("Veuillez saisir un texte.");
      return;
    }

    try {
      setLoading(true);
      const res = await api.post("/predict", { text });
      onResult(res.data);
    } catch (err) {
      setError(err?.response?.data?.detail || "Erreur API /predict");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2>Prédiction (texte unique)</h2>

      <form onSubmit={handlePredict} className="form">
        <textarea
          className="textarea"
          rows={5}
          placeholder="Ex: You are stupid and I hate you"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        {error && <div className="error">{error}</div>}

        <button className="btn" type="submit" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="icon spin" /> Loading...
            </>
          ) : (
            <>
              <Send className="icon" /> Predict
            </>
          )}
        </button>
      </form>
    </div>
  );
}