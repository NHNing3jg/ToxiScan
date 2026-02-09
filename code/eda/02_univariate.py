from pathlib import Path
import re
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

from load_data import load_jigsaw_sample, LABELS  # même dossier

FIG_DIR = Path("reports/figures")
FIG_DIR.mkdir(parents=True, exist_ok=True)

def savefig(name: str):
    plt.tight_layout()
    plt.savefig(FIG_DIR / name, dpi=200)
    plt.close()

def make_text_features(df: pd.DataFrame) -> pd.DataFrame:
    text = df["comment_text"].astype(str)

    df = df.copy()
    df["char_len"] = text.str.len()
    df["word_count"] = text.str.split().apply(len)

    # uppercase ratio (évite division par zéro)
    upper_counts = text.apply(lambda s: sum(1 for c in s if c.isupper()))
    df["upper_ratio"] = upper_counts / df["char_len"].replace(0, np.nan)
    df["upper_ratio"] = df["upper_ratio"].fillna(0.0)

    # ponctuation et chiffres
    df["punct_count"] = text.str.count(r"[!?\.]")
    df["digit_count"] = text.str.count(r"\d")

    # diversité lexicale simple
    def unique_word_ratio(s: str) -> float:
        words = re.findall(r"\b\w+\b", s.lower())
        if not words:
            return 0.0
        return len(set(words)) / len(words)

    df["unique_word_ratio"] = text.apply(unique_word_ratio)
    return df

df = load_jigsaw_sample()
df = make_text_features(df)

print("Shape:", df.shape)
print("Features created:", ["char_len","word_count","upper_ratio","punct_count","digit_count","unique_word_ratio"])
print(df[["char_len","word_count","upper_ratio","punct_count","digit_count","unique_word_ratio"]].describe().T)

# --- Univariate plots (hist + KDE) ---
sns.set_theme(style="whitegrid")

for col in ["char_len", "word_count", "upper_ratio", "punct_count", "digit_count", "unique_word_ratio"]:
    plt.figure(figsize=(7, 4))
    sns.histplot(df[col], bins=50, kde=True)
    plt.title(f"Univariate distribution: {col}")
    savefig(f"03_univariate_hist_kde_{col}.png")

# --- Boxplots for outliers ---
for col in ["char_len", "word_count", "punct_count", "digit_count"]:
    plt.figure(figsize=(7, 2.8))
    sns.boxplot(x=df[col])
    plt.title(f"Boxplot (outliers): {col}")
    savefig(f"04_univariate_boxplot_{col}.png")

# --- Quick skewness report ---
skewness = df[["char_len","word_count","upper_ratio","punct_count","digit_count","unique_word_ratio"]].skew(numeric_only=True)
print("\nSkewness (univariate):\n", skewness.sort_values(ascending=False))

print("\n 02_univariate completed. Figures saved in reports/figures/")
