"""
FarmSense — Preprocessing Script
Dataset : Price_Agriculture_commodities_Week.csv
Purpose : Clean and normalize the market-price dataset used later to power
          the Price Lookup / Profit Calculator module.

This script ONLY performs cleaning. It does not train any model.

Input  : ai-engine/data/raw/Price_Agriculture_commodities_Week.csv
Output : ai-engine/data/cleaned/price_agriculture_cleaned.csv
"""

import os
import pandas as pd

# ── Paths ──────────────────────────────────────────────────────────
RAW_PATH = os.path.join("data", "raw", "Price_Agriculture_commodities_Week.csv")
CLEANED_DIR = os.path.join("data", "cleaned")
CLEANED_PATH = os.path.join(CLEANED_DIR, "price_agriculture_cleaned.csv")

PRICE_COLUMNS = ["Min Price", "Max Price", "Modal Price"]
CATEGORICAL_COLUMNS = ["State", "District", "Market", "Commodity", "Variety", "Grade"]

# Canonical state-name mapping.
# Analysis found this file uses different spellings than crop_yield.csv
# (e.g. "Chattisgarh" here vs "Chhattisgarh" there; "Uttrakhand" vs
# "Uttarakhand"; "NCT of Delhi" vs "Delhi"; "Pondicherry" vs "Puducherry").
# Normalizing to India's official state names keeps FarmSense's datasets
# joinable for future cross-referencing (e.g. crop -> yield -> market price).
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
    but this guard protects against future scraped/downloaded data
    (this dataset comes from a live government price feed, which is
    more likely to have gaps in future pulls).
    """
    before = len(df)
    df = df.dropna(subset=PRICE_COLUMNS + CATEGORICAL_COLUMNS + ["Arrival_Date"])
    df = df.drop_duplicates()
    after = len(df)
    print(f"[CLEAN] Dropped {before - after} rows (missing/duplicate). Remaining: {after}")
    return df


def normalize_categorical_columns(df: pd.DataFrame) -> pd.DataFrame:
    """
    Strip whitespace from all text columns. Analysis found no case or
    whitespace inconsistencies within this file's own values, so this
    is a defensive step for future data pulls.
    """
    for col in CATEGORICAL_COLUMNS:
        df[col] = df[col].astype(str).str.strip()
    return df


def apply_state_name_mapping(df: pd.DataFrame) -> pd.DataFrame:
    """Standardize state spelling for cross-dataset consistency."""
    df["State"] = df["State"].replace(STATE_NAME_MAP)
    return df


def fix_price_logic_errors(df: pd.DataFrame) -> pd.DataFrame:
    """
    Remove rows with true data-entry errors (not natural variance):
    - Min Price or Max Price <= 0 (a market price cannot be zero or negative)
    - Min Price > Max Price (logically impossible)
    - Modal Price outside the [Min Price, Max Price] range (logically impossible)

    Analysis found: 20 rows with Min Price <= 0, 28 rows with Max Price <= 0,
    14 rows where Min > Max, and 28 rows where Modal falls outside [Min, Max].
    These are dropped rather than capped because they represent broken
    records, not extreme-but-real market conditions.
    """
    before = len(df)
    df = df[(df["Min Price"] > 0) & (df["Max Price"] > 0)]
    df = df[df["Min Price"] <= df["Max Price"]]
    df = df[(df["Modal Price"] >= df["Min Price"]) & (df["Modal Price"] <= df["Max Price"])]
    after = len(df)
    print(f"[LOGIC FIX] Removed {before - after} rows with invalid price logic. Remaining: {after}")
    return df


def cap_outliers_iqr(df: pd.DataFrame, columns: list) -> pd.DataFrame:
    """
    Cap outliers using the 1.5*IQR rule. Analysis found ~6% of 'Modal Price'
    values flagged as outliers — these correspond to genuinely high-value
    commodities/varieties (e.g. premium spices), not data errors, so they
    are capped rather than dropped to preserve real market signal.
    """
    for col in columns:
        q1 = df[col].quantile(0.25)
        q3 = df[col].quantile(0.75)
        iqr = q3 - q1
        lower_bound = max(0, q1 - 1.5 * iqr)  # price can't be negative
        upper_bound = q3 + 1.5 * iqr
        n_outliers = ((df[col] < lower_bound) | (df[col] > upper_bound)).sum()
        if n_outliers > 0:
            print(f"[OUTLIERS] {col}: {n_outliers} values capped to [{lower_bound:.2f}, {upper_bound:.2f}]")
        df[col] = df[col].clip(lower=lower_bound, upper=upper_bound)
    return df


def normalize_date_column(df: pd.DataFrame) -> pd.DataFrame:
    """
    Parse 'Arrival_Date' (format DD-MM-YYYY, confirmed consistent across
    all rows) into a proper datetime column so downstream code (price
    lookups, trend calculations) can rely on it being a real date type
    rather than a string.
    """
    df["Arrival_Date"] = pd.to_datetime(df["Arrival_Date"], format="%d-%m-%Y", errors="coerce")
    before = len(df)
    df = df.dropna(subset=["Arrival_Date"])
    after = len(df)
    if before != after:
        print(f"[DATE] Dropped {before - after} rows with unparseable Arrival_Date")
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
    df = apply_state_name_mapping(df)
    df = fix_price_logic_errors(df)
    df = cap_outliers_iqr(df, PRICE_COLUMNS)
    df = normalize_date_column(df)
    save_cleaned(df, CLEANED_PATH)


if __name__ == "__main__":
    main()
