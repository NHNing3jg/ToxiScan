import { useEffect, useState } from "react";
import { api } from "./api";
import ChurnForm from "./components/ChurnForm";
import BatchUpload from "./components/BatchUpload";
import ResultsDisplay from "./components/ResultsDisplay";

export default function App() {
  const [health, setHealth] = useState(null);
  const [result, setResult] = useState(null);
  const [batch, setBatch] = useState(null);

  useEffect(() => {
    api
      .get("/health")
      .then((r) => setHealth(r.data))
      .catch(() => setHealth({ status: "error", model_loaded: false }));
  }, []);

  const apiReady = !!health?.model_loaded;

  return (
    <div className="page">
      <header className="topbar">
        <div className="brand">
          <h1 className="title">ToxiScan</h1>
          <p className="subtitle">
            Détection multi-label de toxicité (6 labels) — API FastAPI + Dashboard React
          </p>
        </div>

        <div className={`pill ${apiReady ? "ok" : "bad"}`}>
          API: {apiReady ? "Model loaded" : "Not ready"}
        </div>
      </header>

      <div className="layout2">
        <section className="panel leftPanel">
          <div className="sectionTitle">Analyse</div>

          <ChurnForm
            onResult={(r) => {
              setResult(r);
              setBatch(null);
            }}
          />

          <BatchUpload
            onBatchResult={(b) => {
              setBatch(b);
              setResult(null);
            }}
          />

          <div className="miniHelp">
            <div className="miniHelpTitle">💡 Comment utiliser</div>
            <ul>
              <li>Teste un texte dans <b>/predict</b> (à gauche).</li>
              <li>Ou upload un CSV (colonne <code>text</code> ou <code>comment_text</code>).</li>
              <li>Les résultats s’affichent à droite (Top 3 + détails).</li>
            </ul>
          </div>
        </section>

        <section className="panel rightPanel">
          <div className="sectionTitle">Résultats</div>
          <ResultsDisplay result={result} batch={batch} />
        </section>
      </div>

      <footer className="footer">
        <span>Backend: FastAPI • Frontend: React/Vite • Modèle: TF‑IDF + OVR(LogReg)</span>
      </footer>
    </div>
  );
}