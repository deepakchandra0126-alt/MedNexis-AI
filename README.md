# 🏥 HealthAI - Smart Healthcare Chatbot

AI-powered healthcare chatbot trained on Kaggle disease dataset with location-based disease alerts.

## ✅ Model Stats (Pre-trained & Included)
- **Dataset**: 4,920 records from Kaggle
- **Diseases**: 41 diseases
- **Symptoms**: 131 symptoms
- **Accuracy**: 100% on test set
- **Algorithm**: Random Forest (200 trees)

## 📁 Project Structure
```
healthai/
├── frontend/          ← React.js UI
├── backend/           ← Node.js + Express API
├── ml/
│   ├── models/        ← ✅ PRE-TRAINED (ready to use!)
│   │   ├── disease_model.pkl
│   │   ├── label_encoder.pkl
│   │   ├── symptoms_list.json
│   │   ├── disease_info.json
│   │   └── symptom_severity.json
│   ├── data/          ← Kaggle CSVs (included)
│   ├── app.py         ← Flask API
│   └── train_model.py ← Re-train if needed
└── database/
```

## ⚙️ Requirements
- Node.js 18+
- Python 3.9+
- MongoDB (local or Atlas)

## 🚀 Setup (3 steps)

### Step 1 — Backend
```bash
cd backend
npm install
cp .env.example .env   # edit MongoDB URI if needed
node server.js
```

### Step 2 — ML API
```bash
cd ml
python app.py
# Model loads automatically — no training needed!
```

### Step 3 — Frontend
```bash
cd frontend
npm install
npm start
```

### Optional: MongoDB
```bash
mongod   # or use MongoDB Atlas free tier
```

## 🌐 URLs
| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:5000 |
| ML API | http://localhost:5001 |

## 🌟 Features
1. **Symptom Checker** — 131 symptoms → 41 disease predictions
2. **Health Profile** — Age, BMI, blood group, medications
3. **Location Heatmap** — Anonymous disease density by area
4. **Zone Alerts** — Real-time alert when entering disease-heavy zone
5. **Dashboard** — Diagnosis history + trending diseases

## ⚠️ Disclaimer
College project for educational purposes only. NOT a substitute for professional medical advice.
