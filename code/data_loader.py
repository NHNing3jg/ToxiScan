from pathlib import Path
import pandas as pd
from datasets import load_dataset

RAW_DIR = Path("data/raw_hf")
SAMPLE_DIR = Path("data/sample")
RAW_DIR.mkdir(parents=True, exist_ok=True)
SAMPLE_DIR.mkdir(parents=True, exist_ok=True)

DATASET = "thesofakillers/jigsaw-toxic-comment-classification-challenge"

print(f"Loading {DATASET} ...")
ds = load_dataset(DATASET, split="train")
df = pd.DataFrame(ds)

print("Shape:", df.shape)
print("Columns:", list(df.columns))

# Full (local only)
df.to_csv(RAW_DIR / "jigsaw_full.csv", index=False)

# Sample (GitHub)
df.sample(n=5000, random_state=42).to_csv(SAMPLE_DIR / "jigsaw_sample.csv", index=False)

print(" Step 2 OK: full + sample saved.")
