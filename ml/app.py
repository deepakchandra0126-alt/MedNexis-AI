"""
HealthAI - Flask ML Prediction API
Pre-trained on Kaggle Disease-Symptom Dataset
4920 records | 41 diseases | 131 symptoms | 100% accuracy
Run: python app.py  (port 5001)
"""

from flask import Flask, request, jsonify
import pickle, json, numpy as np, os, warnings
import csv, difflib, re
warnings.filterwarnings('ignore')

app = Flask(__name__)

@app.after_request
def add_cors(r):
    r.headers['Access-Control-Allow-Origin'] = '*'
    r.headers['Access-Control-Allow-Headers'] = 'Content-Type,Authorization'
    r.headers['Access-Control-Allow-Methods'] = 'GET,POST,PUT,DELETE,OPTIONS'
    return r

@app.route('/', defaults={'path': ''}, methods=['OPTIONS'])
@app.route('/<path:path>', methods=['OPTIONS'])
def opts(path): return jsonify({}), 200

MODEL_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'models')
DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data')

def load():
    try:
        with open(f'{MODEL_DIR}/disease_model.pkl','rb') as f: model = pickle.load(f)
        with open(f'{MODEL_DIR}/label_encoder.pkl','rb') as f: le = pickle.load(f)
        with open(f'{MODEL_DIR}/symptoms_list.json') as f: syms = json.load(f)
        with open(f'{MODEL_DIR}/disease_info.json') as f: dinfo = json.load(f)
        with open(f'{MODEL_DIR}/symptom_severity.json') as f: sev = json.load(f)
        with open(f'{MODEL_DIR}/model_meta.json') as f: meta = json.load(f)
        print(f"✅ Model loaded: {meta['diseases']} diseases | {meta['symptoms']} symptoms | {meta['accuracy']}% accuracy")
        return model, le, syms, dinfo, sev, meta
    except Exception as e:
        print(f"❌ Error loading model: {e}"); return None,None,[],{},{},{}

model, le, symptoms_list, disease_info, sev_map, meta = load()
symptom_lookup = {re.sub(r'[^a-z0-9]', '', s): s for s in symptoms_list}
MIN_CONFIDENCE_PERCENT = 20.0
SYMPTOM_ALIASES = {
    'fever': 'high_fever',
    'temperature': 'high_fever',
    'cold': 'runny_nose',
    'sore_throat': 'throat_irritation',
    'throat_pain': 'throat_irritation',
    'stomach_ache': 'stomach_pain',
    'belly_ache': 'belly_pain',
    'loose_motion': 'diarrhoea',
    'loose_motions': 'diarrhoea',
    'breathing_problem': 'breathlessness'
}

def normalize_symptom(value):
    raw = str(value).strip().lower()
    normalized = re.sub(r'[\s-]+', '_', raw)
    compact = re.sub(r'[^a-z0-9]', '', raw)

    if normalized in SYMPTOM_ALIASES:
        return SYMPTOM_ALIASES[normalized]
    if normalized in symptoms_list:
        return normalized
    if compact in symptom_lookup:
        return symptom_lookup[compact]

    close = difflib.get_close_matches(normalized, symptoms_list, n=1, cutoff=0.86)
    if close:
        return close[0]

    return None

