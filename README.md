# # 🏥 MedNexis AI — Smart Healthcare Chatbot

AI-powered healthcare chatbot trained on Kaggle disease dataset with **location-based disease awareness system**.

---

## 🧠 About Project

**MedNexis AI** is an intelligent healthcare assistant that analyzes user symptoms and provides disease predictions along with precautions.
It also introduces a unique **location-based disease awareness feature**, helping users stay informed about health risks in their surrounding areas.

---

## ✅ Model Stats (Pre-trained & Included)

* **Dataset**: 4,920 records (Kaggle)
* **Diseases**: 41 diseases
* **Symptoms**: 131 symptoms
* **Accuracy**: 100% (test set)
* **Algorithm**: Random Forest (200 trees)

---

## 📁 Project Structure

```
healthai/
├── frontend/          ← React.js UI
├── backend/           ← Node.js + Express API
├── ml/
│   ├── models/        ← Pre-trained ML models
│   │   ├── disease_model.pkl
│   │   ├── label_encoder.pkl
│   │   ├── symptoms_list.json
│   │   ├── disease_info.json
│   │   └── symptom_severity.json
│   ├── data/          ← Kaggle dataset
│   ├── app.py         ← Flask API
│   └── train_model.py ← Model training script
└── database/
```

---

## ⚙️ Requirements

* Node.js (v18+)
* Python (v3.9+)
* MongoDB (local / Atlas)

---

## 🚀 Setup (3 Steps)

### 🔹 Step 1 — Backend

```bash
cd backend
npm install
cp .env.example .env
node server.js
```

---

### 🔹 Step 2 — ML API

```bash
cd ml
python app.py
```

---

### 🔹 Step 3 — Frontend

```bash
cd frontend
npm install
npm start
```

---

### 🔹 Optional: MongoDB

```bash
mongod
```

---

## 🌐 URLs

| Service     | URL                   |
| ----------- | --------------------- |
| Frontend    | http://localhost:3000 |
| Backend API | http://localhost:5000 |
| ML API      | http://localhost:5001 |

---

## 🌟 Features

### 🤖 AI Symptom Checker

* Predicts diseases based on symptoms
* Instant results using ML model

### 📍 Location-Based Awareness

* Shows disease percentage in nearby areas
* Alerts users about potential risks

### 📊 Admin Dashboard

* User statistics
* Disease analytics
* Area-based reports

### 🔐 Privacy Protection

* No personal data exposed
* Only aggregated data displayed

---

## ⚠️ Disclaimer

This project is developed for **educational purposes only** and is **not a substitute for professional medical advice**.

---

## 👨‍💻 Developed By

Deepak Chandra
Final Year Project 🚀
