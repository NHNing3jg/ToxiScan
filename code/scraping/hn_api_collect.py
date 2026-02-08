from pathlib import Path
import time
import requests
import pandas as pd
from tqdm import tqdm

OUT_DIR = Path("data/raw_scraped")
OUT_DIR.mkdir(parents=True, exist_ok=True)

BASE = "https://hacker-news.firebaseio.com/v0"
MAX_COMMENTS = 1500
SLEEP = 0.2

def get_json(url: str):
    r = requests.get(url, timeout=30)
    r.raise_for_status()
    return r.json()

max_id = get_json(f"{BASE}/maxitem.json")
rows = []

for item_id in tqdm(range(max_id, max_id - 20000, -1)):  # scan window
    if len(rows) >= MAX_COMMENTS:
        break
    try:
        item = get_json(f"{BASE}/item/{item_id}.json")
        if item and item.get("type") == "comment" and item.get("text"):
            rows.append({
                "id": item.get("id"),
                "by": item.get("by"),
                "time": item.get("time"),
                "parent": item.get("parent"),
                "text": item.get("text")
            })
        time.sleep(SLEEP)
    except Exception:
        continue

df = pd.DataFrame(rows)
out = OUT_DIR / "hn_comments_raw.csv"
df.to_csv(out, index=False)
print(f" Step 3 OK: saved {len(df)} comments -> {out}")
