import sys
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from datasets import load_dataset
import requests
from bs4 import BeautifulSoup

print("=" * 50)
print("SANITY CHECK — TOXISCAN PROJECT")
print("=" * 50)

# Python version
print(f"Python version : {sys.version}")

# Test pandas / numpy
df = pd.DataFrame({
    "col1": [1, 2, 3],
    "col2": ["a", "b", "c"]
})
print("\nDataFrame test:")
print(df)

# Test Hugging Face datasets (light)
print("\nTesting Hugging Face datasets...")
dataset = load_dataset(
    "thesofakillers/jigsaw-toxic-comment-classification-challenge",
    split="train[:100]"
)
print(f"Loaded {len(dataset)} rows from Jigsaw dataset")

# Test plotting
plt.figure()
plt.hist([1, 2, 2, 3, 3, 3])
plt.title("Sanity Check Plot")
plt.savefig("sanity_check_plot.png")
plt.close()

print("\nPlot generated: sanity_check_plot.png")

print("\n Sanity check completed successfully!")
