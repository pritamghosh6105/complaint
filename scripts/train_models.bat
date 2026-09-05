@echo off
echo =====================================================================
echo    CivicPulse AI — Model Training and Benchmark Pipeline
echo =====================================================================
echo.

cd /d "%~dp0\.."

echo Generating synthetic dataset and training 4 ML models...
python ml-service\src\training\train_all.py

echo.
echo =====================================================================
echo  Model training completed! Serialized models saved in ml-service\models
echo =====================================================================
pause
