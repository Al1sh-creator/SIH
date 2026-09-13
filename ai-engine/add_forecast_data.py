import pandas as pd
import numpy as np

file_path = "c:/Users/Public/farmsense 2/Farmsense-ai/ai-engine/data/cleaned/irrigation_prediction_cleaned.csv"
print(f"Loading {file_path}...")
df = pd.read_csv(file_path)

# Synthetic Logic:
np.random.seed(42)

forecast_rain = np.random.exponential(scale=15.0, size=len(df))
forecast_rain += df['Rainfall_mm'].apply(lambda x: np.random.uniform(5, 50) if x > 5 else 0)
forecast_temp = df['Temperature_C'] + np.random.normal(0, 1.5, size=len(df))

df['Forecast_Rainfall_7Days_mm'] = np.round(forecast_rain, 2)
df['Forecast_Temp_7Days_Avg'] = np.round(forecast_temp, 2)

def adjust_target(row):
    need = row['Irrigation_Need']
    f_rain = row['Forecast_Rainfall_7Days_mm']
    f_temp = row['Forecast_Temp_7Days_Avg']
    
    if f_rain > 40:
        return 'Low'
    if f_rain > 15 and need == 'High':
        return 'Medium'
    if f_rain < 2 and f_temp > 35 and need == 'Low':
        return 'Medium'
    
    return need

df['Irrigation_Need'] = df.apply(adjust_target, axis=1)

print("Target distribution after adjustment:")
print(df['Irrigation_Need'].value_counts())

df.to_csv(file_path, index=False)
print("Updated dataset saved.")
