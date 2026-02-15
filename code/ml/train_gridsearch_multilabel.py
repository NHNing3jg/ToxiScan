import pandas as pd

from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.pipeline import Pipeline
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.multiclass import OneVsRestClassifier
from sklearn.linear_model import LogisticRegression

LABELS = ["toxic", "severe_toxic", "obscene", "threat", "insult", "identity_hate"]


def main():
    print("=== GridSearch MULTI-LABEL ===")

    df = pd.read_csv("data/raw_hf/jigsaw_full.csv").dropna(subset=["comment_text"])
    X = df["comment_text"].astype(str)
    Y = df[LABELS].astype(int)

    X_train, X_test, Y_train, Y_test = train_test_split(
        X, Y, test_size=0.2, random_state=42
    )

    pipe = Pipeline([
        ("tfidf", TfidfVectorizer()),
        ("clf", OneVsRestClassifier(LogisticRegression(max_iter=2000, class_weight="balanced")))
    ])

    param_grid = {
        "tfidf__max_features": [20000, 30000],
        "tfidf__ngram_range": [(1,1), (1,2)],
        "tfidf__min_df": [2, 3],
        "clf__estimator__C": [0.5, 1.0, 2.0],
    }

    grid = GridSearchCV(
        pipe,
        param_grid=param_grid,
        cv=3,
        scoring="f1_macro",
        n_jobs=-1,
        verbose=1
    )

    grid.fit(X_train, Y_train)
    print("\nBest params:", grid.best_params_)
    print("Best CV f1_macro:", grid.best_score_)


if __name__ == "__main__":
    main()
