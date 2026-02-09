from pathlib import Path
import pandas as pd

SAMPLE_PATH = Path("data/sample/jigsaw_sample.csv")
LABELS = ["toxic", "severe_toxic", "obscene", "threat", "insult", "identity_hate"]

def load_jigsaw_sample():
    df = pd.read_csv(SAMPLE_PATH)
    # colonne texte (souvent "comment_text" dans Jigsaw)
    if "comment_text" not in df.columns:
        raise ValueError("Column 'comment_text' not found in sample CSV.")
    df = df.dropna(subset=["comment_text"]).copy()
    return df
