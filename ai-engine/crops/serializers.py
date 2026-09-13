from rest_framework import serializers


class CropRecommendationSerializer(serializers.Serializer):
    N = serializers.FloatField()
    P = serializers.FloatField()
    K = serializers.FloatField()

    temperature = serializers.FloatField()
    humidity = serializers.FloatField()
    ph = serializers.FloatField()
    rainfall = serializers.FloatField()


class FertilizerRecommendationSerializer(serializers.Serializer):

    Soil_Type = serializers.CharField()
    Crop_Type = serializers.CharField()
    Crop_Growth_Stage = serializers.CharField()
    Season = serializers.CharField()
    Irrigation_Type = serializers.CharField()
    Previous_Crop = serializers.CharField()
    Region = serializers.CharField()

    Soil_pH = serializers.FloatField()
    Soil_Moisture = serializers.FloatField()
    Organic_Carbon = serializers.FloatField()
    Electrical_Conductivity = serializers.FloatField()

    Nitrogen_Level = serializers.FloatField()
    Phosphorus_Level = serializers.FloatField()
    Potassium_Level = serializers.FloatField()

    Temperature = serializers.FloatField()
    Humidity = serializers.FloatField()
    Rainfall = serializers.FloatField()

    Fertilizer_Used_Last_Season = serializers.FloatField()
    Yield_Last_Season = serializers.FloatField()

class IrrigationPredictionSerializer(serializers.Serializer):

    Soil_Type = serializers.CharField()

    Soil_pH = serializers.FloatField()
    Soil_Moisture = serializers.FloatField()
    Organic_Carbon = serializers.FloatField()
    Electrical_Conductivity = serializers.FloatField()

    Temperature_C = serializers.FloatField()
    Humidity = serializers.FloatField()
    Rainfall_mm = serializers.FloatField()

    Sunlight_Hours = serializers.FloatField()
    Wind_Speed_kmh = serializers.FloatField()

    Crop_Type = serializers.CharField()
    Crop_Growth_Stage = serializers.CharField()
    Season = serializers.CharField()

    Irrigation_Type = serializers.CharField()
    Water_Source = serializers.CharField()

    Field_Area_hectare = serializers.FloatField()
    Mulching_Used = serializers.CharField()
    Previous_Irrigation_mm = serializers.FloatField()

    Region = serializers.CharField()

class CropYieldPredictionSerializer(serializers.Serializer):

    Crop = serializers.CharField()
    Crop_Year = serializers.IntegerField()
    Season = serializers.CharField()
    State = serializers.CharField()

    Area = serializers.FloatField()
    Annual_Rainfall = serializers.FloatField()
    Fertilizer = serializers.FloatField()
    Pesticide = serializers.FloatField()