from pathlib import Path
import json

import pandas as pd
import joblib

from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.multiclass import OneVsRestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import f1_score, classification_report


LABELS = ["toxic", "severe_toxic", "obscene", "threat", "insult", "identity_hate"]

#  Best params from your GridSearch output
BEST_PARAMS = {
    "tfidf__max_features": 30000,
    "tfidf__min_df": 2,
    "tfidf__ngram_range": (1, 2),
    "clf__estimator__C": 2.0,
}

DATA_PATH = Path("data/raw_hf/jigsaw_full.csv")
MODELS_DIR = Path("models")
REPORTS_DIR = Path("reports")


def main():
    print("=== Train BEST Multi-label Model (TF-IDF + OneVsRest(LogReg)) ===")

    if not DATA_PATH.exists():
        raise FileNotFoundError(f"Dataset not found: {DATA_PATH}")

    df = pd.read_csv(DATA_PATH).dropna(subset=["comment_text"])
    X = df["comment_text"].astype(str)
    Y = df[LABELS].astype(int)

    # Split (same as before for comparability)
    X_train, X_test, Y_train, Y_test = train_test_split(
        X, Y, test_size=0.2, random_state=42
    )

    # Build best pipeline
    pipe = Pipeline([
        ("tfidf", TfidfVectorizer(
            max_features=BEST_PARAMS["tfidf__max_features"],
            min_df=BEST_PARAMS["tfidf__min_df"],
            ngram_range=BEST_PARAMS["tfidf__ngram_range"],
            max_df=0.9,
        )),
        ("clf", OneVsRestClassifier(
            LogisticRegression(
                max_iter=2000,
                class_weight="balanced",
                C=BEST_PARAMS["clf__estimator__C"],
            )
        ))
    ])

    pipe.fit(X_train, Y_train)
    Y_pred = pipe.predict(X_test)

    f1_macro = f1_score(Y_test, Y_pred, average="macro")
    f1_weighted = f1_score(Y_test, Y_pred, average="weighted")

    print("\n Global metrics")
    print("F1 macro   :", f1_macro)
    print("F1 weighted:", f1_weighted)

    # Per-label report (useful for the professor)
    print("\n Per-label reports")
    for i, lab in enumerate(LABELS):
        print(f"\n--- {lab} ---")
        print(classification_report(Y_test.iloc[:, i], Y_pred[:, i], digits=3))

    # Save artifacts
    MODELS_DIR.mkdir(exist_ok=True)
    REPORTS_DIR.mkdir(exist_ok=True)

    model_path = MODELS_DIR / "best_multilabel_tfidf_logreg.joblib"
    joblib.dump(pipe, model_path)
    print(f"\nSaved model -> {model_path}")

    metrics = {
        "f1_macro": float(f1_macro),
        "f1_weighted": float(f1_weighted),
        "best_params": BEST_PARAMS,
        "labels": LABELS,
    }
    metrics_path = REPORTS_DIR / "best_model_metrics.json"
    metrics_path.write_text(json.dumps(metrics, indent=2), encoding="utf-8")
    print(f"Saved metrics -> {metrics_path}")


if __name__ == "__main__":
    main()
