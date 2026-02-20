// frontend/src/components/ResultsDisplay.jsx
const LABELS = ["toxic", "severe_toxic", "obscene", "threat", "insult", "identity_hate"];

const LABEL_DISPLAY = {
  toxic: "Toxic",
  severe_toxic: "Severe toxic",
  obscene: "Obscene",
  threat: "Threat",
  insult: "Insult",
  identity_hate: "Identity hate",
};

function clamp01(x) {
  const n = Number(x);
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function fmtPct(x) {
  return `${Math.round(clamp01(x) * 1000) / 10}%`; // 1 décimale
}

function riskLevel(score01) {
  const s = clamp01(score01);
  if (s < 0.25) return { label: "Faible", tone: "ok" };
  if (s < 0.5) return { label: "Modéré", tone: "warn" };
  if (s < 0.75) return { label: "Élevé", tone: "bad" };
  return { label: "Très élevé", tone: "bad2" };
}

function computeGlobalScore(probabilities = {}) {
  // Score global simple et lisible: moyenne des probas (0..1)
  const vals = LABELS.map((l) => clamp01(probabilities?.[l] ?? 0));
  const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
  return mean;
}

function topK(probabilities = {}, k = 3) {
  const items = LABELS.map((l) => ({
    label: l,
    p: clamp01(probabilities?.[l] ?? 0),
  }));
  items.sort((a, b) => b.p - a.p);
  return items.slice(0, k);
}

function badgeClass(pred) {
  return pred === 1 ? "badge bad" : "badge ok";
}

function progressTone(pred, p) {
  // Couleur de barre cohérente: si label détecté -> rouge, sinon vert (ou jaune si moyen)
  if (pred === 1) return "bad";
  if (p >= 0.35) return "warn";
  return "ok";
}

function recommendations(score01, detectedLabels = []) {
  const { label } = riskLevel(score01);
  const detectedTxt = detectedLabels.length ? detectedLabels.join(", ") : "aucun";

  if (label === "Très élevé") {
    return [
      "Contenu très toxique probable : bloquer ou masquer + escalader (modération prioritaire).",
      "Conserver une trace (log) pour audit et amélioration du modèle.",
      `Labels détectés : ${detectedTxt}`,
    ];
  }
  if (label === "Élevé") {
    return [
      "Contenu toxique possible : review humaine recommandée.",
      "Avertir l’utilisateur / demander reformulation (si plateforme).",
      `Labels détectés : ${detectedTxt}`,
    ];
  }
  if (label === "Modéré") {
    return [
      "Risque modéré : surveiller / appliquer filtres soft (ex: masquage partiel).",
      "Conserver l’événement pour statistiques.",
      `Labels détectés : ${detectedTxt}`,
    ];
  }
  return [
    "Risque faible : aucune action automatique nécessaire.",
    "Vous pouvez quand même conserver un log pour monitoring.",
    `Labels détectés : ${detectedTxt}`,
  ];
}

export default function ResultsDisplay({ result, batch }) {
  const single = result || null;
  const probs = single?.probabilities || {};
  const preds = single?.predictions || {};

  const global = single ? computeGlobalScore(probs) : 0;
  const level = single ? riskLevel(global) : null;

  const detected = single
    ? LABELS.filter((l) => (preds?.[l] ?? 0) === 1).map((l) => LABEL_DISPLAY[l] || l)
    : [];

  const top3 = single ? topK(probs, 3) : [];

  return (
    <div className="resultsCard">
      <div className="resultsHeader">
        <h2>Résultats</h2>
        {!single && !batch && <span className="subtle">Aucun résultat pour le moment.</span>}
      </div>

      {/* -------- SINGLE PREDICTION -------- */}
      {single && (
        <div className="section">
          <div className="sectionTitle">
            <span className="sectionDot" />
            <h3>Analyse du texte</h3>
          </div>

          <div className="quoteBox">
            <div className="quoteLabel">Texte</div>
            <div className="quoteText">{single.text}</div>
          </div>

          <div className={`riskBox tone-${level.tone}`}>
            <div className="riskTop">
              <div className="riskTitle">
                <span className="riskKicker">Score global</span>
                <span className="riskScore">{fmtPct(global)}</span>
              </div>
              <span className={`riskPill tone-${level.tone}`}>Risque : {level.label}</span>
            </div>

            <div className="progressTrack">
              <div className={`progressFill tone-${level.tone}`} style={{ width: `${clamp01(global) * 100}%` }} />
            </div>

            <div className="recoBox">
              <div className="recoTitle">Recommandations</div>
              <ul className="recoList">
                {recommendations(global, detected).map((t, idx) => (
                  <li key={idx}>{t}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="sectionTitle" style={{ marginTop: 14 }}>
            <span className="sectionDot" />
            <h3>Top 3 labels les plus probables</h3>
            <span className="subtle">(priorité modération)</span>
          </div>

          <div className="topGrid">
            {top3.map((it) => {
              const pred = preds?.[it.label] ?? 0;
              const tone = progressTone(pred, it.p);
              return (
                <div key={it.label} className="miniCard">
                  <div className="miniTop">
                    <div className="miniName">{LABEL_DISPLAY[it.label] || it.label}</div>
                    <span className={badgeClass(pred)}>{pred}</span>
                  </div>
                  <div className="miniMeta">
                    proba: <b>{clamp01(it.p).toFixed(4)}</b>
                  </div>

                  <div className="miniBar">
                    <div className={`miniFill tone-${tone}`} style={{ width: `${clamp01(it.p) * 100}%` }} />
                  </div>

                  <div className="miniHint">
                    {pred === 1 ? "⚠️ Label détecté." : "✅ Non détecté (selon seuil interne du modèle)."}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="sectionTitle" style={{ marginTop: 14 }}>
            <span className="sectionDot" />
            <h3>Détails complets (6 labels)</h3>
          </div>

          <div className="labelsGrid">
            {LABELS.map((lab) => {
              const pred = preds?.[lab] ?? 0;
              const p = clamp01(probs?.[lab] ?? 0);
              const tone = progressTone(pred, p);

              return (
                <div key={lab} className="labelCardX">
                  <div className="labelTopX">
                    <div className="labelNameX">{LABEL_DISPLAY[lab] || lab}</div>
                    <span className={badgeClass(pred)}>{pred}</span>
                  </div>

                  <div className="labelMetaX">
                    <span className="subtle">proba</span>
                    <b>{p.toFixed(4)}</b>
                  </div>

                  <div className="progressTrack">
                    <div className={`progressFill tone-${tone}`} style={{ width: `${p * 100}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* -------- BATCH -------- */}
      {batch && (
        <div className="section">
          <div className="sectionTitle">
            <span className="sectionDot" />
            <h3>Résultats Batch</h3>
            <span className="subtle">({batch.n_rows} lignes)</span>
          </div>

          <div className="batchList">
            {(batch.results || []).slice(0, 10).map((row, idx) => (
              <div key={idx} className="batchItem">
                <div className="batchText">{row.text}</div>

                <div className="batchBadges">
                  {LABELS.map((lab) => (
                    <span key={lab} className={badgeClass(row?.predictions?.[lab] ?? 0)}>
                      {LABEL_DISPLAY[lab] || lab}:{row?.predictions?.[lab] ?? 0}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="subtle" style={{ marginTop: 8 }}>
            Affichage limité aux 10 premières lignes.
          </div>
        </div>
      )}
    </div>
  );
}