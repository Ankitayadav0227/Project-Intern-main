import os
from urllib.parse import urlparse

import mysql.connector
from mysql.connector import Error
from dotenv import load_dotenv
from werkzeug.security import generate_password_hash

load_dotenv()


# =========================================================
# DATABASE CONFIGURATION
# =========================================================

def _build_db_config():

    mysql_url = os.getenv("MYSQL_URL") or os.getenv("DATABASE_URL")

    # Railway MYSQL_URL / DATABASE_URL
    if mysql_url:

        try:
            parsed = urlparse(mysql_url)

            if parsed.hostname:
                return {
                    "host": parsed.hostname,
                    "port": parsed.port or 3306,
                    "user": parsed.username,
                    "password": parsed.password,
                    "database": (
                        parsed.path.lstrip("/")
                        if parsed.path
                        else None
                    ),
                }

        except Exception as exc:
            print("Failed to parse MySQL URL:", exc)

    # Railway MYSQL variables
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
# DATABASE CONFIG LOG
# =========================================================

def print_database_config():

    print("========== DATABASE CONFIG ==========")
    print("Host:", DB_CONFIG.get("host"))
    print("Port:", DB_CONFIG.get("port"))
    print("User:", DB_CONFIG.get("user"))
    print("Database:", DB_CONFIG.get("database"))

    if DB_CONFIG.get("password"):
        print("Password: Configured")
    else:
        print("Password: Missing")

    print("=====================================")


# =========================================================
# DATABASE CONNECTION
# =========================================================

def get_connection():

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

        connection = mysql.connector.connect(
            host=DB_CONFIG["host"],
            port=DB_CONFIG["port"],
            user=DB_CONFIG["user"],
            password=DB_CONFIG["password"],
            database=DB_CONFIG["database"],
            connection_timeout=15,
            autocommit=False,
        )

        if not connection.is_connected():

            raise RuntimeError(
                "MySQL connection was not established."
            )

        return connection

    except Error as exc:

        print("MySQL connection error:", exc)

        raise RuntimeError(
            f"MySQL connection failed: {exc}"
        ) from exc


# =========================================================
# ENSURE COLUMN
# =========================================================