def build_disease_profiles():
    profiles = {}
    dataset_path = os.path.join(DATA_DIR, 'dataset.csv')
    if not os.path.exists(dataset_path):
        return profiles

    with open(dataset_path, newline='', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        symptom_cols = [c for c in reader.fieldnames or [] if c.lower().startswith('symptom')]

        for row in reader:
            disease = str(row.get('Disease', '')).strip()
            if not disease:
                continue

            row_symptoms = set()
            for col in symptom_cols:
                raw = row.get(col)
                if raw:
                    normalized = normalize_symptom(raw)
                    if normalized:
                        row_symptoms.add(normalized)

            if not row_symptoms:
                continue

            item = profiles.setdefault(disease, {'union': set(), 'rows': []})
            item['union'].update(row_symptoms)
            item['rows'].append(row_symptoms)

    return profiles

def find_dataset_matches(matched_symptoms, limit=4):
    user_set = set(matched_symptoms)
    if len(user_set) < 2:
        return []

    matches = []
    for disease, profile in disease_profiles.items():
        union = profile['union']
        row_scores = []
        for row_symptoms in profile['rows']:
            intersection = len(user_set & row_symptoms)
            if intersection:
                row_scores.append(intersection / len(user_set | row_symptoms))

        coverage = len(user_set & union) / len(user_set)
        specificity = len(user_set & union) / max(len(union), 1)
        best_row = max(row_scores) if row_scores else 0
        score = max(best_row, (coverage * 0.75) + (specificity * 0.25))

        if coverage >= 0.5 and score > 0:
            matches.append({
                'disease': disease,
                'confidence': round(score * 100, 1),
                'coverage': round(coverage * 100, 1)
            })

    return sorted(matches, key=lambda item: item['confidence'], reverse=True)[:limit]

disease_profiles = build_disease_profiles()

@app.route('/health')
def health():
    return jsonify({'status':'ok','model_loaded': model is not None,'meta': meta})

@app.route('/symptoms')
def get_symptoms():
    return jsonify({'symptoms': symptoms_list, 'count': len(symptoms_list)})

@app.route('/diseases')
def get_diseases():
    return jsonify({'diseases': list(le.classes_) if le else [], 'count': len(le.classes_) if le else 0})

@app.route('/predict', methods=['POST'])
def predict():
    if model is None:
        return jsonify({'error': 'Model not loaded'}), 503
    data = request.get_json() or {}
    user_syms = data.get('symptoms', [])
    if not user_syms:
        return jsonify({'error': 'No symptoms provided'}), 400

    vec = np.zeros(len(symptoms_list))
    matched, unmatched = [], []
    for s in user_syms:
        sc = normalize_symptom(s)
        if sc:
            vec[symptoms_list.index(sc)] = 1; matched.append(sc)
        else:
            unmatched.append(s)

    if vec.sum() == 0:
        return jsonify({'error':'No recognized symptoms.','hint':f'/symptoms lists all {len(symptoms_list)} valid ones','unmatched':unmatched}), 400

    proba = model.predict_proba([vec])[0]
    top = np.argsort(proba)[::-1][:5]
    disease = le.classes_[top[0]]
    conf = float(proba[top[0]])
    confidence_pct = round(conf*100, 1)
    info = disease_info.get(disease, {})

    wsum = sum(sev_map.get(s,1) for s in matched)
    avg_w = wsum/len(matched) if matched else 1
    severity = 'severe' if avg_w>=5 else 'moderate' if avg_w>=3 else 'mild'

    alts = [{'disease': le.classes_[i], 'confidence': round(float(proba[i])*100,1)}
            for i in top[1:4] if proba[i]>0.01]
    dataset_matches = find_dataset_matches(matched)

    if dataset_matches and dataset_matches[0]['confidence'] >= 45:
        disease = dataset_matches[0]['disease']
        confidence_pct = max(confidence_pct, dataset_matches[0]['confidence'])
        info = disease_info.get(disease, {})
        merged_alts = dataset_matches[1:] + [
            {'disease': le.classes_[i], 'confidence': round(float(proba[i])*100, 1)}
            for i in top if le.classes_[i] != disease and proba[i] > 0.01
        ]

        return jsonify({
            'disease': disease,
            'confidence': round(confidence_pct, 1),
            'description': info.get('description', f'{disease} requires medical attention.'),
            'precautions': info.get('precautions', ['Consult a doctor','Rest well','Stay hydrated']),
            'medications': info.get('medications', []),
            'workouts': info.get('workouts', ['Light walking','Rest as needed']),
            'diets': info.get('diets', ['Balanced diet','Stay hydrated','Avoid junk food']),
            'severity': severity,
            'matched_symptoms': matched,
            'unmatched_symptoms': unmatched,
            'alternatives': merged_alts[:3],
            'match_source': 'dataset_similarity',
            'disclaimer': 'AI prediction only — consult a licensed doctor for diagnosis.'
        })

    if confidence_pct < MIN_CONFIDENCE_PERCENT:
        return jsonify({
            'disease': 'More symptoms needed',
            'confidence': confidence_pct,
            'description': (
                'The symptoms provided are too general for a reliable disease prediction. '
                f'The closest match was {disease}, but confidence is only {confidence_pct}%. '
                'Please add more specific symptoms such as fever level, cough, pain location, rash, vomiting, or duration.'
            ),
            'precautions': ['Add more specific symptoms', 'Monitor your symptoms', 'Consult a doctor if symptoms are severe or persistent'],
            'medications': [],
            'workouts': ['Rest as needed'],
            'diets': ['Stay hydrated', 'Eat a balanced diet'],
            'severity': 'mild',
            'matched_symptoms': matched,
            'unmatched_symptoms': unmatched,
            'alternatives': dataset_matches[:3] if dataset_matches else [{'disease': disease, 'confidence': confidence_pct}] + alts,
            'needs_more_info': True,
            'disclaimer': 'AI prediction only — consult a licensed doctor for diagnosis.'
        })

    return jsonify({
        'disease': disease,
        'confidence': confidence_pct,
        'description': info.get('description', f'{disease} requires medical attention.'),
        'precautions': info.get('precautions', ['Consult a doctor','Rest well','Stay hydrated']),
        'medications': info.get('medications', []),
        'workouts': info.get('workouts', ['Light walking','Rest as needed']),
        'diets': info.get('diets', ['Balanced diet','Stay hydrated','Avoid junk food']),
        'severity': severity,
        'matched_symptoms': matched,
        'unmatched_symptoms': unmatched,
        'alternatives': alts,
        'disclaimer': 'AI prediction only — consult a licensed doctor for diagnosis.'
    })

if __name__ == '__main__':
    print("🏥 HealthAI ML API → http://localhost:5001")
    app.run(host='0.0.0.0', port=5001, debug=False)
