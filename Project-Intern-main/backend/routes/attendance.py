from flask import Blueprint, request, jsonify
from db import get_connection

attendance_bp = Blueprint("attendance", __name__)


@attendance_bp.route("/attendance", methods=["POST"])
def mark_attendance():
    try:
        data = request.get_json(silent=True) or {}
        intern_id = data.get("intern_id")
        attendance_date = data.get("attendance_date")
        status = data.get("status")

        if not intern_id or not attendance_date or not status:
            return jsonify({
                "success": False,
                "message": "Intern, date and status are required"
            }), 400

        conn = get_connection()
        cursor = conn.cursor()
        try:
            # One attendance record per intern per date.
            cursor.execute(
                """
                INSERT INTO attendance (intern_id, attendance_date, status)
                VALUES (%s, %s, %s)
                ON DUPLICATE KEY UPDATE status=VALUES(status)
                """,
                (intern_id, attendance_date, status),
            )
            conn.commit()
        finally:
            cursor.close()
            conn.close()

        return jsonify({
            "success": True,
            "message": "Attendance marked successfully"
        }), 200
    except Exception as exc:
        return jsonify({
            "success": False,
            "message": str(exc)
        }), 500


@attendance_bp.route("/attendance", methods=["GET"])
def get_attendance():
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        try:
            cursor.execute(
                """
                SELECT
                    a.attendance_id,
                    a.intern_id,
                    i.full_name,
                    i.department,
                    a.attendance_date,
                    a.status
                FROM attendance a
                INNER JOIN interns i ON a.intern_id=i.intern_id
                ORDER BY a.attendance_date DESC, a.attendance_id DESC
                """
            )
            attendance = cursor.fetchall()
        finally:
            cursor.close()
            conn.close()

        return jsonify({"success": True, "data": attendance})
    except Exception as exc:
        return jsonify({
            "success": False,
            "message": str(exc)
        }), 500
