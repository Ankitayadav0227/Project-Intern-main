import os
import uuid

from flask import Blueprint, request, jsonify, send_from_directory
from werkzeug.utils import secure_filename

from db import get_connection

messages_bp = Blueprint("messages", __name__)

UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads", "messages")
MAX_FILE_SIZE = 10 * 1024 * 1024
ALLOWED_EXTENSIONS = {
    "jpg", "jpeg", "png", "gif", "webp", "bmp",
    "pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx",
    "txt", "zip", "rar", "csv",
}
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def get_intern_name(intern_id):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT full_name FROM interns WHERE intern_id=%s", (intern_id,))
        row = cursor.fetchone()
        return row["full_name"] if row else "Intern"
    finally:
        cursor.close()
        conn.close()


def get_admin_name(admin_id):
    if not admin_id:
        return "Admin"
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT username FROM admins WHERE admin_id=%s", (admin_id,))
        row = cursor.fetchone()
        return row["username"] if row else "Admin"
    finally:
        cursor.close()
        conn.close()


@messages_bp.route("/messages", methods=["POST"])
def send_message():
    conn = cursor = None
    saved_file = None
    try:
        intern_id = request.form.get("intern_id")
        sender = request.form.get("sender")
        admin_id = request.form.get("admin_id")
        message = request.form.get("message", "").strip()
        uploaded_file = request.files.get("file")

        if not intern_id or sender not in {"intern", "admin"}:
            return jsonify({
                "success": False,
                "message": "Intern ID and valid sender are required"
            }), 400

        if not message and not uploaded_file:
            return jsonify({
                "success": False,
                "message": "Message or file is required"
            }), 400

        sender_name = (
            get_intern_name(intern_id)
            if sender == "intern"
            else get_admin_name(admin_id)
        )

        file_name = None
        file_url = None

        if uploaded_file and uploaded_file.filename:
            if not allowed_file(uploaded_file.filename):
                return jsonify({
                    "success": False,
                    "message": "File type is not allowed"
                }), 400

            uploaded_file.seek(0, 2)
            size = uploaded_file.tell()
            uploaded_file.seek(0)
            if size > MAX_FILE_SIZE:
                return jsonify({
                    "success": False,
                    "message": "Maximum file size is 10 MB"
                }), 400

            original_name = secure_filename(uploaded_file.filename)
            unique_name = f"{uuid.uuid4()}_{original_name}"
            saved_file = os.path.join(UPLOAD_FOLDER, unique_name)
            uploaded_file.save(saved_file)
            file_name = original_name
            file_url = f"/messages/files/{unique_name}"

        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO messages
                (intern_id, sender, sender_name, message, file_name, file_url, is_read)
            VALUES (%s, %s, %s, %s, %s, %s, FALSE)
            """,
            (intern_id, sender, sender_name, message, file_name, file_url),
        )
        conn.commit()
        message_id = cursor.lastrowid

        return jsonify({
            "success": True,
            "message": "Message sent successfully",
            "message_id": message_id,
            "sender_name": sender_name,
            "file_name": file_name,
            "file_url": file_url,
        }), 201
    except Exception as exc:
        if conn:
            conn.rollback()
        if saved_file and os.path.exists(saved_file):
            try:
                os.remove(saved_file)
            except OSError:
                pass
        print("SEND MESSAGE ERROR:", exc)
        return jsonify({"success": False, "message": str(exc)}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


@messages_bp.route("/messages/intern/<int:intern_id>", methods=["GET"])
def get_intern_messages(intern_id):
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        try:
            cursor.execute(
                """
                SELECT message_id, intern_id, sender, sender_name, message,
                       file_name, file_url, is_read, created_at
                FROM messages
                WHERE intern_id=%s
                ORDER BY created_at ASC, message_id ASC
                """,
                (intern_id,),
            )
            messages = cursor.fetchall()
        finally:
            cursor.close()
            conn.close()
        return jsonify({"success": True, "data": messages})
    except Exception as exc:
        return jsonify({"success": False, "message": str(exc)}), 500


@messages_bp.route("/messages/admin", methods=["GET"])
def get_admin_messages():
    """Return every intern plus their messages.

    The LEFT JOIN is intentional: the admin can start a new conversation
    with an intern even when that intern has never sent a message.
    """
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        try:
            cursor.execute(
                """
                SELECT
                    i.intern_id,
                    i.full_name,
                    i.email,
                    m.message_id,
                    m.sender,
                    m.sender_name,
                    m.message,
                    m.file_name,
                    m.file_url,
                    m.is_read,
                    m.created_at
                FROM interns i
                LEFT JOIN messages m ON m.intern_id=i.intern_id
                ORDER BY i.full_name ASC, m.created_at ASC, m.message_id ASC
                """
            )
            rows = cursor.fetchall()
        finally:
            cursor.close()
            conn.close()
        return jsonify({"success": True, "data": rows})
    except Exception as exc:
        print("ADMIN MESSAGE ERROR:", exc)
        return jsonify({"success": False, "message": str(exc)}), 500


@messages_bp.route("/messages/admin/read/<int:intern_id>", methods=["PUT"])
def mark_intern_messages_read(intern_id):
    try:
        conn = get_connection()
        cursor = conn.cursor()
        try:
            cursor.execute(
                """
                UPDATE messages
                SET is_read=TRUE
                WHERE intern_id=%s AND sender='intern' AND is_read=FALSE
                """,
                (intern_id,),
            )
            conn.commit()
            updated = cursor.rowcount
        finally:
            cursor.close()
            conn.close()
        return jsonify({
            "success": True,
            "message": "Messages marked as read",
            "updated": updated,
        })
    except Exception as exc:
        return jsonify({"success": False, "message": str(exc)}), 500


@messages_bp.route("/messages/files/<path:filename>", methods=["GET"])
def serve_message_file(filename):
    try:
        return send_from_directory(UPLOAD_FOLDER, filename)
    except Exception:
        return jsonify({"success": False, "message": "File not found"}), 404
