import os
import joblib
import pandas as pd

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

MODEL_PATH = os.path.join(
    BASE_DIR,
    "ml_models",
    "artifacts",
    "irrigation_model.pkl",
)

ENCODER_PATH = os.path.join(
    BASE_DIR,
    "ml_models",
    "artifacts",
    "irrigation_label_encoder.pkl",
)


class IrrigationPredictionService:

    def __init__(self):
        self.model = joblib.load(MODEL_PATH)
        self.encoder = joblib.load(ENCODER_PATH)

    def predict(self, data):

        features = pd.DataFrame([{
            "Soil_Type": data["Soil_Type"],
            "Soil_pH": data["Soil_pH"],
            "Soil_Moisture": data["Soil_Moisture"],
            "Organic_Carbon": data["Organic_Carbon"],
            "Electrical_Conductivity": data["Electrical_Conductivity"],
            "Temperature_C": data["Temperature_C"],
            "Humidity": data["Humidity"],
            "Rainfall_mm": data["Rainfall_mm"],
            "Sunlight_Hours": data["Sunlight_Hours"],
            "Wind_Speed_kmh": data["Wind_Speed_kmh"],
            "Crop_Type": data["Crop_Type"],
            "Crop_Growth_Stage": data["Crop_Growth_Stage"],
            "Season": data["Season"],
            "Irrigation_Type": data["Irrigation_Type"],
            "Water_Source": data["Water_Source"],
            "Field_Area_hectare": data["Field_Area_hectare"],
            "Mulching_Used": data["Mulching_Used"],
            "Previous_Irrigation_mm": data["Previous_Irrigation_mm"],
            "Forecast_Rainfall_7Days_mm": data["Forecast_Rainfall_7Days_mm"],
            "Forecast_Temp_7Days_Avg": data["Forecast_Temp_7Days_Avg"],
            "Region": data["Region"],
        }])

        prediction = self.model.predict(features)[0]

        irrigation = self.encoder.inverse_transform([prediction])[0]

        return irrigation


irrigation_service = IrrigationPredictionService()