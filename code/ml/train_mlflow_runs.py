import pandas as pd
import mlflow
import mlflow.sklearn

from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.multiclass import OneVsRestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.decomposition import TruncatedSVD
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import f1_score

try:
    from xgboost import XGBClassifier
    HAS_XGB = True
except Exception:
    HAS_XGB = False


LABELS = ["toxic", "severe_toxic", "obscene", "threat", "insult", "identity_hate"]
DATA_PATH = "data/raw_hf/jigsaw_full.csv"

# Best params trouvés par votre GridSearch (LogReg)
BEST_LOGREG_PARAMS = {
    "tfidf__max_features": 30000,
    "tfidf__min_df": 2,
    "tfidf__ngram_range": (1, 2),
    "clf__estimator__C": 2.0,
}


def safe_log_model(model, model_name="model"):
    """
    Compat MLflow: certaines versions attendent 'name=' au lieu de 'artifact_path='.
    Cette fonction gère les deux.
    """
    try:
        mlflow.sklearn.log_model(model, name=model_name)
    except TypeError:
        mlflow.sklearn.log_model(model, artifact_path=model_name)


def eval_and_log(run_name, pipe, params, X_train, X_test, Y_train, Y_test):
    with mlflow.start_run(run_name=run_name):
        # Log params
        for k, v in params.items():
            mlflow.log_param(k, v)

        # Fit + Predict
        pipe.fit(X_train, Y_train)
        Y_pred = pipe.predict(X_test)

        # Metrics
        f1_macro = f1_score(Y_test, Y_pred, average="macro")
        f1_weighted = f1_score(Y_test, Y_pred, average="weighted")

        mlflow.log_metric("f1_macro", float(f1_macro))
        mlflow.log_metric("f1_weighted", float(f1_weighted))

        # Log model artifact
        safe_log_model(pipe, model_name="model")

        print(f"[{run_name}] f1_macro={f1_macro:.4f} | f1_weighted={f1_weighted:.4f}")


def main():
    mlflow.set_experiment("ToxiScan_Phase2_Week3")

    df = pd.read_csv(DATA_PATH).dropna(subset=["comment_text"])
    X = df["comment_text"].astype(str)
    Y = df[LABELS].astype(int)

    X_train, X_test, Y_train, Y_test = train_test_split(
        X, Y, test_size=0.2, random_state=42
    )

    # -------------------------
    # RUN 1: Best TF-IDF + LogReg (OVR)
    # -------------------------
    best_logreg = Pipeline([
        ("tfidf", TfidfVectorizer(
            max_features=BEST_LOGREG_PARAMS["tfidf__max_features"],
            min_df=BEST_LOGREG_PARAMS["tfidf__min_df"],
            ngram_range=BEST_LOGREG_PARAMS["tfidf__ngram_range"],
            max_df=0.9
        )),
        ("clf", OneVsRestClassifier(
            LogisticRegression(
                max_iter=2000,
                class_weight="balanced",
                C=BEST_LOGREG_PARAMS["clf__estimator__C"]
            ),
            n_jobs=1  # stable sur Windows
        ))
    ])

    eval_and_log(
        "Best_TFIDF_LogReg_OVR",
        best_logreg,
        BEST_LOGREG_PARAMS,
        X_train, X_test, Y_train, Y_test
    )

    # -------------------------
    # RUN 2: RandomForest (OVR) avec TF-IDF -> SVD -> RF
    # (on garde “light” pour éviter blocage/temps énorme)
    # -------------------------
    svd_dim = 200
    rf_n_estimators = 120

    rf_pipe = Pipeline([
        ("tfidf", TfidfVectorizer(
            max_features=30000, ngram_range=(1, 2), min_df=2, max_df=0.9
        )),
        ("svd", TruncatedSVD(n_components=svd_dim, random_state=42)),
        ("clf", OneVsRestClassifier(
            RandomForestClassifier(
                n_estimators=rf_n_estimators,
                random_state=42,
                n_jobs=1
            ),
            n_jobs=1  # IMPORTANT Windows
        ))
    ])

    eval_and_log(
        "RF_SVD_OVR",
        rf_pipe,
        {"svd_n_components": svd_dim, "rf_n_estimators": rf_n_estimators},
        X_train, X_test, Y_train, Y_test
    )

    # -------------------------
    # RUN 3: XGBoost (OVR) avec TF-IDF -> SVD -> XGB
    # (light pour finir vite et logger MLflow)
    # -------------------------
    if HAS_XGB:
        xgb_n_estimators = 150

        xgb_pipe = Pipeline([
            ("tfidf", TfidfVectorizer(
                max_features=30000, ngram_range=(1, 2), min_df=2, max_df=0.9
            )),
            ("svd", TruncatedSVD(n_components=svd_dim, random_state=42)),
            ("clf", OneVsRestClassifier(
                XGBClassifier(
                    n_estimators=xgb_n_estimators,
                    max_depth=6,
                    learning_rate=0.1,
                    subsample=0.8,
                    colsample_bytree=0.8,
                    reg_lambda=1.0,
                    objective="binary:logistic",
                    eval_metric="logloss",
                    tree_method="hist",
                    random_state=42,
                    n_jobs=1
                ),
                n_jobs=1
            ))
        ])

        eval_and_log(
            "XGB_SVD_OVR",
            xgb_pipe,
            {"svd_n_components": svd_dim, "xgb_n_estimators": xgb_n_estimators},
            X_train, X_test, Y_train, Y_test
        )
    else:
        print("XGBoost not installed -> skip XGB run (pip install xgboost)")


if __name__ == "__main__":
    main()
