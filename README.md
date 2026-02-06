# ToxiScan — Plateforme End-to-End de Détection de Contenus Toxiques 

**Module :** Python for Data Science 2 (Guided Machine Learning Project)  
**Encadrant :** Haythem Ghazouani  
**Année universitaire :** 2025–2026  
**Durée du projet :** 7 semaines  

---

##  Équipe (Groupe de 4)

- **Nour BEN HASSINE** — Acquisition des données (dataset + web scraping) & EDA  
- **Nouha BEN KHELIL** — Prétraitement des données textuelles & Feature Engineering  
- **Hadir FELLI** — Modélisation, comparaison des modèles, ensembling & MLflow  
- **Nouha BRIKI** — Backend FastAPI, Frontend Angular & Docker  

 **Mail de groupe :** nhningjg@gmail.com  

---

##  Contexte & Problématique

Avec l’essor des plateformes numériques, les contenus toxiques (insultes, propos haineux, menaces, abus verbaux) sont devenus un problème majeur.
La modération manuelle est coûteuse, lente et difficile à généraliser.

**ToxiScan** a pour objectif de concevoir une **solution intelligente et automatisée** capable de détecter la toxicité dans des contenus textuels réels, en s’appuyant sur des techniques de **Machine Learning appliquées aux données textuelles**, tout en respectant une approche **end-to-end** et **MLOps**.

---

##  Objectifs du projet

L’objectif principal est de construire un **projet complet de bout en bout**, de la donnée brute jusqu’au déploiement.

Les objectifs spécifiques sont :

1. Sélectionner et exploiter un **dataset textuel réel et volumineux** (non Kaggle).
2. Collecter des données supplémentaires via **web scraping** pour se rapprocher de conditions réelles.
3. Réaliser une **analyse exploratoire des données (EDA)**.
4. Mettre en place un **pipeline de prétraitement des données textuelles**.
5. Entraîner et comparer **plusieurs modèles de Machine Learning**.
6. Appliquer des **méthodes ensemblistes** pour améliorer les performances.
7. Assurer la **traçabilité des expériences** avec **MLflow**.
8. Exporter le **meilleur modèle** sous forme de fichier `.pkl`.
9. Déployer le modèle via une **API FastAPI** (avec Swagger).
10. Développer une **interface frontend Angular** pour tester et visualiser les prédictions.
11. Containeriser l’application avec **Docker / docker-compose**.
12. (Optionnel) Mettre en place une automatisation via **GitHub Actions**.

---

##  Dataset principal (Source officielle)

- **Nom du dataset :** Jigsaw Toxic Comment Classification  
- **Source :** Hugging Face Datasets  
- **Lien :**  
  https://huggingface.co/datasets/thesofakillers/jigsaw-toxic-comment-classification-challenge  

### Description
Ce dataset contient des **commentaires textuels réels** accompagnés de labels indiquant différents types de toxicité (toxic, insult, threat, etc.).

### Pourquoi ce dataset ?
- Données **textuelles réelles**
- **Volume important** (~466 000 lignes)
- Problème industriel réel (modération de contenu)
- Parfaitement adapté à :
  - la comparaison de modèles
  - l’ensembling
  - le tracking MLflow

---

##  Web Scraping (complément de données réelles)

En complément du dataset labellisé, un **web scraping** sera réalisé afin de collecter des textes publics et tester le modèle dans des conditions réelles.

### Source prévue
- **Hacker News (API publique)** — commentaires publics

### Objectifs du scraping
- Collecter entre **50 000 et 200 000 commentaires**
- Tester la robustesse du modèle sur des données non labellisées
- Réaliser une EDA “monde réel”
- Alimenter la démonstration du frontend

> Le dataset Hugging Face sera utilisé pour l’entraînement supervisé,  
> tandis que les données scrapées serviront principalement à l’évaluation et à la démonstration.

---

##  Architecture cible (End-to-End)

```mermaid
flowchart LR
  A[Sources de données\nDataset HuggingFace (labellisé)\n+ Web Scraping (Hacker News)]
    --> B[Nettoyage & EDA]

  B --> C[Pipeline ML\nPrétraitement + Feature Engineering]

  C --> D[Entraînement des modèles\nBaselines + Modèles avancés]

  D --> E[Ensembling\nVoting / Stacking]

  E --> F[MLflow Tracking\nParamètres, métriques, artefacts]

  F --> G[Meilleur modèle\nExport .pkl]

  G --> H[API Backend\nFastAPI + Swagger]

  H --> I[Frontend\nAngular]

  I --> J[Déploiement\nDocker & docker-compose]

---
##  Modélisation & Comparaison (prévision)

### Modèles de base
- Logistic Regression
- Naive Bayes

### Modèles avancés
- Support Vector Machine (SVM)
- Random Forest / XGBoost (selon faisabilité)

### Approches ensemblistes
- Voting Classifier
- Stacking Classifier

### Métriques d’évaluation
- Accuracy
- F1-score (macro / weighted)
- Recall (classe toxique)
- (Optionnel) ROC-AUC

Toutes les expériences seront enregistrées et comparées avec **MLflow**.

---
##  Stack technique

- **Langage :** Python  
- **Data Science :** pandas, numpy, scikit-learn  
- **Données textuelles :** TF-IDF, preprocessing de texte  
- **MLOps :** MLflow  
- **Backend :** FastAPI + Swagger  
- **Frontend :** Angular  
- **Déploiement :** Docker & docker-compose  
- **CI/CD (optionnel) :** GitHub Actions  

---
##  Structure du repository
ToxiScan/
├── README.md
├── requirements.txt
├── data/
│ └── README.md
├── code/
│ ├── scraping/
│ ├── preprocessing.py
│ ├── train.py
│ ├── evaluate.py
│ ├── mlflow_utils.py
│ └── api/
├── frontend/
├── tutos/
├── Dockerfile.backend
├── Dockerfile.frontend
└── docker-compose.yml


---
##  Livrable – Première semaine

Pour la première semaine, ce dépôt contient :

- ✔ Le sujet du projet et sa problématique  
- ✔ Les objectifs détaillés  
- ✔ Le lien du dataset officiel  
- ✔ Un plan de web scraping réaliste  
- ✔ L’architecture cible du projet  
- ✔ La structure du repository conforme aux exigences  

---
##  Conclusion

**ToxiScan** est un projet de Machine Learning appliqué aux données textuelles,
couvrant l’ensemble du cycle de vie d’un modèle, depuis la donnée brute jusqu’au
déploiement, tout en respectant les bonnes pratiques de l’ingénierie Data Science
et du MLOps.


