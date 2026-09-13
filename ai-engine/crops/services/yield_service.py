import os
import joblib
import pandas as pd

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

MODEL_PATH = os.path.join(
    BASE_DIR,
    "ml_models",
    "artifacts",
    "crop_yield_model.pkl",
)


class CropYieldPredictionService:

    def __init__(self):
        self.model = joblib.load(MODEL_PATH)

    def predict(self, data):

        features = pd.DataFrame([{
            "Crop": data["Crop"],
            "Crop_Year": data["Crop_Year"],
            "Season": data["Season"],
            "State": data["State"],
            "Area": data["Area"],
            "Annual_Rainfall": data["Annual_Rainfall"],
            "Fertilizer": data["Fertilizer"],
            "Pesticide": data["Pesticide"],
        }])

        prediction = self.model.predict(features)[0]

        return round(float(prediction), 2)


yield_service = CropYieldPredictionService()