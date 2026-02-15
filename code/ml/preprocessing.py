# code/preprocessing.py

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split


def build_text_pipeline():
    """
    Construit un pipeline TF-IDF simple
    """

    tfidf = TfidfVectorizer(
        max_features=20000,
        ngram_range=(1, 2),
        min_df=3,
        max_df=0.9,
        stop_words="english"
    )

    pipeline = Pipeline([
        ("tfidf", tfidf)
    ])

    return pipeline


def split_data(X, y, test_size=0.2):
    return train_test_split(
        X,
        y,
        test_size=test_size,
        random_state=42,
        stratify=y
    )
