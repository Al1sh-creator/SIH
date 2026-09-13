"""
FarmSense — Preprocessing Script
Dataset : Crop_recommendation.csv
Purpose : Clean and normalize the crop-recommendation dataset used later
          to train the Crop Recommendation model (Random Forest).

This script ONLY performs cleaning. It does not train any model.

Input  : ai-engine/data/raw/Crop_recommendation.csv
Output : ai-engine/data/cleaned/crop_recommendation_cleaned.csv
"""

import os
import pandas as pd

# ── Paths ──────────────────────────────────────────────────────────
RAW_PATH = os.path.join("data", "raw", "Crop_recommendation.csv")
CLEANED_DIR = os.path.join("data", "cleaned")
CLEANED_PATH = os.path.join(CLEANED_DIR, "crop_recommendation_cleaned.csv")

# Columns expected to be numeric (features)
NUMERIC_COLUMNS = ["N", "P", "K", "temperature", "humidity", "ph", "rainfall"]
LABEL_COLUMN = "label"


def load_data(path: str) -> pd.DataFrame:
    """Load the raw CSV into a DataFrame."""
    df = pd.read_csv(path)
    print(f"[LOAD] {path} -> shape={df.shape}")
    return df


def report_missing_values(df: pd.DataFrame) -> None:
    """Print a missing-value report for visibility before cleaning."""
    missing = df.isnull().sum()
    print("[MISSING VALUES]")
    print(missing[missing > 0] if missing.sum() > 0 else "  None found.")


def drop_missing_and_duplicates(df: pd.DataFrame) -> pd.DataFrame:
    """
    Remove rows with missing values in any required column, and remove
    exact duplicate rows. Analysis showed 0 missing values and 0 duplicates
    in the current file, but this guard protects against future data pulls.
    """
    before = len(df)
    df = df.dropna(subset=NUMERIC_COLUMNS + [LABEL_COLUMN])
    df = df.drop_duplicates()
    after = len(df)
    print(f"[CLEAN] Dropped {before - after} rows (missing/duplicate). Remaining: {after}")
    return df


def normalize_labels(df: pd.DataFrame) -> pd.DataFrame:
    """
    Normalize the crop 'label' column:
    - Strip leading/trailing whitespace
    - Lowercase for consistent matching with other datasets/model inference
    """
    df[LABEL_COLUMN] = df[LABEL_COLUMN].astype(str).str.strip().str.lower()
    print(f"[NORMALIZE] Unique labels after normalization: {df[LABEL_COLUMN].nunique()}")
    return df


def cap_outliers_iqr(df: pd.DataFrame, columns: list) -> pd.DataFrame:
    """
    Cap (winsorize) numeric outliers using the 1.5*IQR rule.
    We CAP rather than DROP because extreme soil/weather readings
    (e.g. very high rainfall) are naturally occurring, not sensor errors,
    and dropping them would bias the future ML model's coverage.
    """
    for col in columns:
        q1 = df[col].quantile(0.25)
        q3 = df[col].quantile(0.75)
        iqr = q3 - q1
        lower_bound = q1 - 1.5 * iqr
        upper_bound = q3 + 1.5 * iqr
        n_outliers = ((df[col] < lower_bound) | (df[col] > upper_bound)).sum()
        if n_outliers > 0:
            print(f"[OUTLIERS] {col}: {n_outliers} values capped to [{lower_bound:.2f}, {upper_bound:.2f}]")
        df[col] = df[col].clip(lower=lower_bound, upper=upper_bound)
    return df


def validate_ranges(df: pd.DataFrame) -> pd.DataFrame:
    """
    Sanity-check domain constraints that no statistical method would catch:
    - N, P, K cannot be negative
    - ph must be within the 0-14 scale
    - humidity must be within 0-100 (%)
    """
    before = len(df)
    df = df[(df["N"] >= 0) & (df["P"] >= 0) & (df["K"] >= 0)]
    df = df[(df["ph"] >= 0) & (df["ph"] <= 14)]
    df = df[(df["humidity"] >= 0) & (df["humidity"] <= 100)]
    after = len(df)
    if before != after:
        print(f"[VALIDATE] Removed {before - after} rows violating domain constraints")
    return df


def save_cleaned(df: pd.DataFrame, path: str) -> None:
    os.makedirs(os.path.dirname(path), exist_ok=True)
    df.to_csv(path, index=False)
    print(f"[SAVE] Cleaned dataset written to {path} -> shape={df.shape}")


def main():
    df = load_data(RAW_PATH)
    report_missing_values(df)
    df = drop_missing_and_duplicates(df)
    df = normalize_labels(df)
    df = cap_outliers_iqr(df, NUMERIC_COLUMNS)
    df = validate_ranges(df)
    save_cleaned(df, CLEANED_PATH)


if __name__ == "__main__":
    main()
