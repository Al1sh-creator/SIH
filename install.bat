@echo off
echo =========================================
echo 📦 Installing FarmSense Dependencies...
echo =========================================

echo.
echo [1/3] Installing Server dependencies...
cd server
call npm install
cd ..

echo.
echo [2/3] Installing Client dependencies...
cd client
call npm install
cd ..

echo.
echo [3/3] Installing AI Engine dependencies...
cd ai-engine
python -m venv venv
call venv\Scripts\activate.bat
python -m pip install --upgrade pip
pip install -r requirements.txt
python manage.py makemigrations crops
python manage.py makemigrations weather
python manage.py makemigrations accounts
python manage.py makemigrations suggestions
python manage.py migrate
python manage.py loaddata data/crops.json
echo Training ML models (this might take a minute)...
python ml_models/train_crop_suitability.py
python ml_models/train_yield_predictor.py
cd ..

echo.
echo =========================================
echo ✅ Installation Complete!
echo =========================================
pause
