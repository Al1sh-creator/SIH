"""
FarmSense — Preprocessing Script
Dataset : crop_yield.csv
Purpose : Clean and normalize the crop-yield dataset used later to train
          the Yield Prediction model (XGBoost Regressor).

This script ONLY performs cleaning. It does not train any model.

Input  : ai-engine/data/raw/crop_yield.csv
Output : ai-engine/data/cleaned/crop_yield_cleaned.csv
"""

import os
import pandas as pd

# ── Paths ──────────────────────────────────────────────────────────
RAW_PATH = os.path.join("data", "raw", "crop_yield.csv")
CLEANED_DIR = os.path.join("data", "cleaned")
CLEANED_PATH = os.path.join(CLEANED_DIR, "crop_yield_cleaned.csv")

NUMERIC_COLUMNS = ["Area", "Production", "Annual_Rainfall", "Fertilizer", "Pesticide", "Yield"]
CATEGORICAL_COLUMNS = ["Crop", "Season", "State"]

# Canonical state-name mapping.
# Analysis showed spelling differs across FarmSense's datasets
# (e.g. Price_Agriculture_commodities_Week.csv uses "Chattisgarh" / "Uttrakhand").
# We normalize to India's official state names so a future crop-mapping /
# join layer across datasets does not silently lose rows.
STATE_NAME_MAP = {
    "Chattisgarh": "Chhattisgarh",
    "Uttrakhand": "Uttarakhand",
    "Pondicherry": "Puducherry",
    "NCT of Delhi": "Delhi",
}


def load_data(path: str) -> pd.DataFrame:
    df = pd.read_csv(path)
    print(f"[LOAD] {path} -> shape={df.shape}")
    return df


def report_missing_values(df: pd.DataFrame) -> None:
    missing = df.isnull().sum()
    print("[MISSING VALUES]")
    print(missing[missing > 0] if missing.sum() > 0 else "  None found.")


def drop_missing_and_duplicates(df: pd.DataFrame) -> pd.DataFrame:
    """
    Analysis showed 0 missing values and 0 duplicate rows currently,
    but this guard protects against future data refreshes.
    """
    before = len(df)
    df = df.dropna(subset=NUMERIC_COLUMNS + CATEGORICAL_COLUMNS)
    df = df.drop_duplicates()
    after = len(df)
    print(f"[CLEAN] Dropped {before - after} rows (missing/duplicate). Remaining: {after}")
    return df


def normalize_text_columns(df: pd.DataFrame) -> pd.DataFrame:
    """
    Analysis found inconsistent whitespace in 'Season' and 'Crop'
    (e.g. 'Kharif     ', 'Coconut ', 'Other  Rabi pulses').
    We strip leading/trailing whitespace and collapse internal
    multiple spaces to a single space for consistent grouping/joins.
    """
    for col in CATEGORICAL_COLUMNS:
        df[col] = (
            df[col]
            .astype(str)
            .str.strip()
            .str.replace(r"\s+", " ", regex=True)
        )
    print(f"[NORMALIZE] Unique Crop: {df['Crop'].nunique()}, "
          f"Unique Season: {df['Season'].nunique()}, "
          f"Unique State: {df['State'].nunique()}")
    return df


def apply_state_name_mapping(df: pd.DataFrame) -> pd.DataFrame:
    """Standardize state spelling for cross-dataset consistency."""
    df["State"] = df["State"].replace(STATE_NAME_MAP)
    return df


def cap_outliers_iqr(df: pd.DataFrame, columns: list) -> pd.DataFrame:
    """
    Cap outliers using 1.5*IQR rule. 'Yield' showed ~15% IQR-flagged values,
    which is expected for agricultural yield data (high-value/low-area crops
    naturally produce large yield-per-area ratios). We cap rather than drop
    to avoid losing real signal for the yield-prediction model.
    """
    for col in columns:
        q1 = df[col].quantile(0.25)
        q3 = df[col].quantile(0.75)
        iqr = q3 - q1
        lower_bound = max(0, q1 - 1.5 * iqr)  # yield/area/production can't be negative
        upper_bound = q3 + 1.5 * iqr
        n_outliers = ((df[col] < lower_bound) | (df[col] > upper_bound)).sum()
        if n_outliers > 0:
            print(f"[OUTLIERS] {col}: {n_outliers} values capped to [{lower_bound:.2f}, {upper_bound:.2f}]")
        df[col] = df[col].clip(lower=lower_bound, upper=upper_bound)
    return df


def validate_ranges(df: pd.DataFrame) -> pd.DataFrame:
    """
    Domain sanity checks:
    - Area must be > 0 (a farm plot with zero area is not valid)
    - Crop_Year must be within a sane historical range
    Note: Production == 0 is a valid real-world case (crop failure), so it
    is NOT removed.
    """
    before = len(df)
    df = df[df["Area"] > 0]
    df = df[(df["Crop_Year"] >= 1990) & (df["Crop_Year"] <= 2030)]
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
    df = normalize_text_columns(df)
    df = apply_state_name_mapping(df)
    df = cap_outliers_iqr(df, ["Area", "Production", "Annual_Rainfall", "Fertilizer", "Pesticide", "Yield"])
    df = validate_ranges(df)
    save_cleaned(df, CLEANED_PATH)


if __name__ == "__main__":
    main()
