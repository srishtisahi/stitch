import os
from pathlib import Path

from dotenv import load_dotenv
from flask import Flask, send_from_directory


BASE_DIR = Path(__file__).resolve().parent
STATIC_DIR = BASE_DIR / "static"

load_dotenv(BASE_DIR / ".env")

app = Flask(__name__, static_folder=str(STATIC_DIR), static_url_path="/static")


@app.get("/")
def index():
    return send_from_directory(STATIC_DIR, "index.html")


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", "3000")), debug=True)
