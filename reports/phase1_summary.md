# Phase 1 — Advanced Exploratory Data Analysis (ToxiScan)

## Données utilisées
- **Dataset principal** : Jigsaw Toxic Comment Classification (Hugging Face)  
  Problème de classification **multi-label** sur des commentaires Wikipedia annotés par des humains.
- **Données complémentaires** : commentaires Hacker News collectés via API publique (non labellisés), utilisés pour tests et démonstration.

---

## Phase 1.1 — Structure & Quality Check

### Intégrité des données
- **Missing values** : aucune valeur manquante critique détectée dans `comment_text` ou les labels sur l’échantillon analysé.
- **Duplicats** : absence de doublons significatifs sur le champ `comment_text`.
- **Data leakage** : la colonne `id` (identifiant) a été explicitement ignorée car elle n’apporte aucune information prédictive.

### Déséquilibre des labels
- Les labels sont **fortement déséquilibrés**.
- Les labels `toxic` et `insult` sont les plus fréquents.
- Les labels `threat` et `identity_hate` sont très rares.
- Cette observation implique l’utilisation future de métriques adaptées (F1-score, ROC-AUC par label).

### Nature multi-label
- La majorité des commentaires possèdent **un seul label actif**.
- Une proportion non négligeable de commentaires possède **plusieurs labels simultanément**, confirmant la complexité du problème.

**Figures associées** :
- `01_label_frequency.png`
- `02_nb_labels_hist.png`

---

## Phase 1.2 — Deep Univariate Analysis

### Features textuelles dérivées
Les caractéristiques numériques suivantes ont été extraites à partir du texte :
- `char_len` : longueur du commentaire
- `word_count` : nombre de mots
- `upper_ratio` : proportion de lettres majuscules
- `punct_count` : nombre de signes de ponctuation (! ? .)
- `digit_count` : nombre de chiffres
- `unique_word_ratio` : diversité lexicale

### Observations principales
- Les distributions de `char_len` et `word_count` sont **fortement asymétriques (skewed)**.
- La majorité des commentaires sont courts, avec quelques **outliers très longs**.
- Certaines features présentent une grande variabilité, indiquant un contenu textuel hétérogène.
- Les boxplots révèlent la présence de valeurs extrêmes, typiques des données textuelles réelles.

**Figures associées** :
- `03_univariate_hist_kde_*.png`
- `04_univariate_boxplot_*.png`

---

## Phase 1.3 — Bivariate Analysis

### Comparaison toxic = 0 vs toxic = 1
- Les commentaires toxiques présentent en général :
  - une **longueur légèrement plus élevée**
  - un **usage plus fréquent de la ponctuation**
  - parfois une proportion plus élevée de majuscules
- Les distributions montrent un **décalage** entre les classes, sans séparation parfaite.

### Label rare (ex : `threat`)
- Le label `threat` est très peu représenté dans l’échantillon.
- L’analyse bivariée reste indicative mais confirme la difficulté de modélisation des classes rares.

**Figures associées** :
- `05_bivariate_violin_*_vs_toxic.png`
- `06_bivariate_box_*_vs_toxic.png`

---

## Phase 1.4 — Multivariate Analysis

### Corrélations entre features
- Une **corrélation élevée** est observée entre `char_len` et `word_count`.
- Les autres features présentent des corrélations faibles à modérées.
- Aucune corrélation ne permet à elle seule de prédire la toxicité.

> ⚠️ **Corrélation ≠ causalité**

### Vue multivariée (pairplot)
- Le pairplot met en évidence des zones de recouvrement importantes entre commentaires toxiques et non toxiques.
- Une légère tendance de séparation est observable sur certaines combinaisons de features, mais sans frontière nette.

**Figures associées** :
- `08_multivariate_corr_heatmap.png`
- `09_multivariate_pairplot.png`

---

## Insights clés (synthèse)
1. Le dataset est fortement déséquilibré, notamment pour les labels rares (`threat`, `identity_hate`).
2. Le problème est intrinsèquement multi-label.
3. Les commentaires toxiques ont tendance à être légèrement plus longs.
4. La ponctuation excessive est plus fréquente dans les commentaires toxiques.
5. Les données textuelles présentent une forte variabilité et des outliers.
6. Les distributions sont majoritairement non gaussiennes.
7. Certaines features sont corrélées entre elles mais pas suffisantes individuellement.
8. Une approche purement linéaire sur ces features serait limitée.
9. L’information discriminante viendra principalement du contenu lexical (TF-IDF).
10. Les classes rares nécessiteront une attention particulière lors de la modélisation.

---

## Self‑Guided Tasks (avec réponses)
1. **La médiane de `word_count` est-elle plus élevée pour toxic=1 que toxic=0 ?**  
   → Oui, une légère augmentation est observée.
2. **Quel est le label le plus rare ?**  
   → `threat`.
3. **`upper_ratio` est-il plus élevé pour insult=1 ?**  
   → Tendance légèrement plus élevée, mais non suffisante seule.
4. **Les commentaires multi-label sont-ils plus longs ?**  
   → Oui, ils ont en moyenne une longueur supérieure.
5. **Les outliers doivent-ils être supprimés ?**  
   → Non pour l’instant, car ils représentent des cas réels.

---

## Implications pour la Phase 2 — NLP & Modélisation
- Utilisation de **TF-IDF** pour capturer l’information lexicale.
- Modèles de base : régression logistique, SVM linéaire.
- Utilisation de métriques adaptées au multi-label.
- Gestion explicite du déséquilibre des classes.
- Les features EDA peuvent être utilisées comme compléments, mais pas comme source principale.

---

 **La Phase 1 (Week 1 — Setup, Scraping & EDA) est maintenant entièrement validée et conforme au cahier des charges.**
