from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from db import get_connection
import os

auth_bp = Blueprint("auth", __name__)

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


# =========================================================
# INTERN SIGNUP
# =========================================================

@auth_bp.route("/signup", methods=["POST"])
def signup():

    conn = None
    cursor = None

    try:
        data = request.form

        profile_image = request.files.get("profile_image")

        image_path = None

        # -------------------------
        # PROFILE IMAGE
        # -------------------------

        if profile_image and profile_image.filename:

            filename = secure_filename(
                profile_image.filename
            )

            filepath = os.path.join(
                UPLOAD_FOLDER,
                filename
            )

            profile_image.save(filepath)

            image_path = f"uploads/{filename}"

        # -------------------------
        # PASSWORD HASH
        # -------------------------

        password = data.get("password")

        if not password:
            return jsonify({
                "success": False,
                "message": "Password is required"
            }), 400

        hashed_password = generate_password_hash(
            password
        )

        # -------------------------
        # DATABASE
        # -------------------------

        conn = get_connection()
        cursor = conn.cursor()

        cursor.execute(
            """
            INSERT INTO interns
            (
                full_name,
                email,
                password,
                department,
                join_date,
                phone,
                age,
                gender,
                dob,
                address,
                profile_image
            )
            VALUES
            (
                %s,
                %s,
                %s,
                %s,
                CURDATE(),
                %s,
                %s,
                %s,
                %s,
                %s,
                %s
            )
            """,
            (
                data.get("full_name"),
                data.get("email"),
                hashed_password,
                data.get("department"),
                data.get("phone"),
                data.get("age") or None,
                data.get("gender"),
                data.get("dob") or None,
                data.get("address"),
                image_path
            )
        )

        conn.commit()

        return jsonify({
            "success": True,
            "message": "Registration Successful"
        }), 201

    except Exception as e:

        print("SIGNUP ERROR:", e)

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

    finally:

        if cursor:
            cursor.close()

        if conn:
            conn.close()


# =========================================================
# LOGIN
# =========================================================

@auth_bp.route("/login", methods=["POST"])
def login():

    conn = None
    cursor = None

    try:

        data = request.get_json()

        if not data:

            return jsonify({
                "success": False,
                "message": "No login data received"
            }), 400

        username = str(
            data.get("username", "")
        ).strip()

        password = str(
            data.get("password", "")
        )

        role = str(
            data.get("role", "")
        ).strip().lower()

        print("================================")
        print("LOGIN REQUEST")
        print("Username:", username)
        print("Role:", role)
        print("================================")

        if not username or not password or not role:

            return jsonify({
                "success": False,
                "message": "Username, password and role are required"
            }), 400

        conn = get_connection()

        cursor = conn.cursor(
            dictionary=True
        )

        # =====================================================
        # ADMIN LOGIN
        # =====================================================

        if role == "admin":

            cursor.execute(
                """
                SELECT
                    admin_id,
                    username,
                    password
                FROM admins
                WHERE LOWER(TRIM(username))
                    = LOWER(TRIM(%s))
                LIMIT 1
                """,
                (username,)
            )

            admin = cursor.fetchone()

            print(
                "ADMIN FOUND:",
                bool(admin)
            )

            if not admin:

                return jsonify({
                    "success": False,
                    "message":
                        "Invalid Admin Username or Password"
                }), 401

            stored_password = str(
                admin["password"]
            )

            # ---------------------------------------------
            # Check whether password is HASHED or PLAIN
            # ---------------------------------------------

            if stored_password.startswith(
                (
                    "scrypt:",
                    "pbkdf2:",
                    "argon2:"
                )
            ):

                password_valid = check_password_hash(
                    stored_password,
                    password
                )

            else:

                # Existing Railway admin passwords
                # are currently plain text.

                password_valid = (
                    stored_password == password
                )

            if not password_valid:

                return jsonify({
                    "success": False,
                    "message":
                        "Invalid Admin Username or Password"
                }), 401

            print("ADMIN LOGIN SUCCESS")

            return jsonify({

                "success": True,

                "message":
                    "Admin login successful",

                "admin": {

                    "admin_id":
                        admin["admin_id"],

                    "username":
                        admin["username"]

                }

            }), 200


        # =====================================================
        # INTERN LOGIN
        # =====================================================

        elif role == "intern":

            cursor.execute(
                """
                SELECT
                    intern_id,
                    full_name,
                    email,
                    password,
                    department,
                    join_date,
                    phone,
                    age,
                    gender,
                    dob,
                    address,
                    profile_image
                FROM interns
                WHERE LOWER(TRIM(email))
                    = LOWER(TRIM(%s))
                LIMIT 1
                """,
                (username,)
            )

            intern = cursor.fetchone()

            print(
                "INTERN FOUND:",
                bool(intern)
            )

            if not intern:

                return jsonify({
                    "success": False,
                    "message":
                        "Invalid Intern Username or Password"
                }), 401

            stored_password = str(
                intern["password"]
            )

            # ---------------------------------------------
            # Intern passwords created through signup are
            # hashed using generate_password_hash().
            # ---------------------------------------------

            try:

                password_valid = check_password_hash(
                    stored_password,
                    password
                )

            except Exception:

                # Allows old test accounts that may have
                # plain-text passwords.

                password_valid = (
                    stored_password == password
                )

            if not password_valid:

                return jsonify({
                    "success": False,
                    "message":
                        "Invalid Intern Username or Password"
                }), 401

            print("INTERN LOGIN SUCCESS")

            intern_data = {

                "intern_id":
                    intern["intern_id"],

                "full_name":
                    intern["full_name"],

                "email":
                    intern["email"],

                "department":
                    intern["department"],

                "join_date":
                    (
                        intern["join_date"].isoformat()
                        if intern["join_date"]
                        else None
                    ),

                "phone":
                    intern["phone"],

                "age":
                    intern["age"],

                "gender":
                    intern["gender"],

                "dob":
                    (
                        intern["dob"].isoformat()
                        if intern["dob"]
                        else None
                    ),

                "address":
                    intern["address"],

                "profile_image":
                    intern["profile_image"]

            }

            return jsonify({

                "success": True,

                "message":
                    "Intern login successful",

                "intern":
                    intern_data

            }), 200


        # =====================================================
        # INVALID ROLE
        # =====================================================

        else:

            return jsonify({
                "success": False,
                "message": "Invalid login role"
            }), 400


    except Exception as e:

        print(
            "LOGIN ERROR:",
            e
        )

        return jsonify({

            "success": False,

            "message":
                "Server error during login",

            "error":
                str(e)

        }), 500


    finally:

        if cursor:

            cursor.close()

        if conn:

            conn.close()