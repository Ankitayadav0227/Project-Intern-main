from flask import request, jsonify
from functools import wraps

def admin_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):

        admin = request.headers.get("Admin")

        if not admin:
            return jsonify({
                "success": False,
                "message": "Unauthorized Access"
            }), 401

        return f(*args, **kwargs)

    return decorated