import os
import joblib
import pandas as pd

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

MODEL_PATH = os.path.join(
    BASE_DIR,
    "ml_models",
    "artifacts",
    "fertilizer_model.pkl",
)

ENCODER_PATH = os.path.join(
    BASE_DIR,
    "ml_models",
    "artifacts",
    "fertilizer_label_encoder.pkl",
)


class FertilizerRecommendationService:

    def __init__(self):
        self.model = joblib.load(MODEL_PATH)
        self.encoder = joblib.load(ENCODER_PATH)

    def predict(self, data):

        features = pd.DataFrame([{
            "Soil_Type": data["Soil_Type"],
            "Crop_Type": data["Crop_Type"],
            "Crop_Growth_Stage": data["Crop_Growth_Stage"],
            "Season": data["Season"],
            "Irrigation_Type": data["Irrigation_Type"],
            "Previous_Crop": data["Previous_Crop"],
            "Region": data["Region"],
            "Soil_pH": data["Soil_pH"],
            "Soil_Moisture": data["Soil_Moisture"],
            "Organic_Carbon": data["Organic_Carbon"],
            "Electrical_Conductivity": data["Electrical_Conductivity"],
            "Nitrogen_Level": data["Nitrogen_Level"],
            "Phosphorus_Level": data["Phosphorus_Level"],
            "Potassium_Level": data["Potassium_Level"],
            "Temperature": data["Temperature"],
            "Humidity": data["Humidity"],
            "Rainfall": data["Rainfall"],
            "Fertilizer_Used_Last_Season": data["Fertilizer_Used_Last_Season"],
            "Yield_Last_Season": data["Yield_Last_Season"],
        }])

        prediction = self.model.predict(features)[0]

        fertilizer = self.encoder.inverse_transform([prediction])[0]

        return fertilizer


fertilizer_service = FertilizerRecommendationService()