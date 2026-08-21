from flask import Blueprint, request, jsonify, current_app
from db import get_connection
from werkzeug.utils import secure_filename

import os


intern_bp = Blueprint("intern", __name__)


# ---------------- ADD WORK LOG ----------------
@intern_bp.route("/worklog", methods=["POST"])
def add_worklog():
    try:
        # Get form data
        data = request.form

        # Get uploaded file
        file = request.files.get("file")

        filename = None

        if file and file.filename != "":
            filename = secure_filename(file.filename)

            file.save(
                os.path.join(
                    current_app.config["UPLOAD_FOLDER"],
                    filename
                )
            )

        print("Received Data:", data)
        print("Uploaded File:", filename)

        conn = get_connection()
        cursor = conn.cursor()

        cursor.execute("""
            INSERT INTO work_logs
            (
                intern_id,
                work_date,
                task_title,
                description,
                hours_worked,
                file_name
            )
            VALUES (%s,%s,%s,%s,%s,%s)
        """, (
            data.get("intern_id"),
            data.get("work_date"),
            data.get("task_title"),
            data.get("description"),
            data.get("hours_worked"),
            filename
        ))

        conn.commit()

        cursor.close()
        conn.close()

        return jsonify({
            "success": True,
            "message": "Work log added successfully"
        }), 201

    except Exception as e:

        print("Error:", e)

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500


# ---------------- DELETE ----------------
@intern_bp.route("/worklog/<int:log_id>", methods=["DELETE"])
def delete_worklog(log_id):

    try:

        conn = get_connection()
        cursor = conn.cursor()

        cursor.execute("""
            DELETE FROM work_logs
            WHERE log_id=%s
            AND status='Pending'
        """, (log_id,))

        conn.commit()

        if cursor.rowcount == 0:

            return jsonify({
                "success": False,
                "message": "Work log not found or already approved/rejected"
            }), 404

        cursor.close()
        conn.close()

        return jsonify({
            "success": True,
            "message": "Deleted successfully"
        })

    except Exception as e:

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500


# ---------------- GET INTERN LOGS ----------------
@intern_bp.route("/worklogs/<int:intern_id>", methods=["GET"])
def get_worklogs(intern_id):

    try:

        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("""
            SELECT *
            FROM work_logs
            WHERE intern_id=%s
            ORDER BY work_date DESC
        """, (intern_id,))

        logs = cursor.fetchall()

        cursor.close()
        conn.close()

        return jsonify({
            "success": True,
            "data": logs
        })

    except Exception as e:

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

    

# ---------------- UPDATE ----------------
@intern_bp.route("/worklog/<int:log_id>", methods=["PUT"])
def update_worklog(log_id):

    try:

        data = request.get_json()

        conn = get_connection()
        cursor = conn.cursor()

        cursor.execute("""
            UPDATE work_logs
            SET
                task_title=%s,
                description=%s,
                hours_worked=%s,
                work_date=%s
            WHERE log_id=%s
            AND status='Pending'
        """, (
            data.get("task_title"),
            data.get("description"),
            data.get("hours_worked"),
            data.get("work_date"),
            log_id
        ))

        conn.commit()

        if cursor.rowcount == 0:

            return jsonify({
                "success": False,
                "message": "Work log not found or already approved/rejected"
            }), 404

        cursor.close()
        conn.close()

        return jsonify({
            "success": True,
            "message": "Updated successfully"
        })

    except Exception as e:

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500




    # ---------------- GET INTERN PROFILE ----------------
@intern_bp.route("/intern/<int:intern_id>", methods=["GET"])
def get_intern_profile(intern_id):

    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("""
    SELECT
        intern_id,
        full_name,
        email,
        phone,
        department,
        profile_image
    FROM interns
    WHERE intern_id=%s
""", (intern_id,))

        intern = cursor.fetchone()

        cursor.close()
        conn.close()

        if not intern:
            return jsonify({
                "success": False,
                "message": "Intern not found"
            }), 404

        return jsonify(intern)

    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

    # ---------------- UPDATE INTERN PROFILE ----------------
@intern_bp.route("/update-profile/<int:intern_id>", methods=["PUT"])
def update_profile(intern_id):
    try:
        data = request.get_json()

        conn = get_connection()
        cursor = conn.cursor()

        cursor.execute("""
            UPDATE interns
            SET
                full_name=%s,
                email=%s,
                phone=%s,
                department=%s
            WHERE intern_id=%s
        """, (
            data.get("full_name"),
            data.get("email"),
            data.get("phone"),
            data.get("department"),
            intern_id
        ))

        conn.commit()

        cursor.close()
        conn.close()

        return jsonify({
            "success": True,
            "message": "Profile updated successfully"
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

    # ---------------- INTERN DASHBOARD SUMMARY ----------------
@intern_bp.route("/intern-summary/<int:intern_id>", methods=["GET"])
def intern_summary(intern_id):

    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        # Total Logs
        cursor.execute("""
            SELECT COUNT(*) AS totalLogs
            FROM work_logs
            WHERE intern_id=%s
        """, (intern_id,))
        totalLogs = cursor.fetchone()["totalLogs"]

        # Approved
        cursor.execute("""
            SELECT COUNT(*) AS approved
            FROM work_logs
            WHERE intern_id=%s
            AND status='Approved'
        """, (intern_id,))
        approved = cursor.fetchone()["approved"]

        # Pending
        cursor.execute("""
            SELECT COUNT(*) AS pending
            FROM work_logs
            WHERE intern_id=%s
            AND status='Pending'
        """, (intern_id,))
        pending = cursor.fetchone()["pending"]

        # Rejected
        cursor.execute("""
            SELECT COUNT(*) AS rejected
            FROM work_logs
            WHERE intern_id=%s
            AND status='Rejected'
        """, (intern_id,))
        rejected = cursor.fetchone()["rejected"]

        cursor.close()
        conn.close()

        return jsonify({
            "totalLogs": totalLogs,
            "approved": approved,
            "pending": pending,
            "rejected": rejected
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500