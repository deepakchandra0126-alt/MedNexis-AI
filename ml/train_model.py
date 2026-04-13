"""
Healthcare AI - Disease Prediction Model
Train using Kaggle Disease-Symptom dataset

Dataset: https://www.kaggle.com/datasets/itachi9604/disease-symptom-description-dataset
Files needed in ml/data/:
  - dataset.csv
  - symptom_Description.csv
  - symptom_precaution.csv
  - Symptom-severity.csv
"""

import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import accuracy_score, classification_report
import pickle
import os
import json

DATA_DIR = os.path.join(os.path.dirname(__file__), 'data')
MODEL_DIR = os.path.join(os.path.dirname(__file__), 'models')
os.makedirs(MODEL_DIR, exist_ok=True)

def load_data():
    print("📂 Loading datasets...")
    
    # Main symptom-disease dataset
    df = pd.read_csv(os.path.join(DATA_DIR, 'dataset.csv'))
    df.columns = df.columns.str.strip()
    
    # Symptom descriptions
    desc_df = pd.read_csv(os.path.join(DATA_DIR, 'symptom_Description.csv'))
    desc_df.columns = desc_df.columns.str.strip()
    
    # Precautions
    prec_df = pd.read_csv(os.path.join(DATA_DIR, 'symptom_precaution.csv'))
    prec_df.columns = prec_df.columns.str.strip()
    
    print(f"✅ Loaded {len(df)} records, {df['Disease'].nunique()} diseases")
    return df, desc_df, prec_df

def preprocess(df):
    print("⚙️ Preprocessing data...")
    
    # Get all symptom columns
    symptom_cols = [c for c in df.columns if 'Symptom' in c]
    
    # Get unique symptoms
    all_symptoms = set()
    for col in symptom_cols:
        vals = df[col].dropna().str.strip().str.lower()
        all_symptoms.update(vals)
    all_symptoms = sorted(list(all_symptoms))
    
    # One-hot encode symptoms
    X = pd.DataFrame(0, index=df.index, columns=all_symptoms)
    for col in symptom_cols:
        for idx, val in df[col].dropna().items():
            s = val.strip().lower()
            if s in X.columns:
                X.loc[idx, s] = 1
    
    # Encode target
    le = LabelEncoder()
    y = le.fit_transform(df['Disease'].str.strip())
    
    print(f"✅ Features: {X.shape[1]} symptoms | Classes: {len(le.classes_)}")
    return X, y, le, all_symptoms

def train_model(X, y):
    print("🤖 Training model...")
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    
    # Random Forest (best for this type of data)
    model = RandomForestClassifier(
        n_estimators=200,
        max_depth=20,
        min_samples_split=2,
        random_state=42,
        n_jobs=-1
    )
    model.fit(X_train, y_train)
    
    # Evaluate
    y_pred = model.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    print(f"\n📊 Accuracy: {acc:.4f} ({acc*100:.2f}%)")
    
    # Cross validation
    cv_scores = cross_val_score(model, X, y, cv=5)
    print(f"📊 Cross-val accuracy: {cv_scores.mean():.4f} ± {cv_scores.std():.4f}")
    
    return model

def build_disease_info(desc_df, prec_df):
    info = {}
    
    for _, row in desc_df.iterrows():
        disease = str(row.get('Disease', '')).strip()
        if disease:
            info[disease] = {'description': str(row.get('Description', '')).strip()}
    
    for _, row in prec_df.iterrows():
        disease = str(row.get('Disease', '')).strip()
        if disease:
            precs = []
            for i in range(1, 5):
                p = str(row.get(f'Precaution_{i}', '')).strip()
                if p and p != 'nan':
                    precs.append(p)
            if disease in info:
                info[disease]['precautions'] = precs
            else:
                info[disease] = {'precautions': precs}
    
    return info

def save_model(model, le, all_symptoms, disease_info):
    print("\n💾 Saving model...")
    
    with open(os.path.join(MODEL_DIR, 'disease_model.pkl'), 'wb') as f:
        pickle.dump(model, f)
    
    with open(os.path.join(MODEL_DIR, 'label_encoder.pkl'), 'wb') as f:
        pickle.dump(le, f)
    
    with open(os.path.join(MODEL_DIR, 'symptoms_list.json'), 'w') as f:
        json.dump(all_symptoms, f)
    
    with open(os.path.join(MODEL_DIR, 'disease_info.json'), 'w') as f:
        json.dump(disease_info, f, indent=2)
    
    print("✅ Model saved to ml/models/")

if __name__ == '__main__':
    df, desc_df, prec_df = load_data()
    X, y, le, all_symptoms = preprocess(df)
    model = train_model(X, y)
    disease_info = build_disease_info(desc_df, prec_df)
    save_model(model, le, all_symptoms, disease_info)
    print("\n🎉 Training complete! Run 'python app.py' to start the API.")
