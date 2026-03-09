// frontend/src/components/ResultsDisplay.jsx

const LABELS = ["toxic", "severe_toxic", "obscene", "threat", "insult", "identity_hate"];

const LABEL_META = {
  toxic:         { display: "Toxic",         icon: "☣", color: "#ff3c3c", bg: "#3d0f0f" },
  severe_toxic:  { display: "Severe Toxic",  icon: "💀", color: "#ff5555", bg: "#2a0000" },
  obscene:       { display: "Obscene",       icon: "🔞", color: "#e040fb", bg: "#2a0a2e" },
  threat:        { display: "Threat",        icon: "⚠",  color: "#ff8c00", bg: "#2a1a00" },
  insult:        { display: "Insult",        icon: "🗡",  color: "#ff6b6b", bg: "#2e1010" },
  identity_hate: { display: "Identity Hate", icon: "🏴", color: "#f59e0b", bg: "#2a1f00" },
};

// ── Helpers ──────────────────────────────────────────────────
function clamp(x) { const n = Number(x); return isNaN(n) ? 0 : Math.max(0, Math.min(1, n)); }
function pct(x, d = 1) { return `${(clamp(x) * 100).toFixed(d)}%`; }

function globalScore(probs = {}) {
  const vals = LABELS.map((l) => clamp(probs[l] ?? 0));
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

function riskMeta(score) {
  const s = clamp(score);
  if (s < 0.25) return { label: "Low",      color: "#00e090", bg: "#0a2a1a" };
  if (s < 0.50) return { label: "Moderate", color: "#ff8c00", bg: "#2a1a00" };
  if (s < 0.75) return { label: "High",     color: "#ff3c3c", bg: "#1a0808" };
  return              { label: "Very High", color: "#ff0000", bg: "#1a0000" };
}

function recommendations(score, detectedLabels = []) {
  const level = riskMeta(score).label;
  const det   = detectedLabels.length ? detectedLabels.join(", ") : "none";
  const map = {
    "Very High": ["Block or hide immediately — escalate to priority moderation.", "Log for audit trail and model improvement."],
    "High":      ["Human review recommended before publishing.", "Warn the user or request reformulation."],
    "Moderate":  ["Apply soft filters (partial masking, shadow-ban).", "Keep event in monitoring statistics."],
    "Low":       ["No automatic action required.", "Log for background monitoring."],
  };
  return [...(map[level] || []), `Detected labels: ${det}`];
}

// ── Sub-components ───────────────────────────────────────────
function EmptyState() {
  return (
    <div style={S.empty}>
      <div style={{ fontSize: "2.5rem", opacity: 0.2 }}>⬡</div>
      <div style={{ fontSize: "0.85rem", color: "#666680", letterSpacing: "0.08em" }}>No results yet</div>
      <div style={{ fontSize: "0.72rem", color: "#444458", textAlign: "center", lineHeight: 1.7 }}>
        Run an analysis from the left panel —<br />text, CSV batch, or URL scan.
      </div>
    </div>
  );
}

function Separator({ label, right }) {
  return (
    <div style={S.sep}>
      <span>{label}</span>
      <div style={S.sepLine} />
      {right && <span style={{ color: "#444458", whiteSpace: "nowrap" }}>{right}</span>}
    </div>
  );
}

function LabelBar({ lab, prob, pred }) {
  const meta  = LABEL_META[lab];
  const p     = clamp(prob);
  const color = pred === 1 ? meta.color : p >= 0.35 ? "#ff8c00" : "#444458";
  return (
    <div style={{ ...S.labelRow, borderColor: pred === 1 ? meta.color + "44" : "#2a2a35" }}>
      <div style={S.labelTop}>
        <span style={{ fontSize: "0.85rem", width: "20px", flexShrink: 0 }}>{meta.icon}</span>
        <span style={S.labelName}>{meta.display}</span>
        {pred === 1
          ? <span style={{ ...S.detBadge, color: meta.color, borderColor: meta.color, background: meta.bg }}> detected</span>
          : <span style={{ fontSize: "0.7rem", color: "#444458" }}>—</span>
        }
        <span style={{ fontSize: "0.72rem", fontWeight: "700", color, fontFamily: "'IBM Plex Mono',monospace" }}>{pct(p)}</span>
      </div>
      <div style={S.barBg}><div style={{ ...S.barFill, width: pct(p, 0), background: color }} /></div>
    </div>
  );
}

// ── URL result panel ─────────────────────────────────────────
function URLResult({ data }) {
  const agg       = data.aggregate ?? {};
  const results   = data.results   ?? [];
  const toxicOnly = data.toxic_texts ?? [];
  const rate      = ((agg.toxicity_rate ?? 0) * 100).toFixed(1);
  const rateColor = rate > 50 ? "#ff3c3c" : rate > 25 ? "#ff8c00" : "#00e090";
  const labelMeans = agg.label_mean_probabilities ?? {};

  return (
    <div>
      {/* URL pill */}
      <div style={S.urlPill}>
        <span style={{ color: "#444458" }}>⬡</span>
        <span style={{ color: "#d4d4e0", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {data.url}
        </span>
      </div>

      {/* Stats row */}
      <div style={S.statsGrid}>
        {[
          { num: agg.total_texts,                     lbl: "Scraped",        color: "#d4d4e0" },
          { num: agg.toxic_count,                     lbl: "Toxic",          color: "#ff3c3c" },
          { num: `${rate}%`,                          lbl: "Toxicity Rate",  color: rateColor  },
          { num: agg.total_texts - agg.toxic_count,   lbl: "Clean",          color: "#00e090" },
        ].map((s) => (
          <div key={s.lbl} style={{ ...S.statCard, borderColor: s.color + "33" }}>
            <span style={{ ...S.statNum, color: s.color }}>{s.num}</span>
            <span style={S.statLbl}>{s.lbl}</span>
          </div>
        ))}
      </div>

      {/* Label breakdown bars */}
      <Separator label="Label breakdown" />
      <div style={S.labelGrid}>
        {Object.entries(labelMeans).map(([lab, prob]) => {
          const meta  = LABEL_META[lab];
          const p     = clamp(prob);
          const color = meta?.color ?? "#888";
          return (
            <div key={lab} style={S.labelMiniCard}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem", fontSize: "0.7rem" }}>
                <span style={{ color: "#d4d4e0" }}>{meta?.icon} {meta?.display ?? lab}</span>
                <span style={{ color, fontWeight: 700 }}>{pct(p)}</span>
              </div>
              <div style={S.barBg}><div style={{ ...S.barFill, width: pct(p, 0), background: color }} /></div>
            </div>
          );
        })}
      </div>

      {/* Toxic comments */}
      <Separator
        label={toxicOnly.length > 0 ? `☣ ${toxicOnly.length} toxic comments` : "✅ No toxic comments"}
        right={`${results.length} total`}
      />
      {toxicOnly.map((r, i) => {
        const activeLabels = Object.entries(r.predictions ?? {}).filter(([, v]) => v === 1).map(([k]) => k);
        return (
          <div key={i} style={S.commentCard}>
            <p style={S.commentText}>{r.text}</p>
            <div style={S.tagsRow}>
              {activeLabels.map((lab) => (
                <span key={lab} style={{
                  ...S.miniTag,
                  color: LABEL_META[lab]?.color ?? "#888",
                  borderColor: LABEL_META[lab]?.color ?? "#888",
                  background: LABEL_META[lab]?.bg ?? "#111",
                }}>
                  {LABEL_META[lab]?.icon} {LABEL_META[lab]?.display ?? lab}
                </span>
              ))}
              {r.top_prob > 0 && (
                <span style={{ marginLeft: "auto", fontSize: "0.7rem", color: "#ff3c3c", fontWeight: 700 }}>
                  ▲ {(r.top_prob * 100).toFixed(1)}%
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Main component ───────────────────────────────────────────
export default function ResultsDisplay({ result, batch, urlResult }) {
  const single = result ?? null;
  const probs  = single?.probabilities ?? {};
  const preds  = single?.predictions   ?? {};
  const score  = single ? globalScore(probs) : 0;
  const detected = single
    ? LABELS.filter((l) => (preds[l] ?? 0) === 1).map((l) => LABEL_META[l].display)
    : [];

  // ── Empty ──
  if (!single && !batch && !urlResult) return <EmptyState />;

  // ── URL result ──
  if (urlResult) return <URLResult data={urlResult} />;

  // ── Single text ──
  if (single) {
    const risk = riskMeta(score);
    return (
      <div>
        {/* Analyzed text */}
        <div style={S.quoteBox}>
          <div style={S.quoteLabel}>Analyzed text</div>
          <div style={S.quoteText}>{single.text}</div>
        </div>

        {/* Score gauge */}
        <div style={{ ...S.gaugeWrap, background: risk.bg, borderColor: risk.color + "44" }}>
          <span style={S.gaugeKicker}>Global toxicity score</span>
          <span style={{ ...S.gaugeScore, color: risk.color }}>{pct(score)}</span>
          <span style={{ ...S.riskPill, color: risk.color, borderColor: risk.color, background: risk.bg }}>
            Risk: {risk.label}
          </span>
          <div style={{ ...S.barBg, marginTop: "0.9rem" }}>
            <div style={{ ...S.barFill, width: pct(score, 0), background: risk.color }} />
          </div>
        </div>

        {/* Recommendations */}
        <div style={{ ...S.recoBox, borderColor: risk.color + "33" }}>
          <div style={{ ...S.recoTitle, color: risk.color }}>▸ Recommended actions</div>
          {recommendations(score, detected).map((r, i) => (
            <div key={i} style={S.recoItem}>
              <span style={{ color: risk.color, marginRight: "0.5rem" }}>›</span>{r}
            </div>
          ))}
        </div>

        {/* Label breakdown */}
        <Separator label="6 label breakdown" />
        {LABELS.map((lab) => (
          <LabelBar key={lab} lab={lab} prob={probs[lab] ?? 0} pred={preds[lab] ?? 0} />
        ))}
      </div>
    );
  }

  // ── Batch ──
  if (batch) {
    const rows   = batch.results ?? [];
    const nToxic = rows.filter((r) => LABELS.some((l) => (r?.predictions?.[l] ?? 0) === 1)).length;
    const rate   = rows.length ? ((nToxic / rows.length) * 100).toFixed(1) : 0;

    return (
      <div>
        <div style={S.statsGrid}>
          {[
            { num: batch.n_rows,         lbl: "Total rows", color: "#d4d4e0" },
            { num: nToxic,               lbl: "Toxic",      color: "#ff3c3c" },
            { num: `${rate}%`,           lbl: "Rate",       color: rate > 50 ? "#ff3c3c" : "#ff8c00" },
            { num: batch.n_rows - nToxic, lbl: "Clean",     color: "#00e090" },
          ].map((s) => (
            <div key={s.lbl} style={{ ...S.statCard, borderColor: s.color + "33" }}>
              <span style={{ ...S.statNum, color: s.color }}>{s.num}</span>
              <span style={S.statLbl}>{s.lbl}</span>
            </div>
          ))}
        </div>

        <Separator label="First 10 results" />

        {rows.slice(0, 10).map((row, i) => {
          const detected = LABELS.filter((l) => (row?.predictions?.[l] ?? 0) === 1);
          return (
            <div key={i} style={{ ...S.commentCard, borderLeftColor: detected.length ? "#ff3c3c" : "#00e090" }}>
              <p style={S.commentText}>{row.text}</p>
              <div style={S.tagsRow}>
                {detected.length === 0
                  ? <span style={{ fontSize: "0.7rem", color: "#00e090" }}>✓ clean</span>
                  : detected.map((lab) => (
                      <span key={lab} style={{ ...S.miniTag, color: LABEL_META[lab].color, borderColor: LABEL_META[lab].color, background: LABEL_META[lab].bg }}>
                        {LABEL_META[lab].icon} {LABEL_META[lab].display}
                      </span>
                    ))
                }
              </div>
            </div>
          );
        })}
        {rows.length > 10 && (
          <div style={S.moreRow}>+ {rows.length - 10} more rows</div>
        )}
      </div>
    );
  }

  return null;
}

// ── Styles ───────────────────────────────────────────────────
const S = {
  empty: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "320px", gap: "0.8rem", color: "#444458" },
  sep:   { display: "flex", alignItems: "center", gap: "0.8rem", fontSize: "0.62rem", color: "#444458", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "0.8rem", marginTop: "1rem" },
  sepLine: { flex: 1, height: "1px", background: "#2a2a35" },

  urlPill: { display: "flex", alignItems: "center", gap: "0.6rem", background: "#16161c", border: "1px solid #2a2a35", borderRadius: "4px", padding: "0.5rem 0.9rem", fontSize: "0.72rem", fontFamily: "'IBM Plex Mono',monospace", marginBottom: "1rem", overflow: "hidden" },

  statsGrid: { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "0.7rem", marginBottom: "1.2rem" },
  statCard:  { background: "#16161c", border: "1px solid", borderRadius: "5px", padding: "0.8rem", textAlign: "center" },
  statNum:   { display: "block", fontSize: "1.4rem", fontWeight: "700", lineHeight: 1, marginBottom: "0.3rem" },
  statLbl:   { fontSize: "0.58rem", color: "#666680", textTransform: "uppercase", letterSpacing: "0.1em" },

  labelGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginBottom: "1rem" },
  labelMiniCard: { background: "#16161c", border: "1px solid #2a2a35", borderRadius: "4px", padding: "0.6rem 0.8rem" },

  labelRow: { border: "1px solid", borderRadius: "4px", padding: "0.7rem 1rem", marginBottom: "0.5rem", background: "#16161c" },
  labelTop: { display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" },
  labelName: { fontSize: "0.75rem", color: "#d4d4e0", flex: 1, letterSpacing: "0.04em" },
  detBadge: { fontSize: "0.58rem", padding: "1px 6px", borderRadius: "2px", border: "1px solid", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: "600" },

  barBg:   { height: "3px", background: "#2a2a35", borderRadius: "2px", overflow: "hidden" },
  barFill: { height: "100%", borderRadius: "2px", transition: "width 0.6s ease" },

  commentCard: { background: "#1a0e0e", border: "1px solid #ff3c3c22", borderLeft: "3px solid", borderLeftColor: "#ff3c3c", borderRadius: "4px", padding: "0.8rem 1rem", marginBottom: "0.6rem" },
  commentText: { fontSize: "0.8rem", color: "#c0c0d0", lineHeight: "1.55", marginBottom: "0.7rem" },
  tagsRow:     { display: "flex", flexWrap: "wrap", gap: "0.4rem", alignItems: "center" },
  miniTag:     { fontSize: "0.58rem", padding: "1px 7px", borderRadius: "2px", border: "1px solid", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: "600" },
  moreRow:     { textAlign: "center", fontSize: "0.68rem", color: "#444458", padding: "0.8rem", border: "1px dashed #2a2a35", borderRadius: "4px" },

  quoteBox:   { background: "#16161c", border: "1px solid #2a2a35", borderRadius: "5px", padding: "1rem 1.2rem", marginBottom: "1rem" },
  quoteLabel: { fontSize: "0.6rem", color: "#444458", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "0.5rem" },
  quoteText:  { fontSize: "0.85rem", color: "#d4d4e0", lineHeight: "1.6", fontStyle: "italic" },

  gaugeWrap:   { border: "1px solid", borderRadius: "6px", padding: "1.2rem 1.4rem", marginBottom: "1rem" },
  gaugeKicker: { display: "block", fontSize: "0.6rem", color: "#666680", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "0.3rem" },
  gaugeScore:  { display: "block", fontSize: "2.2rem", fontWeight: "700", lineHeight: 1, marginBottom: "0.6rem", fontFamily: "'IBM Plex Mono',monospace" },
  riskPill:    { display: "inline-block", fontSize: "0.65rem", padding: "2px 10px", borderRadius: "3px", border: "1px solid", letterSpacing: "0.1em", textTransform: "uppercase" },

  recoBox:   { border: "1px solid", borderRadius: "5px", padding: "1rem 1.2rem", marginBottom: "1.2rem", background: "#16161c" },
  recoTitle: { fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "0.7rem" },
  recoItem:  { fontSize: "0.75rem", color: "#d4d4e0", lineHeight: "1.6", paddingLeft: "0.5rem", marginBottom: "0.2rem", display: "flex" },
};