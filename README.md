# 🌾 AgriSmart AI

**SIH - 2026 [Internal Hackathon] L. J. Institute of Engineering and Technology [C-433]**
**Problem Statement - 1 (Intelligent Agriculture for a Sustainable Future)**

AgriSmart AI is an intelligent, full-stack agricultural platform designed to empower farmers with data-driven insights. It leverages Machine Learning, Computer Vision, Generative AI, and localized real-time data to provide crop suitability recommendations, yield predictions, automated disease detection, and personalized farm management assistance.

---

## 🚀 1. Modules Built

### 🟢 Mandatory Core Task
- [x] **Crop Disease Detection (Computer Vision):** AI-powered image analysis classifying leaf/crop images into disease classes or "healthy". Features a direct `predict.py` CLI interface and a web dashboard.

### 🌟 Bonus Modules
- [x] **A. Crop Recommendation:** Recommends suitable crops based on soil type, pH, temperature, humidity, rainfall, water availability, season, location, and previous crop data.
- [x] **B. Smart Irrigation:** Predicts irrigation needs utilizing soil moisture, weather forecasts, crop type, and growth stages.
- [x] **C. Weather-Based Intelligence:** Proactive weather insights (e.g., "delay irrigation - rain likely") using Open-Meteo live/forecast data.
- [x] **D. Sustainability Score:** Computes an indicative score evaluating water efficiency, resource use, and crop health with actionable improvement suggestions.
- [x] **E. Farmer Assistant (GenAI):** A conversational plain-language interface powered by RAG, LangChain, and Groq, with regional language support.
- [x] **G. Agentic Advisor:** Autonomous background scheduler (`scheduler.js` / `alert_engine.py`) that continuously analyses inputs, checks weather, and autonomously notifies farmers via SMS/Email.

---

## 🛠️ 2. Setup and Run Instructions (Reproducibility)

A judge can reproduce the environment and prediction in under 10 minutes.

### Prerequisites
- Node.js (v18.x+)
- Python (v3.10+)
- PostgreSQL

### Automated One-Click Setup (Windows)
We provide a batch script to set up the entire workspace, install dependencies for all 3 sub-apps, run database migrations, and prepare models.

From the root directory, run:
```bat
install.bat
```
*(Note: Downloads pip/npm packages and trains ML models.)*

### Running the Platform
Launch the client, server, and AI engine concurrently:
```bat
start.bat
```
- **Client (React):** `http://localhost:5173`
- **Server (Node):** `http://localhost:5000`
- **AI Engine (Django):** `http://localhost:8000`

### Core Task `predict.py` (CLI Interface)
To test the core Computer Vision model directly on a single field image:
```bash
cd model
python predict.py --image ../sample_test_image.jpg
```

---

## 📊 3. Datasets Used

- **Core Task (Disease Detection):** PlantVillage (Lab-condition leaf images) combined with PlantDoc (Real-world images) for robust validation. [CC BY-SA 3.0 License]
- **Crop Recommendation & Yield:** Publicly available Kaggle Agricultural Datasets for Indian states.
- **Weather Data:** Open-Meteo API (Free, open-source weather API).

---

## 📈 4. Reported Metrics

| Model / Task | Primary Metric | Accuracy / Additional Metrics |
| :--- | :--- | :--- |
| **Crop Disease Detection (Core)** | **Macro-F1:** 0.88 | Accuracy: 91%, (See `/report/MODEL_REPORT.md` for Confusion Matrix) |
| **Crop Recommendation** | F1-Score: 0.94 | Accuracy: 95% |
| **Irrigation Prediction** | F1-Score: 0.89 | Accuracy: 90% |

> *Note: Full per-class precision/recall and confusion matrix for the core disease task are located in the `/report` directory.*

---

## 🏗️ 5. Architecture Overview & Limitations

### Architecture
AgriSmart AI follows a microservices-inspired architecture:
- **Client (`/client`):** React 18, Vite, Tailwind CSS, Recharts for data visualization.
- **Node API Server (`/server`):** Node.js, Express, PostgreSQL, Socket.io (WebSockets), Twilio & Nodemailer for autonomous Agentic alerts.
- **AI Engine (`/ai-engine`):** Python, Django REST, LangChain, Groq API for GenAI RAG, and local PyTorch/Scikit-learn models for predictive analytics.
- **Model Inference (`/model`):** Isolated prediction scripts meeting strict CLI judge requirements.

### Sustainability Formula
`Sustainability Score = (Water Efficiency * 0.4) + (Crop Health * 0.4) + (Resource Opt * 0.2)`
*(Detailed logic integrated within Recommendation Rules)*

### Known Limitations
- **Real-field occlusions:** The core CV model performs exceptionally well on standard lighting but may experience slight confidence drops with heavy real-world background clutter or severe occlusion (handled partially via bounding/cropping).

---

## 🎥 6. Links

- **Demo Video:** [YouTube Link (To be updated)](#)
- **Deployed Application:** [Vercel/Render Link (To be updated)](#)

---

## 📜 7. Originality Declaration

We declare that the substantive work submitted was developed during the official hackathon window (10 – 15 September 2026). 
- We utilized open-source frameworks (React, Django, Express).
- We used public datasets (PlantVillage, Kaggle).
- Pretrained backbones were utilized/fine-tuned for the CV task.
- We used AI coding assistants strictly within permitted guidelines, with all integration and system design being original work.

All third-party libraries and models are cited within our `requirements.txt` and `package.json`.
