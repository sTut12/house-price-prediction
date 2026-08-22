# 🏠 House Price Prediction with Google Gemini AI Advisor

![Python](https://img.shields.io/badge/Python-3.11-blue?logo=python&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-3.1.3-black?logo=flask&logoColor=white)
![Google Gemini](https://img.shields.io/badge/Google%20Gemini-AI-blue?logo=google&logoColor=white)
![Machine Learning](https://img.shields.io/badge/Machine%20Learning-scikit--learn-green)

## Project Overview

This project is a production-ready real estate solution that predicts house prices using a trained machine learning model and enriches the result with Google Gemini AI insights. It preserves the existing prediction model while adding an `AI Property Advisor` section that explains price, gives buy/sell recommendations, and highlights investment potential.

This version is designed for Google Gen AI Academy APAC submission and real-world demonstration.

---

## Problem Statement

Property buyers and investors need fast, trustworthy guidance when evaluating home prices. This app solves that need by combining a reliable ML price prediction model with Google Gemini-powered advisory insights, making property evaluation easier for non-technical users.

---

## Project Objectives

- Preserve the existing machine learning model and prediction pipeline
- Integrate Google Gemini API via a beginner-friendly REST approach
- Display prediction results and advisory insights in a clean UI
- Allow demo-ready real estate recommendations for buyers and sellers
- Keep the project simple and suitable for BCA final presentation

---

## Google Technology Stack Used

- Google Gemini API (via Google AI Studio credentials)
- Python Flask backend
- scikit-learn machine learning model
- pandas and numpy for data processing
- HTML, CSS, and JavaScript frontend
- dotenv for secure environment variable management

---

## Updated Project Structure

```
house price prediction/
├── app.py
├── gemini_client.py
├── train_model.py
├── dataset.csv
├── model.pkl
├── requirements.txt
├── .env.example
├── README.md
├── run.bat
├── templates/
│   └── index.html
└── static/
    ├── style.css
    └── script.js
```

---

## Required Libraries

- Flask
- Flask-CORS
- joblib
- numpy
- pandas
- scikit-learn
- scipy
- requests
- python-dotenv

---

## Installation Steps

1. Clone the repository:

```bash
git clone https://github.com/your-username/house-price-prediction.git
cd house-price-prediction
```

2. Create a virtual environment:

```bash
python -m venv .venv
```

3. Activate the environment:

**Windows**
```powershell
.\.venv\Scripts\Activate.ps1
```

**macOS / Linux**
```bash
source .venv/bin/activate
```

4. Install dependencies:

```bash
pip install -r requirements.txt
```

5. Copy `.env.example` to `.env` and add your Gemini values:

```powershell
copy .env.example .env
```

6. Update `.env` with:

```text
GOOGLE_GEMINI_API_KEY=your_google_gemini_api_key_here
GOOGLE_GEMINI_MODEL=gemini-pro-mini
```

7. Train the model if necessary:

```bash
python train_model.py
```

8. Run the app:

```bash
python app.py
```

9. Open the browser:

```text
http://localhost:5000
```

---

## Gemini API Integration Code

- `gemini_client.py` contains the Gemini REST integration and prompt builder
- `app.py` loads the model and adds `ai_advice` to the prediction response
- UI updates in `templates/index.html` and `static/script.js` render advisory insights
- `.env.example` documents required environment variables for secure key management

---

## How the System Works

1. User enters property attributes in the web form
2. Flask backend loads `model.pkl` and predicts the house price
3. The prediction response is sent back to the browser
4. The backend also sends prediction details to Google Gemini
5. Gemini returns:
   - a simple price explanation
   - a buy recommendation
   - a sell recommendation
   - investment potential analysis
   - key factors affecting the price
6. The frontend displays the results in the `AI Property Advisor` panel

---

## Future Scope

- Add local comparables and neighborhood analytics
- Support additional features like parking type, renovation cost, or plot size
- Add a persistent database for saved predictions
- Deploy on Google Cloud Run or App Engine
- Add charts for trends, ROI, and market comparison

---

## Viva Questions and Answers

**Q1: What is the main purpose of this project?**
A1: It predicts house prices using machine learning and provides advisory insights through Google Gemini.

**Q2: How does Gemini integrate with the app?**
A2: `gemini_client.py` sends a property prompt to Gemini and returns structured advice to the Flask backend.

**Q3: Why is `.env` used?**
A3: To keep sensitive API keys out of source control and support secure configuration.

**Q4: Which file is responsible for the ML model?**
A4: `train_model.py` trains the model and saves `model.pkl`; `app.py` loads the model for prediction.

**Q5: How does the app maintain the original model functionality?**
A5: The existing prediction flow remains unchanged, and Gemini integration only adds optional advisory output.

---

## LinkedIn Post for Project Submission

I’m excited to share my latest project: **House Price Prediction with Google Gemini AI Advisor**! 🏡🤖

This app combines a trained machine learning model with Google Gemini to predict property values and deliver clear advice for buyers and sellers. It is designed to demonstrate a real-world AI solution with a polished web UI, machine learning backend, and generative AI insights.

#GoogleGenAI #MachineLearning #Flask #Python #RealEstateAI #BCAProject

---

## Notes

- Retain `model.pkl` for prediction
- Use `.env` for API keys
- The AI advisor is displayed when Gemini is configured correctly

---

## Author

**Your Name**

- GitHub: [your-username](https://github.com/your-username)
- Email: your.email@example.com

✅ Well-documented
✅ Sample dataset included
✅ Easy to customize

---

**Happy Predicting! 🎉**
