# Dataset — ToxiScan

Ce dossier contient l’ensemble des données utilisées dans le projet **ToxiScan**.

---

##  Dataset principal — HuggingFace (Supervisé)

- **Nom :** Jigsaw Toxic Comment Classification  
- **Source :** Hugging Face Datasets  
- **Lien :**  
  https://huggingface.co/datasets/thesofakillers/jigsaw-toxic-comment-classification-challenge  

### Description

Ce dataset contient des **commentaires textuels réels** issus de Wikipédia, accompagnés de labels binaires indiquant différents types de toxicité :

- toxic  
- severe_toxic  
- obscene  
- threat  
- insult  
- identity_hate  

### Usage dans le projet

- Entraînement supervisé des modèles
- Comparaison des algorithmes (Logistic Regression, SVM, etc.)
- Ensembling
- Tracking des expériences avec MLflow

### Localisation

Les fichiers sont stockés dans : data/raw_hf/

---

##  Données collectées via Web Scraping — Hacker News

Afin de tester le modèle dans des conditions réelles, nous avons collecté des commentaires publics depuis **Hacker News**.

Source : https://news.ycombinator.com

Deux méthodes complémentaires ont été utilisées :

---

###  A. Scraping via API publique

Script : code/scraping/hn_api_collect.py

Principe :
- Utilisation de l’API publique officielle de Hacker News
- Récupération de commentaires publics
- Sauvegarde en CSV

Fichier généré : data/raw_scraped/hn_comments_raw.csv

Usage :
- Analyse exploratoire sur données non labellisées
- Test de robustesse du modèle
- Démonstration dans l’interface frontend

---

###  B. Scraping HTML (requests + BeautifulSoup)

Script : code/scraping/hn_html_scrape.py

Principe :
- Récupération de pages HTML des threads Hacker News
- Parsing du HTML avec BeautifulSoup
- Extraction des commentaires (`span.commtext`)
- Nettoyage minimal du texte
- Respect d’un rate limit (sleep entre requêtes)

Fichier généré : data/raw_scraped/hn_comments_html.csv

Objectif pédagogique :
- Apprendre le scraping HTML
- Comprendre la structure DOM d’un site web
- Implémenter une collecte robuste et organisée

---

##  Rôle des données scrapées dans ToxiScan

Les données issues du scraping :

- Ne sont **pas labellisées**
- Ne servent pas à l’entraînement supervisé
- Servent à :
  - Tester la généralisation du modèle
  - Simuler des conditions réelles
  - Alimenter la démonstration UI
  - Réaliser une EDA “monde réel”

---

##  Structure du dossier `data/`
data/
│
├── raw_hf/ # Dataset officiel HuggingFace
├── raw_scraped/ # Données collectées via scraping
│ ├── hn_comments_raw.csv
│ ├── hn_comments_html.csv
│
├── sample/ # Échantillons pour tests rapides
└── README.md

---

##  Remarque importante

- Les données scrapées sont publiques.
- Elles sont utilisées uniquement à des fins académiques.
- Le scraping respecte un rate limit pour éviter toute surcharge du site.

---

Ce dossier constitue la base de travail du pipeline Machine Learning du projet **ToxiScan**.
