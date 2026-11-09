# backend/check_gemini.py
import json
import urllib.error
import urllib.request

from django.conf import settings

CANDIDATES = [
    "gemini-flash-latest",
    "gemini-3-flash-preview",
    "gemini-3.5-flash",
    "gemini-3.1-flash-lite",
    "gemini-2.5-flash-lite",
]

body = json.dumps({"contents": [{"parts": [{"text": "Reply with the word OK."}]}]}).encode("utf-8")

for model in CANDIDATES:
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
    req = urllib.request.Request(
        url,
        data=body,
        headers={
            "Content-Type": "application/json",
            "x-goog-api-key": settings.GEMINI_API_KEY,
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            json.load(resp)
            print(f"WORKS  {model}")
    except urllib.error.HTTPError as exc:
        message = exc.read().decode("utf-8", errors="replace")[:150].replace("\n", " ")
        print(f"FAILS  {model}  HTTP {exc.code}: {message}")
    except Exception as exc:
        print(f"ERROR  {model}  {exc}")