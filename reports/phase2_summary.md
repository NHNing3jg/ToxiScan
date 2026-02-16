# Phase 2 — ML Pipeline (Weeks 2–3)

## Week 2 — Preprocessing & Tuning
- Tâche : classification **multi-label** (6 labels) sur texte (Jigsaw Toxic Comment).
- Pipeline baseline : **TF-IDF + OneVsRest(LogisticRegression)**.
- GridSearchCV : optimisation sur `ngram_range`, `min_df`, `max_features`, `C`.
- Best params retenus : `max_features=30000`, `min_df=2`, `ngram_range=(1,2)`, `C=2.0`.

## Week 3 — Advanced Modeling & MLflow
### Commandes
- Lancer l’UI : `mlflow ui`
- Lancer les runs : `python code/ml/train_mlflow_runs.py`

### Runs MLflow comparés
- **Best_TFIDF_LogReg_OVR**
- RF_SVD_OVR (TF-IDF -> SVD -> RandomForest en OneVsRest)
- XGB_SVD_OVR (TF-IDF -> SVD -> XGBoost en OneVsRest)

### Résultat (Compare Runs)
- Best_TFIDF_LogReg_OVR : **f1_weighted ≈ 0.70426**, **f1_macro ≈ 0.56469** (meilleur)
- XGB_SVD_OVR : inférieur à LogReg
- RF_SVD_OVR : le plus faible

 Modèle sélectionné : **Best_TFIDF_LogReg_OVR** (meilleur compromis performance / simplicité pour TF-IDF).
