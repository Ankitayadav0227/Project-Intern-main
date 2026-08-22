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

CORS(app, resources={r"/*": {"origins": "*"}})


# =========================================================
# UPLOADS
# =========================================================

UPLOAD_FOLDER = os.path.join(
    os.path.dirname(__file__),
    "uploads"
)

app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(
    os.path.join(UPLOAD_FOLDER, "messages"),
    exist_ok=True
)


# =========================================================
# DATABASE INITIALIZATION
# =========================================================

def initialize_with_retry():

    print("Starting database initialization...")

    print(
        "Database host:",
        DB_CONFIG.get("host")
    )

    print(
        "Database user:",
        DB_CONFIG.get("user")
    )

    print(
        "Database:",
        DB_CONFIG.get("database")
    )

    print(
        "Database password:",
        "Configured"
        if DB_CONFIG.get("password")
        else "Missing"
    )

    # If configuration is missing, don't crash Flask
    required = [
        "host",
        "user",
        "password",
        "database"
    ]

    missing = [
        key
        for key in required
        if not DB_CONFIG.get(key)
    ]

    if missing:

        print(
            "WARNING: Missing database configuration:",
            missing
        )

        print(
            "Flask will continue running."
        )

        return False


    # Try database connection several times

    for attempt in range(1, 6):

        try:

            initialize_database()

            print(
                "DATABASE INITIALIZATION SUCCESS"
            )

            return True

        except Exception as exc:

            print(
                f"Database initialization attempt "
                f"{attempt}/5 failed:"
            )

            print(exc)

            if attempt < 5:

                time.sleep(3)


    print(
        "WARNING: MySQL initialization failed."
    )

    print(
        "Flask will continue running."
    )

    return False


# IMPORTANT:
# Database failure should NOT stop Flask

initialize_with_retry()


# =========================================================
# BLUEPRINTS
# =========================================================

app.register_blueprint(auth_bp)
app.register_blueprint(admin_bp)
app.register_blueprint(intern_bp)
app.register_blueprint(attendance_bp)
app.register_blueprint(leave_bp)
app.register_blueprint(messages_bp)


# =========================================================
# FRONTEND
# =========================================================

FRONTEND_FOLDER = os.path.abspath(
    os.path.join(
        os.path.dirname(__file__),
        "../frontend/dist"
    )
)


# =========================================================
# API HOME
# =========================================================

@app.route("/api")
def api_home():

    return jsonify({
        "success": True,
        "message": "Intern Management API Running"
    })


# =========================================================
# HEALTH
# =========================================================

@app.route("/health")
def health():

    try:

        status = database_status()

        required_tables = {
            "admins",
            "interns",
            "work_logs",
            "attendance",
            "leave_requests",
            "messages"
        }

        existing_tables = set(
            status.get("tables", [])
        )

        missing = sorted(
            required_tables - existing_tables
        )

        return jsonify({

            "success": len(missing) == 0,

            "database": status.get(
                "database"
            ),

            "tables": status.get(
                "tables"
            ),

            "missing_tables": missing

        }), (200 if not missing else 503)


    except Exception as exc:

        return jsonify({

            "success": False,

            "message": str(exc)

        }), 503


# =========================================================
# TEST DATABASE
# =========================================================

@app.route("/test-db")
def test_db():

    try:

        status = database_status()

        return jsonify({

            "status": "Success",

            **status

        })


    except Exception as exc:

        return jsonify({

            "status": "Failed",

            "error": str(exc)

        }), 500


# =========================================================
# UPLOAD FILE
# =========================================================

@app.route("/uploads/<path:filename>")
def uploaded_file(filename):

    return send_from_directory(
        app.config["UPLOAD_FOLDER"],
        filename
    )


# =========================================================
# PROFILE IMAGE
# =========================================================

@app.route(
    "/upload-profile/<int:intern_id>",
    methods=["POST"]
)
def upload_profile(intern_id):

    try:

        file = request.files.get(
            "profile_image"
        )

        if not file or not file.filename:

            return jsonify({
                "success": False,
                "message": "No file selected"
            }), 400


        filename = secure_filename(
            file.filename
        )

        filename = f"{intern_id}_{filename}"

        filepath = os.path.join(
            app.config["UPLOAD_FOLDER"],
            filename
        )

        file.save(filepath)

        image_path = f"uploads/{filename}"


        from db import get_connection

        conn = get_connection()

        cursor = conn.cursor()

        try:

            cursor.execute(
                """
                UPDATE interns
                SET profile_image=%s
                WHERE intern_id=%s
                """,
                (
                    image_path,
                    intern_id
                )
            )

            conn.commit()

        finally:

            cursor.close()
            conn.close()


        return jsonify({

            "success": True,

            "message":
                "Profile image uploaded successfully",

            "image_path":
                image_path

        })


    except Exception as exc:

        return jsonify({

            "success": False,

            "message": str(exc)

        }), 500


# =========================================================
# REACT ROUTER
# =========================================================

@app.route(
    "/",
    defaults={"path": ""}
)
@app.route(
    "/<path:path>"
)
def serve_react(path):

    file_path = os.path.join(
        FRONTEND_FOLDER,
        path
    )

    if path and os.path.isfile(file_path):

        return send_from_directory(
            FRONTEND_FOLDER,
            path
        )

    return send_from_directory(
        FRONTEND_FOLDER,
        "index.html"
    )


# =========================================================
# START FLASK
# =========================================================

if __name__ == "__main__":

    port = int(
        os.environ.get(
            "PORT",
            5000
        )
    )

    print(
        f"Starting Flask on port {port}"
    )

    app.run(
        host="0.0.0.0",
        port=port
    )