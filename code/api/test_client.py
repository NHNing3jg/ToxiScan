"""
Test client pour l'API ToxiScan
Permet de tester :
- /health
- /predict
- /predict_batch
"""

import requests
import json
from pathlib import Path

BASE_URL = "http://127.0.0.1:8000"
HEALTH_URL = f"{BASE_URL}/health"
PREDICT_URL = f"{BASE_URL}/predict"
BATCH_URL = f"{BASE_URL}/predict_batch"


# ===============================
# Test 1 — Health Check
# ===============================
def test_health():
    print("\n=== TEST /health ===")
    try:
        r = requests.get(HEALTH_URL, timeout=5)
        print("Status:", r.status_code)
        print(json.dumps(r.json(), indent=4))
    except Exception as e:
        print("Erreur health:", e)


# ===============================
# Test 2 — Predict single text
# ===============================
def test_predict(text: str):
    print("\n=== TEST /predict ===")
    payload = {"text": text}

    try:
        r = requests.post(PREDICT_URL, json=payload, timeout=10)
        print("Status:", r.status_code)

        if r.status_code == 200:
            print(json.dumps(r.json(), indent=4))
        else:
            print("Erreur:", r.text)

    except requests.exceptions.ConnectionError:
        print(" API non accessible (uvicorn lancé ?)")
    except Exception as e:
        print("Erreur predict:", e)


# ===============================
# Test 3 — Predict batch CSV
# ===============================
def test_batch(csv_path: str):
    print("\n=== TEST /predict_batch ===")

    path = Path(csv_path)

    if not path.exists():
        print("Fichier CSV introuvable:", csv_path)
        return

    try:
        with open(path, "rb") as f:
            files = {"file": f}
            r = requests.post(BATCH_URL, files=files, timeout=20)

        print("Status:", r.status_code)

        if r.status_code == 200:
            print(json.dumps(r.json(), indent=4))
        else:
            print("Erreur:", r.text)

    except Exception as e:
        print("Erreur batch:", e)


# ===============================
# MAIN
# ===============================
if __name__ == "__main__":

    #  Health
    test_health()

    #  Single prediction
    test_predict("You are stupid and I hate you")

    #  Batch prediction (adapte le chemin si besoin)
    test_batch("data/sample/api_batch_demo.csv")
