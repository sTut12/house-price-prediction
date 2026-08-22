import pandas as pd
import numpy as np
from pathlib import Path
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.compose import ColumnTransformer
from sklearn.metrics import r2_score
from joblib import dump

DATA_PATH = Path(__file__).parent / 'data' / 'houses.csv'
MODEL_PATH = Path(__file__).parent / 'model.pkl'

print('Loading dataset...')
df = pd.read_csv(DATA_PATH)
print(f'Dataset rows: {len(df)}')
print(df.head())

features = ['location', 'area', 'bedrooms', 'bathrooms', 'year_built', 'floor', 'amenities_count']
X = df[features]
y = df['price']

# Build preprocessing pipeline
numeric_features = ['area', 'bedrooms', 'bathrooms', 'year_built', 'floor', 'amenities_count']
cat_features = ['location']

numeric_transformer = StandardScaler()
cat_transformer = OneHotEncoder(handle_unknown='ignore')

preprocessor = ColumnTransformer(
    transformers=[
        ('num', numeric_transformer, numeric_features),
        ('cat', cat_transformer, cat_features)
    ]
)

pipeline = Pipeline([
    ('preprocessor', preprocessor),
    ('model', RandomForestRegressor(n_estimators=150, random_state=42, n_jobs=-1))
])

print('Training model...')
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
pipeline.fit(X_train, y_train)

preds = pipeline.predict(X_test)
train_score = pipeline.score(X_train, y_train)
test_score = pipeline.score(X_test, y_test)
print(f'Training R^2: {train_score:.4f}')
print(f'Test R^2: {test_score:.4f}')

print('Saving trained model...')
dump(pipeline, MODEL_PATH)
print(f'Model saved to {MODEL_PATH}')
print('Done.')
