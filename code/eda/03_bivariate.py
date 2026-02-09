from pathlib import Path
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

from load_data import load_jigsaw_sample, LABELS  

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

    upper_counts = text.apply(lambda s: sum(1 for c in s if c.isupper()))
    df["upper_ratio"] = upper_counts / df["char_len"].replace(0, np.nan)
    df["upper_ratio"] = df["upper_ratio"].fillna(0.0)

    df["punct_count"] = text.str.count(r"[!?\.]")
    df["digit_count"] = text.str.count(r"\d")
    return df

# ----------------------------
# Load + features
# ----------------------------
sns.set_theme(style="whitegrid")
df = load_jigsaw_sample()
df = make_text_features(df)

FEATURES = ["char_len", "word_count", "upper_ratio", "punct_count", "digit_count"]

print("Shape:", df.shape)
print("Bivariate analysis on:", FEATURES)

# ----------------------------
# 1) toxic (fréquent) : comparaison 0 vs 1
# ----------------------------
target = "toxic"
if target in df.columns:
    for col in FEATURES:
        plt.figure(figsize=(7, 4))
        sns.violinplot(data=df, x=target, y=col, inner="quartile", cut=0)
        plt.title(f"{col} vs {target}")
        savefig(f"05_bivariate_violin_{col}_vs_{target}.png")

        plt.figure(figsize=(7, 3))
        sns.boxplot(data=df, x=target, y=col)
        plt.title(f"{col} vs {target} (boxplot)")
        savefig(f"06_bivariate_box_{col}_vs_{target}.png")

    print("\nMedians by toxic:")
    print(df.groupby(target)[FEATURES].median())

# ----------------------------
# 2) Label rare (ex: threat) : comparer aussi
# ----------------------------
rare_target = "threat"
if rare_target in df.columns:
    n_pos = int(df[rare_target].sum())
    print(f"\n{rare_target} positive samples in sample: {n_pos}")

    # Si trop rare, on garde une figure simple (sinon graphs pas stables)
    if n_pos >= 10:
        for col in FEATURES:
            plt.figure(figsize=(7, 4))
            sns.violinplot(data=df, x=rare_target, y=col, inner="quartile", cut=0)
            plt.title(f"{col} vs {rare_target}")
            savefig(f"07_bivariate_violin_{col}_vs_{rare_target}.png")
        print("\nMedians by threat:")
        print(df.groupby(rare_target)[FEATURES].median())
    else:
        print(f" {rare_target} trop rare dans le sample pour une analyse stable (n={n_pos}).")
        print(" Option: augmenter la taille du sample plus tard (ex: 20000) pour mieux analyser threat.")

print("\n 03_bivariate completed. Figures saved in reports/figures/")
