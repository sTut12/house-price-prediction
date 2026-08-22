from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
from joblib import load
from pathlib import Path
import pandas as pd
import numpy as np
import os
from gemini_client import get_property_advice, load_gemini_config

app = Flask(__name__)
app.config['TEMPLATES_AUTO_RELOAD'] = True
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0
app.jinja_env.auto_reload = True
CORS(app)

MODEL_PATH = Path(__file__).parent / 'model.pkl'
model = None


def load_saved_model():
    global model
    if MODEL_PATH.exists():
        model = load(MODEL_PATH)
        print('✓ Model loaded successfully')
    else:
        print('⚠ WARNING: model.pkl not found. Please run model.py to generate the model.')


def sanitize_float(value, default=0.0):
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def sanitize_int(value, default=0):
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


def build_prediction_row(data):
    location = data.get('location', 'Urban')
    city = data.get('city', 'Unknown')
    area = sanitize_float(data.get('area', 0))
    living_area = sanitize_float(data.get('living_area', area))
    bedrooms = sanitize_int(data.get('bedrooms', 0))
    bathrooms = sanitize_float(data.get('bathrooms', 0))
    year_built = sanitize_int(data.get('year_built', 2020))
    floor = sanitize_int(data.get('floor', 1))
    kitchens = sanitize_int(data.get('kitchens', 0))
    balcony_count = sanitize_int(data.get('balcony_count', 0))
    parking_spaces = sanitize_int(data.get('parking_spaces', 0))
    amenities = data.get('amenities', [])
    if not isinstance(amenities, list):
        amenities = []

    amenities_count = len(amenities)
    feature_dict = {
        'location': location,
        'area': area,
        'living_area': living_area,
        'bedrooms': bedrooms,
        'bathrooms': bathrooms,
        'year_built': year_built,
        'floor': floor,
        'kitchens': kitchens,
        'balcony_count': balcony_count,
        'parking_spaces': parking_spaces,
        'amenities_count': amenities_count
    }
    return feature_dict, city


def build_market_response(city):
    city_name = city.strip() or 'Unknown'
    base_price = 215000 + len(city_name) * 1800
    demand_index = min(96, max(52, 55 + len(city_name) * 2))
    price_trend = 'rising' if demand_index > 68 else 'stable' if demand_index > 58 else 'cooling'
    top_localities = ['Downtown', 'Green Park', 'Riverside'] if not city_name else [f'{city_name} Central', f'{city_name} Heights', f'{city_name} Meadow']

    return {
        'city': city_name,
        'avg_price': int(base_price),
        'demand_index': int(demand_index),
        'price_trend': price_trend,
        'top_localities': top_localities
    }


@app.route('/')
def home():
    return render_template('index.html')


@app.route('/predict', methods=['POST'])
def predict():
    if model is None:
        return jsonify({'error': 'Model not loaded, run model.py first.'}), 500

    data = request.get_json(silent=True) or {}
    features, city = build_prediction_row(data)
    feature_df = pd.DataFrame([features])

    predicted = model.predict(feature_df)[0]
    predicted_price = int(round(predicted))
    area_value = features.get('area', 0)
    amenities_count = features.get('amenities_count', 0)
    price_per_sqft = int(round(predicted_price / area_value)) if area_value > 0 else 0
    confidence = min(98, max(72, int(80 + (area_value - 1500) * 0.005 + amenities_count * 1.2)))
    range_span = int(predicted_price * 0.08)

    response = {
        'predicted_price': predicted_price,
        'price_range': [predicted_price - range_span, predicted_price + range_span],
        'confidence': confidence,
        'price_per_sqft': price_per_sqft,
        'yoy_growth': round(3.2 + amenities_count * 0.3 + (confidence - 78) * 0.04, 1),
        'avg_sell_days': max(10, 35 - int((confidence - 72) * 0.8)),
        'invest_score': round(min(10, max(5.5, 6.5 + (confidence - 75) * 0.08)), 1),
        'trend': [62, 67, 69, 73, 76, 81],
        'similar': [
            {'name': 'Modern Family Home', 'beds': 3, 'baths': 2, 'area': 1800, 'type': 'Urban', 'price': predicted_price},
            {'name': 'Suburban Villa', 'beds': 4, 'baths': 3, 'area': 2200, 'type': 'Suburban', 'price': max(0, predicted_price - 35000)},
            {'name': 'Country Cottage', 'beds': 2, 'baths': 1, 'area': 1200, 'type': 'Rural', 'price': max(0, predicted_price - 140000)}
        ]
    }

    response['ai_advice'] = get_property_advice(features, city, predicted_price)

    return jsonify(response)


@app.route('/compare', methods=['POST'])
def compare():
    if model is None:
        return jsonify({'error': 'Model not loaded, run model.py first.'}), 500

    data = request.get_json(silent=True) or {}
    property_a = data.get('propertyA', {})
    property_b = data.get('propertyB', {})

    if not property_a or not property_b:
        return jsonify({'error': 'Missing compare properties.'}), 400

    features_a, _ = build_prediction_row({
        'location': property_a.get('location', 'Urban'),
        'city': property_a.get('city', 'Unknown'),
        'area': property_a.get('area', 1200),
        'bedrooms': property_a.get('bedrooms', 2),
        'bathrooms': property_a.get('bathrooms', 2),
        'year_built': property_a.get('year_built', 2018),
        'floor': property_a.get('floor', 1),
        'amenities': property_a.get('amenities', [])
    })
    features_b, _ = build_prediction_row({
        'location': property_b.get('location', 'Suburban'),
        'city': property_b.get('city', 'Unknown'),
        'area': property_b.get('area', 1200),
        'bedrooms': property_b.get('bedrooms', 2),
        'bathrooms': property_b.get('bathrooms', 2),
        'year_built': property_b.get('year_built', 2018),
        'floor': property_b.get('floor', 1),
        'amenities': property_b.get('amenities', [])
    })

    price_a = int(round(model.predict(pd.DataFrame([features_a]))[0]))
    price_b = int(round(model.predict(pd.DataFrame([features_b]))[0]))
    summary = 'Property A is more valuable.' if price_a > price_b else 'Property B is more valuable.'

    return jsonify({
        'propertyA_price': price_a,
        'propertyB_price': price_b,
        'summary': summary
    })


@app.route('/market', methods=['GET'])
def market():
    city = request.args.get('city', 'Unknown')
    data = build_market_response(city)
    return jsonify(data)


def get_reload_status():
    watched_files = [
        'templates/index.html',
        'static/style.css',
        'static/script.js',
        'app.py'
    ]
    status = {}
    for rel_path in watched_files:
        full_path = Path(__file__).parent / rel_path
        status[rel_path] = os.path.getmtime(full_path) if full_path.exists() else None
    return status


@app.route('/_live_reload', methods=['GET'])
def live_reload():
    return jsonify(get_reload_status())


if __name__ == '__main__':
    load_saved_model()
    load_gemini_config()
    app.run(debug=True, port=5000)
