import os
from dotenv import load_dotenv

import mysql.connector
from mysql.connector import Error
from werkzeug.security import generate_password_hash


# =========================================================
# LOAD ENVIRONMENT VARIABLES
# =========================================================

load_dotenv()


# =========================================================
# DATABASE CONFIGURATION
# =========================================================

def _build_db_config():
    """
    Railway MySQL configuration.

    Railway provides:
        MYSQLHOST
        MYSQLPORT
        MYSQLUSER
        MYSQLPASSWORD
        MYSQLDATABASE

    Local .env can use the same variables.
    """

    return {
        "host": os.getenv("MYSQLHOST"),
        "port": int(os.getenv("MYSQLPORT", "3306")),
        "user": os.getenv("MYSQLUSER"),
        "password": os.getenv("MYSQLPASSWORD"),
        "database": (
            os.getenv("MYSQLDATABASE")
            or os.getenv("MYSQL_DATABASE")
        ),
    }


DB_CONFIG = _build_db_config()


# =========================================================
# SAFE DATABASE CONFIG PRINT
# =========================================================

def print_database_config():
    """
    Print database configuration without exposing password.
    """

    print("====================================")
    print("MYSQL DATABASE CONFIGURATION")
    print("====================================")

    print("MYSQLHOST:", DB_CONFIG.get("host"))
    print("MYSQLPORT:", DB_CONFIG.get("port"))
    print("MYSQLUSER:", DB_CONFIG.get("user"))
    print("MYSQLDATABASE:", DB_CONFIG.get("database"))

    if DB_CONFIG.get("password"):
        print("MYSQLPASSWORD: Configured")
    else:
        print("MYSQLPASSWORD: Missing")

    print("====================================")


# =========================================================
# DATABASE CONNECTION
# =========================================================

def get_connection():
    """
    Create and return MySQL connection.
    """

    required = [
        "host",
        "user",
        "password",
        "database",
    ]

    missing = [
        key
        for key in required
        if not DB_CONFIG.get(key)
    ]

    if missing:
        raise RuntimeError(
            "Missing MySQL environment variables: "
            + ", ".join(missing)
        )

    try:

        conn = mysql.connector.connect(
            host=DB_CONFIG["host"],
            port=DB_CONFIG["port"],
            user=DB_CONFIG["user"],
            password=DB_CONFIG["password"],
            database=DB_CONFIG["database"],
            connection_timeout=15,
            autocommit=False,
        )

        if not conn.is_connected():
            raise RuntimeError(
                "MySQL connection was not established"
            )

        return conn

    except Error as exc:

        print("====================================")
        print("MYSQL CONNECTION ERROR")
        print(exc)
        print("====================================")

        raise RuntimeError(
            f"MySQL connection failed: {exc}"
        ) from exc


# =========================================================
# INITIALIZE DATABASE
# =========================================================

