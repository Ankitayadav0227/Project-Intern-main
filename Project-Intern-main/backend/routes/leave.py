from flask import Blueprint, request, jsonify
from db import get_connection

leave_bp = Blueprint("leave", __name__)


@leave_bp.route("/leave", methods=["POST"])
def apply_leave():
    conn = cursor = None
    try:
        data = request.get_json(silent=True) or {}
        intern_id = data.get("intern_id")
        from_date = data.get("from_date")
        to_date = data.get("to_date")
        reason = str(data.get("reason", "")).strip()

        if not all([intern_id, from_date, to_date, reason]):
            return jsonify({
                "success": False,
                "message": "Intern, dates and reason are required"
            }), 400

        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO leave_requests (intern_id, from_date, to_date, reason)
            VALUES (%s, %s, %s, %s)
            """,
            (intern_id, from_date, to_date, reason),
        )
        conn.commit()
        return jsonify({
            "success": True,
            "message": "Leave request submitted successfully"
        }), 201
    except Exception as exc:
        if conn:
            conn.rollback()
        return jsonify({"success": False, "message": str(exc)}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


@leave_bp.route("/leave", methods=["GET"])
def get_leave_requests():
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        try:
            cursor.execute(
                """
                SELECT l.leave_id, l.intern_id, i.full_name, i.department,
                       l.from_date, l.to_date, l.reason, l.status
                FROM leave_requests l
                INNER JOIN interns i ON l.intern_id=i.intern_id
                ORDER BY l.from_date DESC, l.leave_id DESC
                """
            )
            leave_requests = cursor.fetchall()
        finally:
            cursor.close()
            conn.close()
        return jsonify({"success": True, "data": leave_requests})
    except Exception as exc:
        return jsonify({"success": False, "message": str(exc)}), 500


@leave_bp.route("/leave/approve/<int:leave_id>", methods=["PUT"])
def approve_leave(leave_id):
    return _set_leave_status(leave_id, "Approved")


@leave_bp.route("/leave/reject/<int:leave_id>", methods=["PUT"])
def reject_leave(leave_id):
    return _set_leave_status(leave_id, "Rejected")


def _set_leave_status(leave_id, status):
    try:
        conn = get_connection()
        cursor = conn.cursor()
        try:
            cursor.execute(
                "UPDATE leave_requests SET status=%s WHERE leave_id=%s",
                (status, leave_id),
            )
            if cursor.rowcount == 0:
                return jsonify({"success": False, "message": "Leave request not found"}), 404
            conn.commit()
        finally:
            cursor.close()
            conn.close()
        return jsonify({
            "success": True,
            "message": f"Leave {status.lower()} successfully"
        })
    except Exception as exc:
        return jsonify({"success": False, "message": str(exc)}), 500


@leave_bp.route("/leave/<int:intern_id>", methods=["GET"])
def get_intern_leave(intern_id):
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        try:
            cursor.execute(
                """
                SELECT leave_id, from_date, to_date, reason, status
                FROM leave_requests
                WHERE intern_id=%s
                ORDER BY from_date DESC, leave_id DESC
                """,
                (intern_id,),
            )
            leaves = cursor.fetchall()
        finally:
            cursor.close()
            conn.close()
        return jsonify({"success": True, "data": leaves})
    except Exception as exc:
        return jsonify({"success": False, "message": str(exc)}), 500
