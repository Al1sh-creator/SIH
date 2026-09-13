"""
FarmSense — Preprocessing Script
Dataset : irrigation_prediction.csv
Purpose : Clean and normalize the irrigation dataset used later to train
          the Irrigation Recommendation model (Random Forest Classifier).

This script ONLY performs cleaning. It does not train any model.

Input  : ai-engine/data/raw/irrigation_prediction.csv
Output : ai-engine/data/cleaned/irrigation_prediction_cleaned.csv
"""

import os
import pandas as pd

# ── Paths ──────────────────────────────────────────────────────────
RAW_PATH = os.path.join("data", "raw", "irrigation_prediction.csv")
CLEANED_DIR = os.path.join("data", "cleaned")
CLEANED_PATH = os.path.join(CLEANED_DIR, "irrigation_prediction_cleaned.csv")

NUMERIC_COLUMNS = [
    "Soil_pH", "Soil_Moisture", "Organic_Carbon", "Electrical_Conductivity",
    "Temperature_C", "Humidity", "Rainfall_mm", "Sunlight_Hours",
    "Wind_Speed_kmh", "Field_Area_hectare", "Previous_Irrigation_mm",
]
CATEGORICAL_COLUMNS = [
    "Soil_Type", "Crop_Type", "Crop_Growth_Stage", "Season",
    "Irrigation_Type", "Water_Source", "Mulching_Used", "Region",
    "Irrigation_Need",
]


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
    Analysis showed 0 missing values and 0 duplicates in this dataset,
    but this guard protects against future data refreshes.
    """
    before = len(df)
    df = df.dropna(subset=NUMERIC_COLUMNS + CATEGORICAL_COLUMNS)
    df = df.drop_duplicates()
    after = len(df)
    print(f"[CLEAN] Dropped {before - after} rows (missing/duplicate). Remaining: {after}")
    return df


def normalize_categorical_columns(df: pd.DataFrame) -> pd.DataFrame:
    """
    Normalize categorical text columns:
    - Strip whitespace
    - Title-case for readability & consistent one-hot/label encoding later
    Analysis found these columns already well-formed (Clay/Loamy/Sandy/Silt,
    Yes/No, High/Low/Medium, etc.), so this step is defensive/idempotent.
    """
    for col in CATEGORICAL_COLUMNS:
        df[col] = df[col].astype(str).str.strip()
    for col in ["Soil_Type", "Crop_Type", "Crop_Growth_Stage", "Water_Source",
                "Mulching_Used", "Region", "Irrigation_Need"]:
        df[col] = df[col].str.title()
    return df


def cap_outliers_iqr(df: pd.DataFrame, columns: list) -> pd.DataFrame:
    """
    Cap outliers using the 1.5*IQR rule. Analysis found ZERO outliers across
    all numeric columns (clean synthetic dataset within realistic bounds),
    so this step is a defensive no-op today but protects future data pulls.
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
    Domain sanity checks:
    - Soil_pH must be within 0-14
    - Humidity must be within 0-100 (%)
    - Field_Area_hectare must be > 0
    """
    before = len(df)
    df = df[(df["Soil_pH"] >= 0) & (df["Soil_pH"] <= 14)]
    df = df[(df["Humidity"] >= 0) & (df["Humidity"] <= 100)]
    df = df[df["Field_Area_hectare"] > 0]
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
    df = normalize_categorical_columns(df)
    df = cap_outliers_iqr(df, NUMERIC_COLUMNS)
    df = validate_ranges(df)
    save_cleaned(df, CLEANED_PATH)


if __name__ == "__main__":
    main()
