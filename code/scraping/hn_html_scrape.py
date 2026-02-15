from __future__ import annotations

from pathlib import Path
import time
import re
from typing import List, Dict, Optional

import requests
import pandas as pd
from bs4 import BeautifulSoup


# =========================
# Config
# =========================
OUT_DIR = Path("data/raw_scraped")
OUT_DIR.mkdir(parents=True, exist_ok=True)

BASE = "https://news.ycombinator.com"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) ToxiScanScraper/1.0",
    "Accept-Language": "en-US,en;q=0.9",
}
SLEEP = 1.2  # plus lent = moins de blocage
MAX_THREADS = 5
MAX_COMMENTS_TOTAL = 500

DEBUG_SAVE_HTML = True  # sauvegarde des pages HTML si extraction échoue


# =========================
# Helpers
# =========================
def clean_text(s: str) -> str:
    """Nettoyage simple: espaces multiples -> 1 espace, strip."""
    if not s:
        return ""
    s = re.sub(r"\s+", " ", s).strip()
    return s


def fetch_html(url: str) -> str:
    """Télécharge une page HTML."""
    r = requests.get(url, headers=HEADERS, timeout=30)
    print(f"FETCH: {url} -> {r.status_code} final: {r.url}")
    r.raise_for_status()
    return r.text


def get_soup(url: str) -> BeautifulSoup:
    """Parse HTML -> BeautifulSoup."""
    html = fetch_html(url)
    return BeautifulSoup(html, "html.parser")


# =========================
# Step 1: récupérer des IDs de threads qui ont 'comments' / 'discuss'
# =========================
def extract_thread_ids_from_frontpage() -> List[int]:
    """
    Sur la page d'accueil HN, on prend uniquement les liens "XX comments" ou "discuss"
    (dans la subline), pour pointer vers des pages item?id=... qui contiennent des commentaires.
    """
    soup = get_soup(f"{BASE}/")
    ids: List[int] = []

    for a in soup.select("span.subline a"):
        txt = a.get_text(strip=True).lower()
        href = a.get("href", "")

        if (txt.endswith("comments") or txt == "discuss") and href.startswith("item?id="):
            m = re.search(r"item\?id=(\d+)", href)
            if m:
                ids.append(int(m.group(1)))

    # dédoublonner en gardant l'ordre
    seen = set()
    uniq: List[int] = []
    for i in ids:
        if i not in seen:
            uniq.append(i)
            seen.add(i)

    return uniq


# =========================
# Step 2: scraper commentaires depuis un thread item?id=...
# =========================
def extract_comments_from_item_page(soup: BeautifulSoup) -> List[str]:
    """
    Extraction robuste des commentaires.
    Hacker News met les commentaires dans:
      tr.athing.comtr  puis span.commtext
    On tente plusieurs sélecteurs (fallbacks).
    """
    selectors = [
        "tr.athing.comtr span.commtext",  # le plus fiable
        "span.commtext",                  # fallback
        ".commtext",                      # fallback large
    ]

    nodes = []
    for sel in selectors:
        nodes = soup.select(sel)
        if nodes:
            break

    comments: List[str] = []
    for node in nodes:
        # get_text enlève le HTML interne et garde le texte
        txt = node.get_text(" ", strip=True)
        txt = clean_text(txt)
        if txt:
            comments.append(txt)

    return comments


def scrape_comments_from_thread(thread_id: int) -> List[Dict]:
    url = f"{BASE}/item?id={thread_id}"
    html = fetch_html(url)
    soup = BeautifulSoup(html, "html.parser")

    # titre page (debug/trace)
    title_tag = soup.select_one("title")
    page_title = title_tag.get_text(strip=True) if title_tag else ""

    comments = extract_comments_from_item_page(soup)

    # DEBUG: si 0 commentaires, sauvegarder HTML pour inspection
    if DEBUG_SAVE_HTML and len(comments) == 0:
        dbg_path = OUT_DIR / f"debug_item_{thread_id}.html"
        dbg_path.write_text(html, encoding="utf-8")
        print(f" DEBUG: 0 comments extracted. Saved HTML -> {dbg_path}")
        # petit indicateur utile
        print(f"DEBUG: contains 'commtext'? {'commtext' in html}")

    rows: List[Dict] = []
    for c in comments:
        rows.append(
            {
                "thread_id": thread_id,
                "thread_url": url,
                "thread_title": page_title,
                "comment_text": c,
            }
        )
    return rows


# =========================
# Main
# =========================
def main() -> None:
    thread_ids = extract_thread_ids_from_frontpage()
    if not thread_ids:
        print(" Aucun thread_id trouvé sur la frontpage. Réseau/HTML a changé ?")
        return

    thread_ids = thread_ids[:MAX_THREADS]
    all_rows: List[Dict] = []

    for tid in thread_ids:
        try:
            rows = scrape_comments_from_thread(tid)
        except Exception as e:
            print(f" Thread {tid} failed: {e}")
            rows = []

        all_rows.extend(rows)
        print(f"[thread {tid}] comments scraped: {len(rows)} (total={len(all_rows)})")

        if len(all_rows) >= MAX_COMMENTS_TOTAL:
            break

        time.sleep(SLEEP)

    df = pd.DataFrame(all_rows).head(MAX_COMMENTS_TOTAL)
    out_path = OUT_DIR / "hn_comments_html.csv"
    df.to_csv(out_path, index=False)
    print(f" Saved {len(df)} comments -> {out_path}")

    if len(df) == 0:
        print(" Résultat vide. Ouvre un fichier debug_item_XXXX.html dans data/raw_scraped/ pour voir le HTML reçu.")


if __name__ == "__main__":
    main()
