@echo off
setlocal
if not exist .venv\Scripts\python.exe (
  echo Virtual environment not found. Create one using:
  echo python -m venv .venv
  pause
  exit /b 1
)
.venv\Scripts\python.exe app.py
