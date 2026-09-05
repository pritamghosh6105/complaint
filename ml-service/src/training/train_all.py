import os
import sys
import json
import joblib
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import classification_report, confusion_matrix, mean_absolute_error, r2_score
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder, StandardScaler

if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

# Add parent to path for imports
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(os.path.abspath(os.path.join(current_dir, "../..")))

from src.preprocessing.text_cleaner import clean_text
from src.preprocessing.feature_engineering import (
    build_structured_features,
    calculate_safety_score
)

def train_all_models():
    data_path = os.path.join(current_dir, "../../data/civic_complaints_dataset.csv")
    models_dir = os.path.join(current_dir, "../../models")
    os.makedirs(models_dir, exist_ok=True)
    
    if not os.path.exists(data_path):
        print(f"Dataset not found at {data_path}. Running generator first...")
        from data.generate_dataset import generate_complaints
        df = generate_complaints(5000)
        df.to_csv(data_path, index=False, encoding='utf-8')
    else:
        df = pd.read_csv(data_path, encoding='utf-8')
        
    print(f"Loaded dataset with {len(df)} samples across {df['category'].nunique()} categories.")
    
    # -------------------------------------------------------------
    # DATA PREPROCESSING & CLASS DISTRIBUTION INSPECTION
    # -------------------------------------------------------------
    df['cleaned_text'] = df['complaint_text'].apply(clean_text)
    
    # Extract structured & risk features for Priority Prediction
    struct_features_df = build_structured_features(df)
    for col in struct_features_df.columns:
        df[col] = struct_features_df[col]
        
    print("\n==================================================")
    print("CIVICPULSE AI PRIORITY CLASS DISTRIBUTION:")
    print("==================================================")
    prio_counts = df['priority'].value_counts()
    for p in ["LOW", "MEDIUM", "HIGH", "CRITICAL"]:
        print(f"{p}: {prio_counts.get(p, 0)} samples")
    print("==================================================\n")
    
    metrics = {
        "dataset_summary": {
            "total_samples": len(df),
            "num_categories": int(df['category'].nunique()),
            "num_subcategories": int(df['subcategory'].nunique() if 'subcategory' in df.columns else 0),
            "priority_distribution": {p: int(prio_counts.get(p, 0)) for p in ["LOW", "MEDIUM", "HIGH", "CRITICAL"]}
        }
    }
    
    # -------------------------------------------------------------
    # 1. MODEL 1: COMPLAINT CATEGORY CLASSIFICATION (30 CLASSES)
    # -------------------------------------------------------------
    print("--- 1. Training 30-Class Category Classification Model ---")
    X_cat = df['cleaned_text']
    y_cat = df['category']
    
    X_train, X_test, y_train, y_test = train_test_split(
        X_cat, y_cat, test_size=0.2, random_state=42, stratify=y_cat
    )
    
    cat_pipeline = Pipeline([
        ('tfidf', TfidfVectorizer(ngram_range=(1, 2), max_features=10000, sublinear_tf=True)),
        ('clf', LogisticRegression(C=3.0, max_iter=1000, random_state=42))
    ])
    
    cat_pipeline.fit(X_train, y_train)
    y_cat_pred = cat_pipeline.predict(X_test)
    
    cat_report = classification_report(y_test, y_cat_pred, output_dict=True, zero_division=0)
    print(f"Category Model Accuracy: {cat_report['accuracy'] * 100:.2f}%")
    print(f"Category Model Macro F1: {cat_report['macro avg']['f1-score'] * 100:.2f}%")
    
    joblib.dump(cat_pipeline, os.path.join(models_dir, "category_model.joblib"))
    metrics["category_model"] = {
        "accuracy": round(cat_report['accuracy'] * 100, 2),
        "macro_f1": round(cat_report['macro avg']['f1-score'] * 100, 2),
        "weighted_f1": round(cat_report['weighted avg']['f1-score'] * 100, 2),
        "classes": list(cat_pipeline.classes_)
    }
    
    # -------------------------------------------------------------
    # 2. MODEL 2: SUBCATEGORY PREDICTION MODEL
    # -------------------------------------------------------------
    if 'subcategory' in df.columns:
        print("\n--- 2. Training Subcategory Prediction Model ---")
        y_sub = df['subcategory']
        X_sub_train, X_sub_test, y_sub_train, y_sub_test = train_test_split(
            X_cat, y_sub, test_size=0.2, random_state=42, stratify=y_sub
        )
        
        sub_pipeline = Pipeline([
            ('tfidf', TfidfVectorizer(ngram_range=(1, 2), max_features=12000, sublinear_tf=True)),
            ('clf', LogisticRegression(C=2.5, max_iter=1000, random_state=42))
        ])
        sub_pipeline.fit(X_sub_train, y_sub_train)
        y_sub_pred = sub_pipeline.predict(X_sub_test)
        sub_report = classification_report(y_sub_test, y_sub_pred, output_dict=True, zero_division=0)
        print(f"Subcategory Model Accuracy: {sub_report['accuracy'] * 100:.2f}%")
        
        joblib.dump(sub_pipeline, os.path.join(models_dir, "subcategory_model.joblib"))
        metrics["subcategory_model"] = {
            "accuracy": round(sub_report['accuracy'] * 100, 2),
            "macro_f1": round(sub_report['macro avg']['f1-score'] * 100, 2),
            "classes_count": len(sub_pipeline.classes_)
        }
        
        # Save subcategories taxonomy mapping
        taxonomy = {}
        for cat, grp in df.groupby('category'):
            taxonomy[cat] = sorted(list(grp['subcategory'].unique()))
        with open(os.path.join(models_dir, "taxonomy.json"), "w", encoding='utf-8') as f:
            json.dump(taxonomy, f, indent=2)

    # -------------------------------------------------------------
    # 3. MODEL 3: REAL ML COMPLAINT PRIORITY CLASSIFIER
    # -------------------------------------------------------------
    print("\n--- 3. Training Real ML Priority Prediction Model (LOW, MEDIUM, HIGH, CRITICAL) ---")
    
    risk_feature_cols = [
        'immediate_danger', 'life_threat', 'injury_reported', 'violence_detected',
        'fire_detected', 'electrical_hazard', 'child_safety_risk', 'women_safety_risk',
        'crime_detected', 'cyber_fraud', 'major_health_risk', 'disaster_detected',
        'accident_risk', 'public_infrastructure_risk', 'large_population_affected',
        'log_affected', 'duration_days', 'safety_score'
    ]
    
    categorical_cols = ['location_type', 'severity', 'category']
    
    priority_feature_cols = ['cleaned_text'] + categorical_cols + risk_feature_cols
    X_priority = df[priority_feature_cols]
    y_priority = df['priority']
    
    X_p_train, X_p_test, y_p_train, y_p_test = train_test_split(
        X_priority, y_priority, test_size=0.2, random_state=42, stratify=y_priority
    )
    
    preprocessor = ColumnTransformer(
        transformers=[
            ('text', TfidfVectorizer(ngram_range=(1, 2), max_features=8000, sublinear_tf=True), 'cleaned_text'),
            ('cat', OneHotEncoder(handle_unknown='ignore'), categorical_cols),
            ('num', StandardScaler(), risk_feature_cols)
        ]
    )
    
    priority_pipeline = Pipeline([
        ('preprocessor', preprocessor),
        ('clf', LogisticRegression(C=2.5, class_weight='balanced', max_iter=1500, random_state=42))
    ])
    
    priority_pipeline.fit(X_p_train, y_p_train)
    y_p_pred = priority_pipeline.predict(X_p_test)
    
    p_report = classification_report(y_p_test, y_p_pred, output_dict=True, zero_division=0)
    p_cm = confusion_matrix(y_p_test, y_p_pred, labels=["LOW", "MEDIUM", "HIGH", "CRITICAL"])
    
    print("\n==================================================")
    print("PRIORITY MODEL EVALUATION REPORT:")
    print("==================================================")
    print(classification_report(y_p_test, y_p_pred, zero_division=0))
    print("\nCONFUSION MATRIX (Labels: [LOW, MEDIUM, HIGH, CRITICAL]):")
    print(p_cm)
    print(f"\nCRITICAL Recall: {p_report['CRITICAL']['recall'] * 100:.2f}%")
    print(f"HIGH Recall:     {p_report['HIGH']['recall'] * 100:.2f}%")
    print(f"Macro F1 Score:  {p_report['macro avg']['f1-score'] * 100:.2f}%")
    print(f"Weighted F1:     {p_report['weighted avg']['f1-score'] * 100:.2f}%")
    print(f"Overall Accuracy:{p_report['accuracy'] * 100:.2f}%")
    print("==================================================\n")
    
    joblib.dump(priority_pipeline, os.path.join(models_dir, "priority_model.joblib"))
    
    metrics["priority_model"] = {
        "accuracy": round(p_report['accuracy'] * 100, 2),
        "macro_f1": round(p_report['macro avg']['f1-score'] * 100, 2),
        "weighted_f1": round(p_report['weighted avg']['f1-score'] * 100, 2),
        "critical_recall": round(p_report['CRITICAL']['recall'] * 100, 2),
        "high_recall": round(p_report['HIGH']['recall'] * 100, 2),
        "classes": ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
        "confusion_matrix": p_cm.tolist(),
        "per_class_metrics": {
            cls: {
                "precision": round(p_report[cls]['precision'] * 100, 2),
                "recall": round(p_report[cls]['recall'] * 100, 2),
                "f1_score": round(p_report[cls]['f1-score'] * 100, 2),
                "support": p_report[cls]['support']
            }
            for cls in ["LOW", "MEDIUM", "HIGH", "CRITICAL"] if cls in p_report
        }
    }
    
    # -------------------------------------------------------------
    # 4. MODEL 4: DUPLICATE DETECTION TF-IDF VECTORIZER
    # -------------------------------------------------------------
    print("--- 4. Fitting Duplicate Detection TF-IDF Vectorizer ---")
    dup_vectorizer = TfidfVectorizer(ngram_range=(1, 2), max_features=12000, sublinear_tf=True)
    dup_vectorizer.fit(df['cleaned_text'])
    joblib.dump(dup_vectorizer, os.path.join(models_dir, "duplicate_vectorizer.joblib"))
    metrics["duplicate_engine"] = {
        "vocabulary_size": len(dup_vectorizer.vocabulary_),
        "similarity_algorithm": "Cosine Similarity + Haversine Geospatial Fusion"
    }
    
    # -------------------------------------------------------------
    # 5. MODEL 5: RESOLUTION TIME REGRESSION MODEL
    # -------------------------------------------------------------
    print("\n--- 5. Training Resolution Time Prediction Regressor ---")
    y_res = df['resolution_days']
    res_features = df[['category', 'priority', 'location_type', 'ward', 'affected_citizens', 'safety_score']]
    
    X_r_train, X_r_test, y_r_train, y_r_test = train_test_split(
        res_features, y_res, test_size=0.2, random_state=42
    )
    
    res_preprocessor = ColumnTransformer(
        transformers=[
            ('cat', OneHotEncoder(handle_unknown='ignore'), ['category', 'priority', 'location_type', 'ward']),
            ('num', StandardScaler(), ['affected_citizens', 'safety_score'])
        ]
    )
    
    res_pipeline = Pipeline([
        ('preprocessor', res_preprocessor),
        ('regressor', RandomForestRegressor(n_estimators=100, max_depth=12, random_state=42, n_jobs=-1))
    ])
    
    res_pipeline.fit(X_r_train, y_r_train)
    y_r_pred = res_pipeline.predict(X_r_test)
    
    mae = mean_absolute_error(y_r_test, y_r_pred)
    r2 = r2_score(y_r_test, y_r_pred)
    print(f"Resolution Time Regressor MAE: {mae:.2f} days, R2 Score: {r2:.3f}")
    
    joblib.dump(res_pipeline, os.path.join(models_dir, "resolution_model.joblib"))
    metrics["resolution_model"] = {
        "mean_absolute_error_days": round(mae, 2),
        "r2_score": round(r2, 3),
        "algorithm": "RandomForestRegressor"
    }
    
    # Save overall metrics for Admin ML Inspector & Viva reporting
    metrics_path = os.path.join(models_dir, "model_metrics.json")
    with open(metrics_path, "w", encoding='utf-8') as f:
        json.dump(metrics, f, indent=2)
        
    print(f"\n[SUCCESS] All 5 ML models successfully trained and serialized to: {models_dir}")
    print(f"[SUCCESS] Real evaluation metrics saved to: {metrics_path}")

if __name__ == "__main__":
    train_all_models()
