
#NetSage AI - app.py

#Run this file from the netsage-ai folder:

#python app.py

#Then open:
#http://127.0.0.1:5000


import csv
import os
from pathlib import Path

from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS

from ai import diagnose


BASE_DIR = Path(__file__).resolve().parent
PROMPTS_DIR = BASE_DIR / "prompts" / "dashboard"
DATA_DIR = BASE_DIR / "data"

app = Flask(__name__, static_folder=str(PROMPTS_DIR))
CORS(app)


@app.route("/")
def index():
    """Serves the main dashboard HTML interface."""
    return send_from_directory(PROMPTS_DIR, "dashboard.html")


@app.route("/<path:filename>")
def serve_static(filename):
    """Serves associated static files (styles.css, script.js, images)."""
    return send_from_directory(PROMPTS_DIR, filename)


@app.route("/api/cases", methods=["GET"])
def get_cases():
    """Returns the list of 30 built-in cases from acceptablecses.csv."""
    cases = []
    csv_candidates = [
        DATA_DIR / "acceptable_cases.csv",
        BASE_DIR / "acceptablecses.csv",
        DATA_DIR / "acceptablecses.csv",
    ]

    csv_path = None
    for candidate in csv_candidates:
        if candidate.exists():
            csv_path = candidate
            break

    if csv_path:
        with open(csv_path, newline="", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                cases.append(row)

    return jsonify({"success": True, "total_cases": len(cases), "cases": cases})


@app.route("/api/diagnose", methods=["POST"])
def run_diagnosis():
    """
    Receives user symptoms & Cisco CLI outputs, runs the diagnostic engine,
    and returns fault summary, confidence score, and remediation commands.
    """
    data = request.get_json() or {}
    symptom = data.get("symptom", "")
    cisco_output = data.get("cisco_output", "")

    # Calls the diagnose module from the ai folder
    if hasattr(diagnose, "NetSageDiagnoser"):
        diagnoser = diagnose.NetSageDiagnoser()
        result = diagnoser.diagnose(symptom, cisco_output)
    elif hasattr(diagnose, "diagnose"):
        result = diagnose.diagnose(symptom, cisco_output)
    else:
        result = {
            "success": False,
            "error": "Diagnostic engine function not available.",
        }

    return jsonify(result)


if __name__ == "__main__":
    print("Starting NetSage AI Server...")
    print("Dashboard available at: http://127.0.0.1:5000")
    app.run(host="127.0.0.1", port=5000, debug=True)