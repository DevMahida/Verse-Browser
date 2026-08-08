import os
import requests

api_key = os.environ.get("OPENROUTER_API_KEY")

def test_model(payload):
    res = requests.post(
        "https://openrouter.ai/api/v1/chat/completions",
        headers={"Authorization": f"Bearer {api_key}"},
        json=payload
    )
    print(f"Status: {res.status_code}")
    print(f"Response: {res.text}")

print("Test 1: System and User")
test_model({
    "model": "google/lyria-3-pro-preview",
    "messages": [
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "hi"}
    ]
})

print("\nTest 2: Only User")
test_model({
    "model": "google/lyria-3-pro-preview",
    "messages": [
        {"role": "user", "content": "hi"}
    ]
})
