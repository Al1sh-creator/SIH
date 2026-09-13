"""
FarmSense — Model Training Script
Model   : Crop Recommendation (RandomForestClassifier)
Dataset : data/cleaned/crop_recommendation_cleaned.csv

This script ONLY trains and evaluates the model. No Django/API code here.

Input   : data/cleaned/crop_recommendation_cleaned.csv
Outputs : ml_models/artifacts/crop_recommendation_model.pkl
          ml_models/artifacts/crop_label_encoder.pkl
"""

import os

import joblib
import pandas as pd
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
from sklearn.preprocessing import LabelEncoder

# ── Config ───────────────────────────────────────────────────────────
DATA_PATH = os.path.join("data", "cleaned", "crop_recommendation_cleaned.csv")
ARTIFACTS_DIR = os.path.join("ml_models", "artifacts")
MODEL_PATH = os.path.join(ARTIFACTS_DIR, "crop_recommendation_model.pkl")
ENCODER_PATH = os.path.join(ARTIFACTS_DIR, "crop_label_encoder.pkl")

FEATURE_COLUMNS = ["N", "P", "K", "temperature", "humidity", "ph", "rainfall"]
TARGET_COLUMN = "label"

RANDOM_STATE = 42
TEST_SIZE = 0.2


def load_data(path: str) -> pd.DataFrame:
    """Load the cleaned crop recommendation dataset."""
    df = pd.read_csv(path)
    print(f"[LOAD] {path} -> shape={df.shape}")
    return df


def split_features_target(df: pd.DataFrame):
    """Separate feature matrix X and raw target labels y."""
    X = df[FEATURE_COLUMNS]
    y = df[TARGET_COLUMN]
    return X, y


def encode_labels(y):
    """
    Encode string crop labels into integers using LabelEncoder.
    Returns the encoded labels and the fitted encoder (needed later
    for inverse_transform when serving predictions).
    """
    label_encoder = LabelEncoder()
    y_encoded = label_encoder.fit_transform(y)
    print(f"[ENCODE] Classes: {list(label_encoder.classes_)}")
    return y_encoded, label_encoder


def split_train_test(X, y_encoded):
    """
    Split into train/test sets: 80/20, random_state=42, stratified on y
    to preserve class balance across all 22 crop labels.
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


def train_model(X_train, y_train) -> RandomForestClassifier:
    """Train a RandomForestClassifier with a fixed random_state for reproducibility."""
    model = RandomForestClassifier(random_state=RANDOM_STATE)
    model.fit(X_train, y_train)
    print("[TRAIN] RandomForestClassifier trained.")
    return model


def evaluate_model(model, X_test, y_test, label_encoder: LabelEncoder) -> None:
    """
    Evaluate the trained model on the held-out test set and print:
    Accuracy, Precision, Recall, F1-score, Confusion Matrix,
    and the full Classification Report (per-class).
    """
    y_pred = model.predict(X_test)

    accuracy = accuracy_score(y_test, y_pred)
    precision = precision_score(y_test, y_pred, average="weighted", zero_division=0)
    recall = recall_score(y_test, y_pred, average="weighted", zero_division=0)
    f1 = f1_score(y_test, y_pred, average="weighted", zero_division=0)

    print("\n" + "=" * 60)
    print("MODEL EVALUATION — Crop Recommendation")
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


def save_artifacts(model: RandomForestClassifier, label_encoder: LabelEncoder) -> None:
    """Save the trained model and label encoder to disk using joblib."""
    os.makedirs(ARTIFACTS_DIR, exist_ok=True)
    joblib.dump(model, MODEL_PATH)
    joblib.dump(label_encoder, ENCODER_PATH)
    print(f"\n[SAVE] Model saved to      {MODEL_PATH}")
    print(f"[SAVE] Label encoder saved to {ENCODER_PATH}")


def main():
    df = load_data(DATA_PATH)
    X, y = split_features_target(df)
    y_encoded, label_encoder = encode_labels(y)
    X_train, X_test, y_train, y_test = split_train_test(X, y_encoded)
    model = train_model(X_train, y_train)
    evaluate_model(model, X_test, y_test, label_encoder)
    save_artifacts(model, label_encoder)


if __name__ == "__main__":
    main()