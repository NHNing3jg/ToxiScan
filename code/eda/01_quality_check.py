from pathlib import Path
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

df = load_jigsaw_sample()

print("Shape:", df.shape)
print("Columns:", list(df.columns))

# --- Missingness ---
missing_text = df["comment_text"].isna().sum()
print("Missing comment_text:", missing_text)

missing_labels = df[LABELS].isna().sum().sort_values(ascending=False)
print("\nMissing per label:\n", missing_labels)

# --- Duplicates ---
dup_count = df.duplicated(subset=["comment_text"]).sum()
print("\nDuplicate comment_text rows:", dup_count)

# --- Data leakage note ---
if "id" in df.columns:
    print("\nNOTE: Column 'id' exists -> do NOT use it as a feature (leakage / no predictive power).")

# --- Imbalance check (label counts) ---
label_counts = df[LABELS].sum().sort_values(ascending=False)
plt.figure(figsize=(8, 4))
sns.barplot(x=label_counts.index, y=label_counts.values)
plt.title("Label frequency (sample)")
plt.xticks(rotation=30, ha="right")
plt.ylabel("Count")
savefig("01_label_frequency.png")

# Toxic vs non-toxic (basic)
if "toxic" in df.columns:
    toxic_rate = df["toxic"].mean()
    print(f"\nToxic rate (mean of toxic): {toxic_rate:.4f}  (~{toxic_rate*100:.2f}%)")

# --- nb_labels (multi-label intensity) ---
df["nb_labels"] = df[LABELS].sum(axis=1)

plt.figure(figsize=(7, 4))
sns.histplot(df["nb_labels"], bins=range(int(df["nb_labels"].max()) + 2), kde=False)
plt.title("Distribution of nb_labels per comment")
plt.xlabel("nb_labels")
savefig("02_nb_labels_hist.png")

print("\nnb_labels value counts:\n", df["nb_labels"].value_counts().sort_index())

print("\n 01_quality_check completed. Figures saved in reports/figures/")
