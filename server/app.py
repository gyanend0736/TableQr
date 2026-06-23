import os
from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

from routes.menu import menu_bp
from routes.orders import orders_bp
from routes.admin import admin_bp

app = Flask(__name__)

origins = os.environ.get("CORS_ORIGINS", "http://localhost:5173").split(",")
CORS(app, resources={r"/api/*": {"origins": origins}})

app.register_blueprint(menu_bp, url_prefix="/api")
app.register_blueprint(orders_bp, url_prefix="/api")
app.register_blueprint(admin_bp, url_prefix="/api")


@app.get("/api/health")
def health():
    return jsonify({"status": "ok"})


@app.errorhandler(400)
@app.errorhandler(401)
@app.errorhandler(404)
@app.errorhandler(500)
def handle_error(error):
    return jsonify({"error": error.description}), error.code


if __name__ == "__main__":
    port = int(os.environ.get("FLASK_PORT", 5000))
    app.run(debug=True, port=port)
