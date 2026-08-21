from flask import Blueprint, jsonify, request
from werkzeug.security import generate_password_hash
from db import get_connection

admin_bp = Blueprint("admin", __name__)


def _fetch_all(query, params=()):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(query, params)
        return cursor.fetchall()
    finally:
        cursor.close()
        conn.close()


@admin_bp.route("/all-worklogs", methods=["GET"])
def all_worklogs():
    try:
        logs = _fetch_all(
            """
            SELECT w.log_id, i.full_name, w.work_date, w.task_title,
                   w.description, w.hours_worked, w.status
            FROM work_logs w
            INNER JOIN interns i ON w.intern_id=i.intern_id
            ORDER BY w.work_date DESC, w.log_id DESC
            """
        )
        return jsonify(logs)
    except Exception as exc:
        return jsonify({"success": False, "message": str(exc)}), 500


@admin_bp.route("/approve/<int:log_id>", methods=["PUT"])
def approve_log(log_id):
    return _set_worklog_status(log_id, "Approved")


@admin_bp.route("/reject/<int:log_id>", methods=["PUT"])
def reject_log(log_id):
    return _set_worklog_status(log_id, "Rejected")


def _set_worklog_status(log_id, status):
    try:
        conn = get_connection()
        cursor = conn.cursor()
        try:
            cursor.execute(
                "UPDATE work_logs SET status=%s WHERE log_id=%s",
                (status, log_id),
            )
            conn.commit()
        finally:
            cursor.close()
            conn.close()
        return jsonify({
            "success": True,
            "message": f"Work log {status.lower()} successfully"
        })
    except Exception as exc:
        return jsonify({"success": False, "message": str(exc)}), 500


@admin_bp.route("/interns", methods=["GET"])
def get_interns():
    try:
        interns = _fetch_all(
            """
            SELECT intern_id, full_name, email, department
            FROM interns
            ORDER BY intern_id DESC
            """
        )
        return jsonify({"success": True, "data": interns})
    except Exception as exc:
        return jsonify({"success": False, "message": str(exc)}), 500


@admin_bp.route("/interns", methods=["POST"])
def add_intern():
    conn = cursor = None
    try:
        data = request.get_json(silent=True) or {}
        full_name = str(data.get("full_name", "")).strip()
        email = str(data.get("email", "")).strip().lower()
        department = str(data.get("department", "")).strip()
        password = str(data.get("password", ""))

        if not all([full_name, email, department, password]):
            return jsonify({
                "success": False,
                "message": "All fields are required"
            }), 400

        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO interns (full_name, email, department, password, join_date)
            VALUES (%s, %s, %s, %s, CURDATE())
            """,
            (full_name, email, department, generate_password_hash(password)),
        )
        conn.commit()

        return jsonify({
            "success": True,
            "message": "Intern added successfully",
            "intern_id": cursor.lastrowid,
        }), 201
    except Exception as exc:
        if conn:
            conn.rollback()
        message = str(exc)
        if "Duplicate entry" in message and "email" in message:
            message = "An intern with this email already exists"
        return jsonify({"success": False, "message": message}), 400
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


@admin_bp.route("/interns/<int:intern_id>", methods=["PUT"])
def update_intern(intern_id):
    conn = cursor = None
    try:
        data = request.get_json(silent=True) or {}
        full_name = str(data.get("full_name", "")).strip()
        email = str(data.get("email", "")).strip().lower()
        department = str(data.get("department", "")).strip()

        if not all([full_name, email, department]):
            return jsonify({
                "success": False,
                "message": "Name, email and department are required"
            }), 400

        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(
            """
            UPDATE interns
            SET full_name=%s, email=%s, department=%s
            WHERE intern_id=%s
            """,
            (full_name, email, department, intern_id),
        )
        if cursor.rowcount == 0:
            return jsonify({"success": False, "message": "Intern not found"}), 404
        conn.commit()
        return jsonify({"success": True, "message": "Intern updated successfully"})
    except Exception as exc:
        if conn:
            conn.rollback()
        return jsonify({"success": False, "message": str(exc)}), 400
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


@admin_bp.route("/interns/<int:intern_id>", methods=["DELETE"])
def delete_intern(intern_id):
    conn = cursor = None
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM interns WHERE intern_id=%s", (intern_id,))
        if cursor.rowcount == 0:
            return jsonify({"success": False, "message": "Intern not found"}), 404
        conn.commit()
        return jsonify({"success": True, "message": "Intern deleted successfully"})
    except Exception as exc:
        if conn:
            conn.rollback()
        return jsonify({"success": False, "message": str(exc)}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


@admin_bp.route("/analytics", methods=["GET"])
def analytics():
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        try:
            cursor.execute("SELECT status, COUNT(*) AS total FROM work_logs GROUP BY status")
            worklogs = cursor.fetchall()

            cursor.execute(
                "SELECT COALESCE(department, 'Unassigned') AS department, COUNT(*) AS total "
                "FROM interns GROUP BY department ORDER BY total DESC"
            )
            departments = cursor.fetchall()

            cursor.execute(
                """
                SELECT attendance_date, COUNT(*) AS total
                FROM attendance
                WHERE attendance_date >= CURDATE() - INTERVAL 6 DAY
                GROUP BY attendance_date
                ORDER BY attendance_date
                """
            )
            attendance = cursor.fetchall()

            cursor.execute("SELECT status, COUNT(*) AS total FROM leave_requests GROUP BY status")
            leaves = cursor.fetchall()

            cursor.execute(
                """
                SELECT i.full_name, COALESCE(SUM(w.hours_worked), 0) AS total_hours
                FROM interns i
                INNER JOIN work_logs w ON i.intern_id=w.intern_id
                GROUP BY i.intern_id, i.full_name
                ORDER BY total_hours DESC
                LIMIT 5
                """
            )
            top_interns = cursor.fetchall()
        finally:
            cursor.close()
            conn.close()

        return jsonify({
            "worklogs": worklogs,
            "departments": departments,
            "attendance": attendance,
            "leaves": leaves,
            "topInterns": top_interns,
        })
    except Exception as exc:
        return jsonify({"success": False, "message": str(exc)}), 500


@admin_bp.route("/dashboard-summary", methods=["GET"])
def dashboard_summary():
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        try:
            cursor.execute("SELECT COUNT(*) AS totalInterns FROM interns")
            total_interns = cursor.fetchone()["totalInterns"]
            cursor.execute("SELECT COUNT(*) AS pending FROM work_logs WHERE status='Pending'")
            pending = cursor.fetchone()["pending"]
            cursor.execute("SELECT COUNT(*) AS approved FROM work_logs WHERE status='Approved'")
            approved = cursor.fetchone()["approved"]
            cursor.execute("SELECT COUNT(*) AS rejected FROM work_logs WHERE status='Rejected'")
            rejected = cursor.fetchone()["rejected"]
        finally:
            cursor.close()
            conn.close()

        return jsonify({
            "totalInterns": total_interns,
            "pending": pending,
            "approved": approved,
            "rejected": rejected,
        })
    except Exception as exc:
        return jsonify({"success": False, "message": str(exc)}), 500
