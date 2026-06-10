from joblib import load
m=load('model.pkl')
print(type(m))
print(hasattr(m,'predict'))
