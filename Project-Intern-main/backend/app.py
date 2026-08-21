from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename

from routes.auth import auth_bp
from routes.intern import intern_bp
from routes.admin import admin_bp
from routes.attendance import attendance_bp
from routes.leave import leave_bp
from routes.messages import messages_bp
from db import initialize_database, database_status, DB_CONFIG

import os
import time

app = Flask(__name__)

# The frontend and backend are served by the same Railway service in
# production, while CORS remains enabled for local development.
CORS(app, resources={r"/*": {"origins": "*"}})

UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), "uploads")
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(os.path.join(UPLOAD_FOLDER, "messages"), exist_ok=True)


# Initialize the Railway database before accepting requests. Railway's MySQL
# service can take a few seconds to become ready, so retry briefly.
def initialize_with_retry():
    if not all(DB_CONFIG.get(key) for key in ("host", "user", "password", "database")):
        print("Database environment variables are not configured; skipping startup schema initialization.")
        return

    last_error = None
    for attempt in range(1, 11):
        try:
            initialize_database()
            print("Database schema is ready.")
            return
        except Exception as exc:
            last_error = exc
            print(f"Database initialization attempt {attempt}/10 failed: {exc}")
            if attempt < 10:
                time.sleep(3)
    print("WARNING: Database initialization failed after retries:", last_error)


initialize_with_retry()

app.register_blueprint(auth_bp)
app.register_blueprint(admin_bp)
app.register_blueprint(intern_bp)
app.register_blueprint(attendance_bp)
app.register_blueprint(leave_bp)
app.register_blueprint(messages_bp)

FRONTEND_FOLDER = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "../frontend/dist")
)


@app.route("/api")
def api_home():
    return jsonify({
        "success": True,
        "message": "Intern Management API Running"
    })


@app.route("/health")
def health():
    try:
        status = database_status()
        required = {
            "admins",
            "interns",
            "work_logs",
            "attendance",
            "leave_requests",
            "messages",
        }
        missing = sorted(required - set(status["tables"]))
        return jsonify({
            "success": not missing,
            "database": status["database"],
            "tables": status["tables"],
            "missing_tables": missing,
        }), (200 if not missing else 503)
    except Exception as exc:
        return jsonify({
            "success": False,
            "message": str(exc),
        }), 503


@app.route("/test-db")
def test_db():
    try:
        status = database_status()
        return jsonify({
            "status": "Success",
            **status,
        })
    except Exception as exc:
        return jsonify({
            "status": "Failed",
            "error": str(exc),
        }), 500


@app.route("/uploads/<path:filename>")
def uploaded_file(filename):
    return send_from_directory(app.config["UPLOAD_FOLDER"], filename)


@app.route("/upload-profile/<int:intern_id>", methods=["POST"])
def upload_profile(intern_id):
    try:
        file = request.files.get("profile_image")
        if not file or not file.filename:
            return jsonify({"success": False, "message": "No file selected"}), 400

        filename = secure_filename(file.filename)
        filename = f"{intern_id}_{filename}"
        filepath = os.path.join(app.config["UPLOAD_FOLDER"], filename)
        file.save(filepath)

        image_path = f"uploads/{filename}"

        from db import get_connection
        conn = get_connection()
        cursor = conn.cursor()
        try:
            cursor.execute(
                "UPDATE interns SET profile_image=%s WHERE intern_id=%s",
                (image_path, intern_id),
            )
            conn.commit()
        finally:
            cursor.close()
            conn.close()

        return jsonify({
            "success": True,
            "message": "Profile image uploaded successfully",
            "image_path": image_path,
        })
    except Exception as exc:
        return jsonify({"success": False, "message": str(exc)}), 500


# React Router fallback. API/blueprint routes are registered before this
# catch-all, so /api, /login, /attendance, etc. are not swallowed.
@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_react(path):
    file_path = os.path.join(FRONTEND_FOLDER, path)
    if path and os.path.isfile(file_path):
        return send_from_directory(FRONTEND_FOLDER, path)
    return send_from_directory(FRONTEND_FOLDER, "index.html")


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