def _ensure_column(
    cursor,
    table,
    column,
    definition
):

    cursor.execute(
        """
        SELECT COUNT(*)
        FROM information_schema.columns
        WHERE table_schema = DATABASE()
        AND table_name = %s
        AND column_name = %s
        """,
        (table, column),
    )

    result = cursor.fetchone()

    exists = result[0] > 0

    if not exists:

        print(
            f"Adding missing column: "
            f"{table}.{column}"
        )

        cursor.execute(
            f"""
            ALTER TABLE `{table}`
            ADD COLUMN `{column}` {definition}
            """
        )


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

        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS admins (

                admin_id INT AUTO_INCREMENT PRIMARY KEY,

                username VARCHAR(100)
                    NOT NULL UNIQUE,

                password VARCHAR(255)
                    NOT NULL

            ) ENGINE=InnoDB
            """
        )


        # =================================================
        # INTERNS
        # =================================================

        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS interns (

                intern_id INT AUTO_INCREMENT PRIMARY KEY,

                full_name VARCHAR(150)
                    NOT NULL,

                email VARCHAR(150)
                    NOT NULL UNIQUE,

                password VARCHAR(255)
                    NOT NULL,

                department VARCHAR(100),

                join_date DATE,

                phone VARCHAR(20),

                age INT,

                gender VARCHAR(20),

                dob DATE,

                address TEXT,

                profile_image VARCHAR(255)

            ) ENGINE=InnoDB
            """
        )


        # Existing database migrations

        _ensure_column(
            cursor,
            "interns",
            "phone",
            "VARCHAR(20)"
        )

        _ensure_column(
            cursor,
            "interns",
            "age",
            "INT"
        )

        _ensure_column(
            cursor,
            "interns",
            "gender",
            "VARCHAR(20)"
        )

        _ensure_column(
            cursor,
            "interns",
            "dob",
            "DATE"
        )

        _ensure_column(
            cursor,
            "interns",
            "address",
            "TEXT"
        )

        _ensure_column(
            cursor,
            "interns",
            "profile_image",
            "VARCHAR(255)"
        )


        # =================================================
        # WORK LOGS
        # =================================================

        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS work_logs (

                log_id INT AUTO_INCREMENT PRIMARY KEY,

                intern_id INT NOT NULL,

                work_date DATE NOT NULL,

                task_title VARCHAR(200)
                    NOT NULL,

                description TEXT
                    NOT NULL,

                hours_worked DECIMAL(5,2)
                    NOT NULL,

                status VARCHAR(50)
                    NOT NULL DEFAULT 'Pending',

                file_name VARCHAR(255),

                created_at TIMESTAMP
                    DEFAULT CURRENT_TIMESTAMP,

                CONSTRAINT fk_worklogs_intern

                    FOREIGN KEY (intern_id)

                    REFERENCES interns(intern_id)

                    ON DELETE CASCADE

            ) ENGINE=InnoDB
            """
        )


        _ensure_column(
            cursor,
            "work_logs",
            "created_at",
            "TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
        )


        # =================================================
        # ATTENDANCE
        # =================================================

        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS attendance (

                attendance_id INT AUTO_INCREMENT PRIMARY KEY,

                intern_id INT NOT NULL,

                attendance_date DATE NOT NULL,

                status VARCHAR(50)
                    NOT NULL,

                created_at TIMESTAMP
                    DEFAULT CURRENT_TIMESTAMP,

                CONSTRAINT fk_attendance_intern

                    FOREIGN KEY (intern_id)

                    REFERENCES interns(intern_id)

                    ON DELETE CASCADE,

                UNIQUE KEY unique_intern_date
                    (intern_id, attendance_date)

            ) ENGINE=InnoDB
            """
        )


        _ensure_column(
            cursor,
            "attendance",
            "created_at",
            "TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
        )


        # =================================================
        # LEAVE REQUESTS
        # =================================================

        cursor.execute(
            """
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
            """
        )


        _ensure_column(
            cursor,
            "leave_requests",
            "created_at",
            "TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
        )


        # =================================================
        # MESSAGES
        # =================================================

        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS messages (

                message_id INT AUTO_INCREMENT PRIMARY KEY,

                intern_id INT NOT NULL,

                sender VARCHAR(20)
                    NOT NULL,

                sender_name VARCHAR(150),

                message TEXT,

                file_name VARCHAR(255),

                file_url VARCHAR(500),

                is_read BOOLEAN
                    NOT NULL DEFAULT FALSE,

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
            """
        )


        # Existing messages table migrations

        _ensure_column(
            cursor,
            "messages",
            "sender_name",
            "VARCHAR(150)"
        )

        _ensure_column(
            cursor,
            "messages",
            "message",
            "TEXT"
        )

        _ensure_column(
            cursor,
            "messages",
            "file_name",
            "VARCHAR(255)"
        )

        _ensure_column(
            cursor,
            "messages",
            "file_url",
            "VARCHAR(500)"
        )

        _ensure_column(
            cursor,
            "messages",
            "is_read",
            "BOOLEAN NOT NULL DEFAULT FALSE"
        )

        _ensure_column(
            cursor,
            "messages",
            "created_at",
            "TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
        )


        # =================================================
        # DEFAULT ADMIN
        # =================================================

        cursor.execute(
            """
            SELECT admin_id
            FROM admins
            WHERE LOWER(TRIM(username)) = 'admin'
            LIMIT 1
            """
        )

        admin_exists = cursor.fetchone()


        if admin_exists is None:

            print("Creating default admin...")

            hashed_password = generate_password_hash(
                "admin123"
            )

            cursor.execute(
                """
                INSERT INTO admins
                    (username, password)
                VALUES
                    (%s, %s)
                """,
                (
                    "admin",
                    hashed_password,
                ),
            )


        # =================================================
        # COMMIT
        # =================================================

        conn.commit()

        print("=====================================")
        print("DATABASE INITIALIZATION SUCCESS")
        print("=====================================")

        return True


    except Exception as exc:

        conn.rollback()

        print(
            "DATABASE INITIALIZATION FAILED:",
            exc
        )

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


        cursor.execute(
            """
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = DATABASE()
            ORDER BY table_name
            """
        )

        tables = [
            row[0]
            for row in cursor.fetchall()
        ]


        return {
            "database": database,
            "tables": tables,
        }


    finally:

        cursor.close()
        conn.close()


# =========================================================
# TEST DATABASE
# =========================================================

def test_database_connection():

    try:

        conn = get_connection()
        cursor = conn.cursor()

        cursor.execute(
            "SELECT 1"
        )

        result = cursor.fetchone()

        cursor.close()
        conn.close()

        return {
            "success": True,
            "message": "MySQL connection successful",
            "result": result[0],
        }


    except Exception as exc:

        return {
            "success": False,
            "message": str(exc),
        }


# =========================================================
# PRINT CONFIG
# =========================================================

print_database_config()