from pathlib import Path
import joblib

INP = Path("models/best_multilabel_tfidf_logreg.joblib")
OUT = Path("models/best_multilabel_tfidf_logreg.pkl")

model = joblib.load(INP)
joblib.dump(model, OUT)
print("Saved ->", OUT)
