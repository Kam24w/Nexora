from flask import Flask, jsonify
from flask_cors import CORS

from main import run_diagnosis


app = Flask(__name__)

CORS(app, origins=["http://localhost:5173"])


@app.post("/diagnose")
def diagnose():
    diagnosis = run_diagnosis()
    return jsonify(diagnosis)


if __name__ == "__main__":
    app.run(debug=True)