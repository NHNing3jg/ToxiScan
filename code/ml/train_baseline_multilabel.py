import pandas as pd

from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.multiclass import OneVsRestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, f1_score


LABELS = ["toxic", "severe_toxic", "obscene", "threat", "insult", "identity_hate"]


def main():
    print("=== Baseline MULTI-LABEL (TF-IDF + OneVsRest(LogReg)) ===")

    df = pd.read_csv("data/raw_hf/jigsaw_full.csv")
    df = df.dropna(subset=["comment_text"])

    X = df["comment_text"].astype(str)
    Y = df[LABELS].astype(int)

    X_train, X_test, Y_train, Y_test = train_test_split(
        X, Y, test_size=0.2, random_state=42
    )

    clf = OneVsRestClassifier(
        LogisticRegression(max_iter=2000, class_weight="balanced")
    )

    pipe = Pipeline([
        ("tfidf", TfidfVectorizer(max_features=30000, ngram_range=(1,2), min_df=3, max_df=0.9)),
        ("clf", clf)
    ])

    pipe.fit(X_train, Y_train)
    Y_pred = pipe.predict(X_test)

    print("\nF1 macro (global):", f1_score(Y_test, Y_pred, average="macro"))
    print("F1 weighted (global):", f1_score(Y_test, Y_pred, average="weighted"))

    for i, lab in enumerate(LABELS):
        print("\n---", lab, "---")
        print(classification_report(Y_test.iloc[:, i], Y_pred[:, i], digits=3))


if __name__ == "__main__":
    main()
