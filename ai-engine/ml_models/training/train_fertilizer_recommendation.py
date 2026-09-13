"""
FarmSense — Model Training Script
Model   : Fertilizer Recommendation (RandomForestClassifier)
Dataset : data/cleaned/fertilizer_recommendation_cleaned.csv

This script ONLY trains and evaluates the model. No Django/API code here.

Input   : data/cleaned/fertilizer_recommendation_cleaned.csv
Outputs : ml_models/artifacts/fertilizer_model.pkl          (full sklearn Pipeline:
                                                               preprocessing + RandomForest)
          ml_models/artifacts/fertilizer_feature_preprocessor.pkl (ColumnTransformer only,
                                                               saved separately for inspection/reuse)
          ml_models/artifacts/fertilizer_label_encoder.pkl   (target LabelEncoder)
"""

import os

import joblib
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
)
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import LabelEncoder, OneHotEncoder

# ── Config ───────────────────────────────────────────────────────────
DATA_PATH = os.path.join("data", "cleaned", "fertilizer_recommendation_cleaned.csv")
ARTIFACTS_DIR = os.path.join("ml_models", "artifacts")
MODEL_PATH = os.path.join(ARTIFACTS_DIR, "fertilizer_model.pkl")
PREPROCESSOR_PATH = os.path.join(ARTIFACTS_DIR, "fertilizer_feature_preprocessor.pkl")
LABEL_ENCODER_PATH = os.path.join(ARTIFACTS_DIR, "fertilizer_label_encoder.pkl")

CATEGORICAL_FEATURES = [
    "Soil_Type",
    "Crop_Type",
    "Crop_Growth_Stage",
    "Season",
    "Irrigation_Type",
    "Previous_Crop",
    "Region",
]
NUMERIC_FEATURES = [
    "Soil_pH",
    "Soil_Moisture",
    "Organic_Carbon",
    "Electrical_Conductivity",
    "Nitrogen_Level",
    "Phosphorus_Level",
    "Potassium_Level",
    "Temperature",
    "Humidity",
    "Rainfall",
    "Fertilizer_Used_Last_Season",
    "Yield_Last_Season",
]
TARGET_COLUMN = "Recommended_Fertilizer"

RANDOM_STATE = 42
TEST_SIZE = 0.2


def load_data(path: str) -> pd.DataFrame:
    """Load the cleaned fertilizer recommendation dataset."""
    df = pd.read_csv(path)
    print(f"[LOAD] {path} -> shape={df.shape}")
    return df


def split_features_target(df: pd.DataFrame):
    """Separate the feature matrix X (categorical + numeric) and raw target y."""
    X = df[CATEGORICAL_FEATURES + NUMERIC_FEATURES]
    y = df[TARGET_COLUMN]
    return X, y


def build_feature_preprocessor() -> ColumnTransformer:
    """
    Build a ColumnTransformer that one-hot encodes all categorical input
    features and passes numeric features through unchanged.

    OneHotEncoder is used (rather than OrdinalEncoder) because these
    categorical columns are nominal (no inherent order), which is the
    correct choice for RandomForest to avoid implying a false ranking
    between e.g. 'Clay', 'Loamy', 'Sandy' soil types.

    handle_unknown='ignore' ensures inference-time categories not seen
    during training won't crash the pipeline.
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


def encode_target(y):
    """
    Encode the target 'Recommended_Fertilizer' labels into integers
    using LabelEncoder. Returns encoded labels and the fitted encoder
    (needed later for inverse_transform when serving predictions).
    """
    label_encoder = LabelEncoder()
    y_encoded = label_encoder.fit_transform(y)
    print(f"[ENCODE] Fertilizer classes: {list(label_encoder.classes_)}")
    return y_encoded, label_encoder


def split_train_test(X, y_encoded):
    """
    Split into train/test sets: 80/20, random_state=42, stratified on y
    to preserve class balance across all fertilizer types.
    """
    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y_encoded,
        test_size=TEST_SIZE,
        random_state=RANDOM_STATE,
        stratify=y_encoded,
    )
    print(f"[SPLIT] Train: {X_train.shape}, Test: {X_test.shape}")
    return X_train, X_test, y_train, y_test


def build_and_train_pipeline(preprocessor: ColumnTransformer, X_train, y_train) -> Pipeline:
    """
    Build a single sklearn Pipeline that chains the feature preprocessor
    and the RandomForestClassifier, then fit it on the training data.
    Bundling preprocessing + model into one Pipeline guarantees inference
    always applies the exact same transformations used during training.
    """
    pipeline = Pipeline(
        steps=[
            ("preprocessor", preprocessor),
            ("classifier", RandomForestClassifier(n_estimators=200,random_state=RANDOM_STATE,n_jobs=-1,)),
        ]
    )
    pipeline.fit(X_train, y_train)
    print("[TRAIN] RandomForestClassifier pipeline trained.")
    return pipeline


def evaluate_model(pipeline: Pipeline, X_test, y_test, label_encoder: LabelEncoder) -> None:
    """
    Evaluate the trained pipeline on the held-out test set and print:
    Accuracy, Precision, Recall, F1-score, Confusion Matrix,
    and the full Classification Report (per-class).
    """
    y_pred = pipeline.predict(X_test)

    accuracy = accuracy_score(y_test, y_pred)
    precision = precision_score(y_test, y_pred, average="weighted", zero_division=0)
    recall = recall_score(y_test, y_pred, average="weighted", zero_division=0)
    f1 = f1_score(y_test, y_pred, average="weighted", zero_division=0)

    print("\n" + "=" * 60)
    print("MODEL EVALUATION — Fertilizer Recommendation")
    print("=" * 60)
    print(f"Accuracy  : {accuracy:.4f}")
    print(f"Precision : {precision:.4f}")
    print(f"Recall    : {recall:.4f}")
    print(f"F1-score  : {f1:.4f}")

    print("\nConfusion Matrix:")
    print(confusion_matrix(y_test, y_pred))

    print("\nClassification Report:")
    print(
        classification_report(
            y_test,
            y_pred,
            target_names=label_encoder.classes_,
            zero_division=0,
        )
    )


def save_artifacts(
    pipeline: Pipeline,
    label_encoder: LabelEncoder,
) -> None:
    """
    Save all artifacts required for inference using joblib:
    - The full pipeline (preprocessor + model) as the primary model file.
    - The fitted ColumnTransformer alone (extracted from the pipeline) for
      cases where only the preprocessing step needs to be inspected/reused.
    - The target LabelEncoder, saved separately, to decode predicted class
      indices back into fertilizer names.
    """
    os.makedirs(ARTIFACTS_DIR, exist_ok=True)

    joblib.dump(pipeline, MODEL_PATH)
    joblib.dump(pipeline.named_steps["preprocessor"], PREPROCESSOR_PATH)
    joblib.dump(label_encoder, LABEL_ENCODER_PATH)

    print(f"\n[SAVE] Full pipeline saved to     {MODEL_PATH}")
    print(f"[SAVE] Feature preprocessor saved to {PREPROCESSOR_PATH}")
    print(f"[SAVE] Target label encoder saved to {LABEL_ENCODER_PATH}")


def main():
    df = load_data(DATA_PATH)
    X, y = split_features_target(df)

    preprocessor = build_feature_preprocessor()
    y_encoded, label_encoder = encode_target(y)

    X_train, X_test, y_train, y_test = split_train_test(X, y_encoded)

    pipeline = build_and_train_pipeline(preprocessor, X_train, y_train)
    evaluate_model(pipeline, X_test, y_test, label_encoder)
    save_artifacts(pipeline, label_encoder)


if __name__ == "__main__":
    main()