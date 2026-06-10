import json
import os
import re
from typing import Any, Dict, List, Optional

import requests
from dotenv import load_dotenv

load_dotenv()

GOOGLE_GEMINI_API_KEY = os.getenv('GOOGLE_GEMINI_API_KEY', '').strip()
GOOGLE_GEMINI_MODEL = os.getenv('GOOGLE_GEMINI_MODEL', 'gemini-pro-mini').strip()
GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta2/models'


def load_gemini_config() -> bool:
    """Load Gemini API configuration from environment variables."""
    return bool(GOOGLE_GEMINI_API_KEY and GOOGLE_GEMINI_MODEL)


def is_gemini_configured() -> bool:
    return bool(GOOGLE_GEMINI_API_KEY)


def _clean_json_from_text(raw_text: str) -> Optional[Dict[str, Any]]:
    start = raw_text.find('{')
    end = raw_text.rfind('}')
    if start == -1 or end == -1 or end <= start:
        return None

    candidate = raw_text[start:end + 1]
    try:
        return json.loads(candidate)
    except json.JSONDecodeError:
        return None


def _build_property_prompt(property_data: Dict[str, Any], city: str, predicted_price: int) -> str:
    city_name = city.strip() or 'Unknown city'
    details = [
        f"Location type: {property_data.get('location', 'Urban')}",
        f"City / area: {city_name}",
        f"Total area: {property_data.get('area', 0)} sq ft",
        f"Living area: {property_data.get('living_area', 0)} sq ft",
        f"Bedrooms: {property_data.get('bedrooms', 0)}",
        f"Bathrooms: {property_data.get('bathrooms', 0)}",
        f"Year built: {property_data.get('year_built', 0)}",
        f"Floor number: {property_data.get('floor', 0)}",
        f"Kitchens: {property_data.get('kitchens', 0)}",
        f"Balconies: {property_data.get('balcony_count', 0)}",
        f"Parking spaces: {property_data.get('parking_spaces', 0)}",
        f"Amenities count: {property_data.get('amenities_count', 0)}",
    ]
    amenities = property_data.get('amenities', [])
    if isinstance(amenities, list) and amenities:
        details.append(f"Amenities: {', '.join(amenities)}")

    prompt = (
        'You are an expert real estate advisor. ' 
        'A property prediction model has estimated the price for a home. ' 
        'Review the property details and the predicted price, then provide a clear response for a beginner audience. ' 
        'Use simple language and avoid technical jargon. ' 
        'Return only valid JSON with five keys: explanation, buy_recommendation, sell_recommendation, investment_analysis, key_factors. ' 
        'Each value should be a short paragraph or a list for key_factors. ' 
        'Do not include any extra text outside the JSON object.\n\n'
        'Property details:\n'
        f"{chr(10).join(details)}\n\n"
        f"Predicted price: ${predicted_price}\n\n"
        'Based on the predicted price and the property features, provide:\n'
        '- A simple price explanation\n'
        '- A buying recommendation\n'
        '- A selling recommendation\n'
        '- An investment potential analysis\n'
        '- The most important factors affecting the price\n'
    )
    return prompt


def _call_gemini_api(prompt_text: str) -> str:
    if not GOOGLE_GEMINI_API_KEY:
        raise ValueError('Gemini API key is not configured.')

    api_url = f'{GEMINI_BASE_URL}/{GOOGLE_GEMINI_MODEL}:generate'
    headers = {
        'Authorization': f'Bearer {GOOGLE_GEMINI_API_KEY}',
        'Content-Type': 'application/json'
    }
    body = {
        'prompt': {'text': prompt_text},
        'temperature': 0.35,
        'maxOutputTokens': 400
    }
    response = requests.post(api_url, headers=headers, json=body, timeout=25)
    response.raise_for_status()
    response_data = response.json()
    candidates = response_data.get('candidates', [])
    if not candidates:
        raise ValueError('Gemini returned no response candidates.')
    return candidates[0].get('content', '').strip()


def get_property_advice(property_data: Dict[str, Any], city: str, predicted_price: int) -> Dict[str, Any]:
    if not is_gemini_configured():
        return {
            'available': False,
            'message': 'Gemini API key not configured. Add GOOGLE_GEMINI_API_KEY to your .env file.'
        }

    prompt = _build_property_prompt(property_data, city, predicted_price)
    try:
        raw_response = _call_gemini_api(prompt)
        parsed = _clean_json_from_text(raw_response)
        if parsed and isinstance(parsed, dict):
            return {
                'available': True,
                'explanation': parsed.get('explanation', ''),
                'buy_recommendation': parsed.get('buy_recommendation', ''),
                'sell_recommendation': parsed.get('sell_recommendation', ''),
                'investment_analysis': parsed.get('investment_analysis', ''),
                'key_factors': parsed.get('key_factors', []),
                'raw_text': raw_response
            }

        return {
            'available': True,
            'explanation': raw_response,
            'buy_recommendation': '',
            'sell_recommendation': '',
            'investment_analysis': '',
            'key_factors': [],
            'raw_text': raw_response
        }
    except Exception as error:
        return {
            'available': False,
            'message': f'Gemini API error: {error}'
        }
