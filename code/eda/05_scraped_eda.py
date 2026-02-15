from pathlib import Path
import pandas as pd
import matplotlib.pyplot as plt

RAW_DIR = Path("data/raw_scraped")
REPORT_DIR = Path("reports")
FIG_DIR = REPORT_DIR / "figures"
FIG_DIR.mkdir(parents=True, exist_ok=True)

API_CSV = RAW_DIR / "hn_comments_raw.csv"
HTML_CSV = RAW_DIR / "hn_comments_html.csv"


def basic_text_stats(df: pd.DataFrame, text_col: str) -> pd.DataFrame:
    s = df[text_col].fillna("").astype(str)
    stats = pd.DataFrame({
        "n_rows": [len(df)],
        "n_empty": [(s.str.strip() == "").sum()],
        "avg_char_len": [s.str.len().mean()],
        "p50_char_len": [s.str.len().median()],
        "p90_char_len": [s.str.len().quantile(0.90)],
        "max_char_len": [s.str.len().max()],
    })
    return stats


def plot_char_len(df: pd.DataFrame, text_col: str, out_png: Path, title: str):
    s = df[text_col].fillna("").astype(str)
    lens = s.str.len()
    plt.figure(figsize=(7, 4))
    plt.hist(lens, bins=50)
    plt.title(title)
    plt.xlabel("Character length")
    plt.ylabel("Count")
    plt.tight_layout()
    plt.savefig(out_png, dpi=200)
    plt.close()


def main():
    print("=== Step 05: Scraped data quick EDA ===")

    # ---- Load API scraped ----
    if not API_CSV.exists():
        raise FileNotFoundError(f"Missing file: {API_CSV}")
    df_api = pd.read_csv(API_CSV)
    if "text" not in df_api.columns:
        raise ValueError("hn_comments_raw.csv must contain a 'text' column.")
    df_api["text_clean"] = df_api["text"].fillna("").astype(str)

    # ---- Load HTML scraped ----
    if not HTML_CSV.exists():
        raise FileNotFoundError(f"Missing file: {HTML_CSV}")
    df_html = pd.read_csv(HTML_CSV)
    if "comment_text" not in df_html.columns:
        raise ValueError("hn_comments_html.csv must contain a 'comment_text' column.")
    df_html["text_clean"] = df_html["comment_text"].fillna("").astype(str)

    # ---- Basic checks ----
    print("\n[API] shape:", df_api.shape, "cols:", list(df_api.columns))
    print("[HTML] shape:", df_html.shape, "cols:", list(df_html.columns))

    # Duplicates
    api_dups = df_api.duplicated(subset=["text_clean"]).sum()
    html_dups = df_html.duplicated(subset=["text_clean"]).sum()
    print("\nDuplicates (by text):")
    print(" - API:", api_dups)
    print(" - HTML:", html_dups)

    # Text stats
    api_stats = basic_text_stats(df_api, "text_clean")
    html_stats = basic_text_stats(df_html, "text_clean")
    summary = pd.concat(
        [api_stats.assign(source="HN_API"), html_stats.assign(source="HN_HTML")],
        ignore_index=True
    )

    # Save summary table
    out_csv = REPORT_DIR / "scraped_eda_summary.csv"
    summary.to_csv(out_csv, index=False)

    # Plots
    plot_char_len(df_api, "text_clean", FIG_DIR / "05_api_char_len_hist.png", "HN API - comment length (chars)")
    plot_char_len(df_html, "text_clean", FIG_DIR / "05_html_char_len_hist.png", "HN HTML - comment length (chars)")

    # Small cleaned sample for later demos/tests
    out_sample = Path("data/sample/hn_scraped_sample.csv")
    out_sample.parent.mkdir(parents=True, exist_ok=True)
    sample = pd.concat([
        df_api[["text_clean"]].rename(columns={"text_clean": "text"}).assign(source="HN_API"),
        df_html[["text_clean"]].rename(columns={"text_clean": "text"}).assign(source="HN_HTML"),
    ], ignore_index=True)
    sample = sample[sample["text"].str.strip() != ""].drop_duplicates(subset=["text"])
    sample.head(2000).to_csv(out_sample, index=False)

    print("\n Step 05 OK")
    print("Saved:", out_csv)
    print("Saved figures:", FIG_DIR / "05_api_char_len_hist.png", "and", FIG_DIR / "05_html_char_len_hist.png")
    print("Saved sample:", out_sample)


if __name__ == "__main__":
    main()