def initialize_database():

    print("Starting database initialization...")

    conn = get_connection()
    cursor = conn.cursor()

    try:

        # =================================================
        # ADMINS
        # =================================================

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS admins (
                admin_id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(100) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL
            ) ENGINE=InnoDB
        """)


        # =================================================
        # INTERNS
        # =================================================

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS interns (
                intern_id INT AUTO_INCREMENT PRIMARY KEY,
                full_name VARCHAR(150) NOT NULL,
                email VARCHAR(150) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                department VARCHAR(100),
                join_date DATE,
                phone VARCHAR(20),
                age INT,
                gender VARCHAR(20),
                dob DATE,
                address TEXT,
                profile_image VARCHAR(255)
            ) ENGINE=InnoDB
        """)


        # =================================================
        # WORK LOGS
        # =================================================

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS work_logs (
                log_id INT AUTO_INCREMENT PRIMARY KEY,
                intern_id INT NOT NULL,
                work_date DATE NOT NULL,
                task_title VARCHAR(200) NOT NULL,
                description TEXT NOT NULL,
                hours_worked DECIMAL(5,2) NOT NULL,
                status VARCHAR(50) NOT NULL DEFAULT 'Pending',
                file_name VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

                CONSTRAINT fk_worklogs_intern
                    FOREIGN KEY (intern_id)
                    REFERENCES interns(intern_id)
                    ON DELETE CASCADE

            ) ENGINE=InnoDB
        """)


        # =================================================
        # ATTENDANCE
        # =================================================

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS attendance (
                attendance_id INT AUTO_INCREMENT PRIMARY KEY,
                intern_id INT NOT NULL,
                attendance_date DATE NOT NULL,
                status VARCHAR(50) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

                CONSTRAINT fk_attendance_intern
                    FOREIGN KEY (intern_id)
                    REFERENCES interns(intern_id)
                    ON DELETE CASCADE,

                UNIQUE KEY unique_intern_date
                    (intern_id, attendance_date)

            ) ENGINE=InnoDB
        """)


        # =================================================
        # LEAVE REQUESTS
        # =================================================

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS leave_requests (
                leave_id INT AUTO_INCREMENT PRIMARY KEY,
                intern_id INT NOT NULL,
                from_date DATE NOT NULL,
                to_date DATE NOT NULL,
                reason TEXT NOT NULL,
                status VARCHAR(50)
                    NOT NULL DEFAULT 'Pending',
                created_at TIMESTAMP
                    DEFAULT CURRENT_TIMESTAMP,

                CONSTRAINT fk_leave_intern
                    FOREIGN KEY (intern_id)
                    REFERENCES interns(intern_id)
                    ON DELETE CASCADE

            ) ENGINE=InnoDB
        """)


        # =================================================
        # MESSAGES
        # =================================================

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS messages (
                message_id INT AUTO_INCREMENT PRIMARY KEY,
                intern_id INT NOT NULL,
                sender VARCHAR(20) NOT NULL,
                sender_name VARCHAR(150),
                message TEXT,
                file_name VARCHAR(255),
                file_url VARCHAR(500),
                is_read BOOLEAN NOT NULL DEFAULT FALSE,
                created_at TIMESTAMP
                    DEFAULT CURRENT_TIMESTAMP,

                CONSTRAINT fk_messages_intern
                    FOREIGN KEY (intern_id)
                    REFERENCES interns(intern_id)
                    ON DELETE CASCADE,

                INDEX idx_messages_intern
                    (intern_id),

                INDEX idx_messages_created
                    (created_at)

            ) ENGINE=InnoDB
        """)


        # =================================================
        # DEFAULT ADMIN
        # =================================================

        cursor.execute("""
            SELECT admin_id
            FROM admins
            WHERE LOWER(TRIM(username)) = 'admin'
            LIMIT 1
        """)

        admin_exists = cursor.fetchone()

        if admin_exists is None:

            print("Creating default admin...")

            hashed_password = generate_password_hash(
                "admin123"
            )

            cursor.execute("""
                INSERT INTO admins
                (
                    username,
                    password
                )
                VALUES
                (%s, %s)
            """, (
                "admin",
                hashed_password
            ))


        # =================================================
        # COMMIT
        # =================================================

        conn.commit()

        print("====================================")
        print("DATABASE INITIALIZATION SUCCESS")
        print("====================================")

        return True

    except Exception as exc:

        conn.rollback()

        print("====================================")
        print("DATABASE INITIALIZATION FAILED")
        print(exc)
        print("====================================")

        raise

    finally:

        cursor.close()
        conn.close()


# =========================================================
# DATABASE STATUS
# =========================================================

def database_status():

    conn = get_connection()
    cursor = conn.cursor()

    try:

        cursor.execute(
            "SELECT DATABASE()"
        )

        database = cursor.fetchone()[0]

        cursor.execute("""
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = DATABASE()
            ORDER BY table_name
        """)

        tables = [
            row[0]
            for row in cursor.fetchall()
        ]

        return {
            "database": database,
            "tables": tables
        }

    finally:

        cursor.close()
        conn.close()


# =========================================================
# TEST DATABASE CONNECTION
# =========================================================

def test_database_connection():

    conn = None
    cursor = None

    try:

        conn = get_connection()

        cursor = conn.cursor()

        cursor.execute("SELECT 1")

        result = cursor.fetchone()

        return {
            "success": True,
            "message": "MySQL connection successful",
            "result": result[0]
        }

    except Exception as exc:

        return {
            "success": False,
            "message": str(exc)
        }

    finally:

        if cursor:
            cursor.close()

        if conn:
            conn.close()


# =========================================================
# PRINT CONFIG WHEN APPLICATION STARTS
# =========================================================

print_database_config()