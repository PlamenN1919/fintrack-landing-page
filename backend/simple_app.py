"""
Simple Flask app for testing Railway deployment
"""
from flask import Flask, jsonify
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app, origins=['*'])

@app.route('/')
def index():
    return jsonify({
        'service': 'FinTrack Backend',
        'status': 'running',
        'version': '1.0.0'
    })

@app.route('/health')
def health():
    # Simple health check without database
    return jsonify({
        'status': 'healthy',
        'message': 'Backend is running'
    })

@app.route('/api/health')
def api_health():
    return health()

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    app.run(host='0.0.0.0', port=port)

