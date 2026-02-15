# code/train_baseline.py

import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report
from preprocessing import build_text_pipeline, split_data


def main():

    print("=== Baseline Model ===")

    df = pd.read_csv("data/raw_hf/jigsaw_full.csv")

    X = df["comment_text"]
    y = df["toxic"]

    pipeline = build_text_pipeline()

    X_train, X_test, y_train, y_test = split_data(X, y)

    X_train_vec = pipeline.fit_transform(X_train)
    X_test_vec = pipeline.transform(X_test)

    model = LogisticRegression(max_iter=1000)
    model.fit(X_train_vec, y_train)

    y_pred = model.predict(X_test_vec)

    print(classification_report(y_test, y_pred))


if __name__ == "__main__":
    main()
