import json
import os
import re
from typing import Any, Dict, Optional

import requests
from dotenv import load_dotenv


# ============================================================
# LOAD ENVIRONMENT VARIABLES
# ============================================================

load_dotenv()


GOOGLE_GEMINI_API_KEY = os.getenv(
    "GOOGLE_GEMINI_API_KEY",
    ""
).strip()


GOOGLE_GEMINI_MODEL = os.getenv(
    "GOOGLE_GEMINI_MODEL",
    "gemini-3.6-flash"
).strip()


GEMINI_BASE_URL = (
    "https://generativelanguage.googleapis.com/v1beta/models"
)


# ============================================================
# GEMINI CONFIGURATION
# ============================================================

def load_gemini_config() -> bool:
    return bool(
        GOOGLE_GEMINI_API_KEY
        and GOOGLE_GEMINI_MODEL
    )


def is_gemini_configured() -> bool:
    return bool(GOOGLE_GEMINI_API_KEY)


# ============================================================
# CLEAN GEMINI JSON RESPONSE
# ============================================================

def _clean_json_from_text(
    raw_text: str
) -> Optional[Dict[str, Any]]:

    if not raw_text:
        return None

    text = raw_text.strip()

    # Remove markdown code fences
    text = re.sub(
        r"```json\s*",
        "",
        text,
        flags=re.IGNORECASE
    )

    text = re.sub(
        r"```\s*",
        "",
        text
    )

    text = text.strip()

    # --------------------------------------------------------
    # Try direct JSON
    # --------------------------------------------------------

    try:
        result = json.loads(text)

        if isinstance(result, dict):
            return result

    except (json.JSONDecodeError, TypeError):
        pass

    # --------------------------------------------------------
    # Try extracting JSON object
    # --------------------------------------------------------

    start = text.find("{")
    end = text.rfind("}")

    if start != -1 and end != -1 and end > start:

        candidate = text[start:end + 1]

        try:
            result = json.loads(candidate)

            if isinstance(result, dict):
                return result

        except (json.JSONDecodeError, TypeError):
            pass

    return None


# ============================================================
# BUILD PROPERTY ADVISOR PROMPT
# ============================================================

def _build_property_prompt(
    property_data: Dict[str, Any],
    city: str,
    predicted_price: int
) -> str:

    city_name = city.strip() or "Unknown city"

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

    amenities = property_data.get("amenities", [])

    if isinstance(amenities, list) and amenities:
        details.append(
            "Amenities: "
            + ", ".join(str(item) for item in amenities)
        )

    prompt = (
        "You are an expert real estate advisor.\n\n"

        "Analyze the property details and predicted price.\n"
        "Give simple and useful advice for a beginner.\n\n"

        "IMPORTANT:\n"
        "Return ONLY one valid JSON object.\n"
        "Do not use markdown.\n"
        "Do not use code fences.\n"
        "Do not add text before or after the JSON.\n\n"

        "The JSON must contain exactly these keys:\n"
        "explanation\n"
        "buy_recommendation\n"
        "sell_recommendation\n"
        "investment_analysis\n"
        "key_factors\n\n"

        "Rules:\n"
        "1. explanation must contain maximum 2 short sentences.\n"
        "2. buy_recommendation must contain maximum 2 short sentences.\n"
        "3. sell_recommendation must contain maximum 2 short sentences.\n"
        "4. investment_analysis must contain maximum 2 short sentences.\n"
        "5. key_factors must contain exactly 5 short strings.\n\n"

        "Property details:\n"
        + "\n".join(details)

        + "\n\n"

        f"Predicted price: ${predicted_price}\n\n"

        "Return exactly this JSON structure:\n"

        "{"
        '"explanation": "Short explanation",'
        '"buy_recommendation": "Short buying advice",'
        '"sell_recommendation": "Short selling advice",'
        '"investment_analysis": "Short investment analysis",'
        '"key_factors": ['
        '"Factor 1",'
        '"Factor 2",'
        '"Factor 3",'
        '"Factor 4",'
        '"Factor 5"'
        "]"
        "}"
    )

    return prompt


# ============================================================
# CALL GEMINI API
# ============================================================

