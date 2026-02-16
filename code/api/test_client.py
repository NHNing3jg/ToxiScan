import requests

URL = "http://127.0.0.1:8000/predict"
payload = {"text": "You are stupid and I hate you"}

r = requests.post(URL, json=payload)
print(r.status_code)
print(r.json())
