from pathlib import Path
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

from load_data import load_jigsaw_sample  

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

sns.set_theme(style="whitegrid")
df = load_jigsaw_sample()
df = make_text_features(df)

FEATURES = ["char_len", "word_count", "upper_ratio", "punct_count", "digit_count"]

print("Shape:", df.shape)
print("Using features:", FEATURES)

# ----------------------------
# A) Correlation heatmap
# ----------------------------
corr = df[FEATURES].corr(numeric_only=True)

plt.figure(figsize=(7, 5))
sns.heatmap(corr, annot=True, fmt=".2f", cmap="coolwarm", vmin=-1, vmax=1)
plt.title("Correlation heatmap (text features)")
savefig("08_multivariate_corr_heatmap.png")

# ----------------------------
# B) Pairplot (multivariate view) - sample to keep it light
# ----------------------------
# Pairplot peut être lourd -> on échantillonne
PAIR_N = min(2000, len(df))
df_pair = df.sample(n=PAIR_N, random_state=42).copy()

# hue = toxic si disponible (sinon pas de hue)
hue_col = "toxic" if "toxic" in df_pair.columns else None

pair = sns.pairplot(
    df_pair,
    vars=["word_count", "char_len", "upper_ratio", "punct_count"],
    hue=hue_col,
    corner=True,
    plot_kws={"alpha": 0.25, "s": 12}
)
pair.fig.suptitle("Pairplot (sample) - multivariate view", y=1.02)
pair.savefig(FIG_DIR / "09_multivariate_pairplot.png", dpi=200)
plt.close("all")

print("\n 04_multivariate completed. Figures saved in reports/figures/")
print("Note à écrire dans le rapport: corrélation ≠ causalité.")
