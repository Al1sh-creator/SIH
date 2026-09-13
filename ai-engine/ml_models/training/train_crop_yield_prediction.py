"""
FarmSense — Model Training Script
Model   : Crop Yield Prediction (RandomForestRegressor)
Dataset : data/cleaned/crop_yield_cleaned.csv

This is a REGRESSION problem — the target 'Yield' is a continuous value.
This script ONLY trains and evaluates the model. No Django/API code here.

Input   : data/cleaned/crop_yield_cleaned.csv
Outputs : ml_models/artifacts/crop_yield_model.pkl               (full sklearn Pipeline:
                                                                    preprocessing + RandomForest)
          ml_models/artifacts/crop_yield_feature_preprocessor.pkl (ColumnTransformer only,
                                                                    saved separately for inspection/reuse)
"""

import os

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder

# ── Config ───────────────────────────────────────────────────────────
DATA_PATH = os.path.join("data", "cleaned", "crop_yield_cleaned.csv")
ARTIFACTS_DIR = os.path.join("ml_models", "artifacts")
MODEL_PATH = os.path.join(ARTIFACTS_DIR, "crop_yield_model.pkl")
PREPROCESSOR_PATH = os.path.join(ARTIFACTS_DIR, "crop_yield_feature_preprocessor.pkl")

CATEGORICAL_FEATURES = ["Crop", "Season", "State"]
NUMERIC_FEATURES = ["Crop_Year", "Area", "Annual_Rainfall", "Fertilizer", "Pesticide"]
TARGET_COLUMN = "Yield"

RANDOM_STATE = 42
TEST_SIZE = 0.2
N_ESTIMATORS = 200


def load_data(path: str) -> pd.DataFrame:
    """Load the cleaned crop yield dataset."""
    df = pd.read_csv(path)
    print(f"[LOAD] {path} -> shape={df.shape}")
    return df


def split_features_target(df: pd.DataFrame):
    """Separate the feature matrix X (categorical + numeric) and the continuous target y."""
    X = df[CATEGORICAL_FEATURES + NUMERIC_FEATURES]
    y = df[TARGET_COLUMN]
    return X, y


def build_feature_preprocessor() -> ColumnTransformer:
    """
    Build a ColumnTransformer that one-hot encodes all categorical input
    features (Crop, Season, State) and passes numeric features through
    unchanged.

    OneHotEncoder is used because these categorical columns are nominal
    (no inherent order), which is the correct choice for a tree-based
    model to avoid implying a false ranking between categories.

    handle_unknown='ignore' ensures inference-time categories not seen
    during training (e.g. a new State/Crop combination) won't crash
    the pipeline.
    """
    preprocessor = ColumnTransformer(
        transformers=[
            (
                "categorical",
                OneHotEncoder(handle_unknown="ignore"),
                CATEGORICAL_FEATURES,
            ),
            ("numeric", "passthrough", NUMERIC_FEATURES),
        ]
    )
    return preprocessor


def split_train_test(X, y):
    """
    Split into train/test sets: 80/20, random_state=42.
    No stratification here since this is a regression problem
    (the target 'Yield' is continuous, not categorical).
    """
    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=TEST_SIZE,
        random_state=RANDOM_STATE,
    )
    print(f"[SPLIT] Train: {X_train.shape}, Test: {X_test.shape}")
    return X_train, X_test, y_train, y_test


def build_and_train_pipeline(preprocessor: ColumnTransformer, X_train, y_train) -> Pipeline:
    """
    Build a single sklearn Pipeline that chains the feature preprocessor
    and the RandomForestRegressor, then fit it on the training data.
    Bundling preprocessing + model into one Pipeline guarantees inference
    always applies the exact same transformations used during training.
    """
    pipeline = Pipeline(
        steps=[
            ("preprocessor", preprocessor),
            (
                "regressor",
                RandomForestRegressor(
                    n_estimators=N_ESTIMATORS,
                    random_state=RANDOM_STATE,
                    n_jobs=-1,
                ),
            ),
        ]
    )
    pipeline.fit(X_train, y_train)
    print("[TRAIN] RandomForestRegressor pipeline trained.")
    return pipeline


def evaluate_model(pipeline: Pipeline, X_test, y_test) -> None:
    """
    Evaluate the trained pipeline on the held-out test set and print:
    MAE, MSE, RMSE, and R² Score.
    """
    y_pred = pipeline.predict(X_test)

    mae = mean_absolute_error(y_test, y_pred)
    mse = mean_squared_error(y_test, y_pred)
    rmse = np.sqrt(mse)
    r2 = r2_score(y_test, y_pred)

    print("\n" + "=" * 60)
    print("MODEL EVALUATION — Crop Yield Prediction")
    print("=" * 60)
    print(f"MAE       : {mae:.4f}")
    print(f"MSE       : {mse:.4f}")
    print(f"RMSE      : {rmse:.4f}")
    print(f"R\u00b2 Score : {r2:.4f}")


def save_artifacts(pipeline: Pipeline) -> None:
    """
    Save artifacts required for inference using joblib:
    - The full pipeline (preprocessor + model) as the primary model file.
    - The fitted ColumnTransformer alone (extracted from the pipeline) for
      cases where only the preprocessing step needs to be inspected/reused.
    No target encoder is needed here since 'Yield' is already numeric.
    """
    os.makedirs(ARTIFACTS_DIR, exist_ok=True)

    joblib.dump(pipeline, MODEL_PATH)
    joblib.dump(pipeline.named_steps["preprocessor"], PREPROCESSOR_PATH)

    print(f"\n[SAVE] Full pipeline saved to        {MODEL_PATH}")
    print(f"[SAVE] Feature preprocessor saved to {PREPROCESSOR_PATH}")


def main():
    df = load_data(DATA_PATH)
    X, y = split_features_target(df)

    preprocessor = build_feature_preprocessor()
    X_train, X_test, y_train, y_test = split_train_test(X, y)

    pipeline = build_and_train_pipeline(preprocessor, X_train, y_train)
    evaluate_model(pipeline, X_test, y_test)
    save_artifacts(pipeline)


if __name__ == "__main__":
    main()