import os
from dotenv import load_dotenv
from werkzeug.security import generate_password_hash
from db import get_connection

# Load variables from .env
load_dotenv()


def hash_admin_passwords():
    conn = None
    cursor = None

    try:
        conn = get_connection()
        cursor = conn.cursor()

        # Get admin passwords from .env
        admins = [
            (
                "Mahesh Pandey",
                os.getenv("ADMIN_MAHESH_PASSWORD")
            ),
            (
                "Samiksha Kathale",
                os.getenv("ADMIN_SAMIKSHA_PASSWORD")
            ),
            (
                "Satyam Kumar",
                os.getenv("ADMIN_SATYAM_PASSWORD")
            )
        ]

        print("\nHashing Admin Passwords...\n")

        for username, password in admins:

            # Check if password exists in .env
            if not password:
                print(f"❌ Password not found in .env for {username}")
                continue

            # Generate secure hash
            hashed_password = generate_password_hash(password)

            cursor.execute(
                """
                UPDATE admins
                SET password=%s
                WHERE username=%s
                """,
                (hashed_password, username)
            )

            if cursor.rowcount > 0:
                print(f"✅ {username} -> Password hashed successfully.")
            else:
                print(f"❌ {username} -> Username not found in database.")

        conn.commit()

        print("\n✅ Admin password hashing completed.\n")

    except Exception as e:
        print("❌ Error while hashing admin passwords:")
        print(e)

    finally:
        if cursor:
            cursor.close()

        if conn:
            conn.close()


def hash_intern_passwords():
    conn = None
    cursor = None

    try:
        conn = get_connection()
        cursor = conn.cursor()

        cursor.execute(
            "SELECT intern_id, full_name, password FROM interns"
        )

        interns = cursor.fetchall()

        print("\nHashing Intern Passwords...\n")

        for intern_id, full_name, password in interns:

            # Skip already hashed passwords
            if password.startswith("scrypt:") or password.startswith("pbkdf2:"):
                print(f"⏩ {full_name} -> Already hashed.")
                continue

            # Generate secure hash
            hashed_password = generate_password_hash(password)

            cursor.execute(
                """
                UPDATE interns
                SET password=%s
                WHERE intern_id=%s
                """,
                (hashed_password, intern_id)
            )

            print(f"✅ {full_name} -> Password hashed.")

        conn.commit()

        print("\n✅ Intern password hashing completed.\n")

    except Exception as e:
        print("❌ Error while hashing intern passwords:")
        print(e)

    finally:
        if cursor:
            cursor.close()

        if conn:
            conn.close()


if __name__ == "__main__":
    hash_admin_passwords()
    hash_intern_passwords()