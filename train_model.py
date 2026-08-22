import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.linear_model import LinearRegression
import pickle
import os

# Load the dataset
print("Loading dataset...")
df = pd.read_csv('dataset.csv')

print(f"Dataset shape: {df.shape}")
print(f"\nFirst few rows:")
print(df.head())

# Handle missing values
print("\n--- Handling Missing Values ---")
print("Missing values before:")
print(df.isnull().sum())

# Fill numerical missing values with mean
numerical_cols = df.select_dtypes(include=[np.number]).columns
for col in numerical_cols:
    df[col] = df[col].fillna(df[col].mean())

# Fill categorical missing values with mode
categorical_cols = df.select_dtypes(include='string').columns
for col in categorical_cols:
    if col != 'price':  # Don't fill the target variable
        df[col] = df[col].fillna(df[col].mode()[0])

print("Missing values after:")
print(df.isnull().sum())

# Separate features and target
print("\n--- Preparing Features and Target ---")
X = df.drop('price', axis=1)
y = df['price']

print(f"Features shape: {X.shape}")
print(f"Target shape: {y.shape}")

# Encode categorical variables
print("\n--- Encoding Categorical Variables ---")
label_encoders = {}
categorical_features = X.select_dtypes(include=['object']).columns

for col in categorical_features:
    le = LabelEncoder()
    X[col] = le.fit_transform(X[col])
    label_encoders[col] = le
    print(f"Encoded '{col}' with {len(le.classes_)} unique values")

# Split the data
print("\n--- Splitting Data ---")
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
print(f"Training set size: {X_train.shape[0]}")
print(f"Test set size: {X_test.shape[0]}")

# Standardize features
print("\n--- Standardizing Features ---")
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

# Train the model
print("\n--- Training Linear Regression Model ---")
model = LinearRegression()
model.fit(X_train_scaled, y_train)

# Evaluate the model
train_score = model.score(X_train_scaled, y_train)
test_score = model.score(X_test_scaled, y_test)

print(f"Training R² Score: {train_score:.4f}")
print(f"Testing R² Score: {test_score:.4f}")

# Save the model and preprocessing objects
print("\n--- Saving Model ---")
model_data = {
    'model': model,
    'scaler': scaler,
    'label_encoders': label_encoders,
    'feature_names': X.columns.tolist()
}

with open('model.pkl', 'wb') as f:
    pickle.dump(model_data, f)

print("✓ Model saved as 'model.pkl'")
print("\nTraining complete! The model is ready for predictions.")