def _call_gemini_api(prompt_text: str) -> str:

    if not GOOGLE_GEMINI_API_KEY:
        raise ValueError(
            "Gemini API key is not configured."
        )

    # Use Gemini 3.6 Flash
    model = GOOGLE_GEMINI_MODEL or "gemini-3.6-flash"

    # Correct Gemini REST endpoint
    api_url = (
        f"{GEMINI_BASE_URL}/"
        f"{model}:generateContent"
    )

    headers = {
        "Content-Type": "application/json",
        "x-goog-api-key": GOOGLE_GEMINI_API_KEY,
    }

    body = {
        "contents": [
            {
                "parts": [
                    {
                        "text": prompt_text
                    }
                ]
            }
        ],
        "generationConfig": {
            "maxOutputTokens": 1500,
            "responseMimeType": "application/json"
        }
    }

    # --------------------------------------------------------
    # Make API request
    # --------------------------------------------------------

    try:

        response = requests.post(
            api_url,
            headers=headers,
            json=body,
            timeout=(10, 45)
        )

    except requests.exceptions.Timeout as error:

        raise RuntimeError(
            f"Gemini connection timed out: {error}"
        )

    except requests.exceptions.ConnectionError as error:

        raise RuntimeError(
            f"Could not connect to Gemini API: {error}"
        )

    except requests.exceptions.RequestException as error:

        raise RuntimeError(
            f"Gemini network error: {error}"
        )

    # --------------------------------------------------------
    # Check API response
    # --------------------------------------------------------

    if not response.ok:

        raise RuntimeError(
            f"Gemini API error {response.status_code}: "
            f"{response.text}"
        )

    # --------------------------------------------------------
    # Parse JSON response
    # --------------------------------------------------------

    try:

        response_data = response.json()

    except ValueError:

        raise RuntimeError(
            f"Gemini returned invalid JSON: {response.text}"
        )

    # --------------------------------------------------------
    # Get candidates
    # --------------------------------------------------------

    candidates = response_data.get(
        "candidates",
        []
    )

    if not candidates:

        raise ValueError(
            "Gemini returned no response candidates."
        )

    # --------------------------------------------------------
    # Get response parts
    # --------------------------------------------------------

    parts = (
        candidates[0]
        .get("content", {})
        .get("parts", [])
    )

    if not parts:

        raise ValueError(
            "Gemini returned an empty response."
        )

    # --------------------------------------------------------
    # Extract text
    # --------------------------------------------------------

    text_parts = []

    for part in parts:

        text = part.get(
            "text",
            ""
        )

        if text:
            text_parts.append(text)

    result = "".join(
        text_parts
    ).strip()

    if not result:

        raise ValueError(
            "Gemini returned an empty text response."
        )

    return result


# ============================================================
# GET PROPERTY ADVICE
# ============================================================

def get_property_advice(
    property_data: Dict[str, Any],
    city: str,
    predicted_price: int
) -> Dict[str, Any]:

    # --------------------------------------------------------
    # Check Gemini configuration
    # --------------------------------------------------------

    if not is_gemini_configured():

        return {
            "available": False,

            "message": (
                "Gemini API key not configured. "
                "Add GOOGLE_GEMINI_API_KEY "
                "to your .env file."
            )
        }

    # --------------------------------------------------------
    # Build prompt
    # --------------------------------------------------------

    prompt = _build_property_prompt(
        property_data,
        city,
        predicted_price
    )

    # --------------------------------------------------------
    # Call Gemini
    # --------------------------------------------------------

    try:

        raw_response = _call_gemini_api(
            prompt
        )

        print(
            "RAW GEMINI RESPONSE:",
            repr(raw_response)
        )

        # ----------------------------------------------------
        # Parse JSON
        # ----------------------------------------------------

        parsed = _clean_json_from_text(
            raw_response
        )

        if parsed and isinstance(parsed, dict):

            key_factors = parsed.get(
                "key_factors",
                []
            )

            if not isinstance(
                key_factors,
                list
            ):

                key_factors = [
                    str(key_factors)
                ]

            return {
                "available": True,

                "explanation": str(
                    parsed.get(
                        "explanation",
                        ""
                    )
                ),

                "buy_recommendation": str(
                    parsed.get(
                        "buy_recommendation",
                        ""
                    )
                ),

                "sell_recommendation": str(
                    parsed.get(
                        "sell_recommendation",
                        ""
                    )
                ),

                "investment_analysis": str(
                    parsed.get(
                        "investment_analysis",
                        ""
                    )
                ),

                "key_factors": key_factors,

                "raw_text": raw_response
            }

        # ----------------------------------------------------
        # Fallback if JSON parsing fails
        # ----------------------------------------------------

        return {
            "available": True,

            "explanation": raw_response,

            "buy_recommendation": "",

            "sell_recommendation": "",

            "investment_analysis": "",

            "key_factors": [],

            "raw_text": raw_response
        }

    # --------------------------------------------------------
    # Handle errors
    # --------------------------------------------------------

    except Exception as error:

        print(
            "GEMINI ERROR:",
            repr(error)
        )

        return {
            "available": False,

            "message": (
                f"Gemini API error: {error}"
            )
        }