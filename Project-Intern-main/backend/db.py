import os
from urllib.parse import urlparse

import mysql.connector
from mysql.connector import Error
from werkzeug.security import generate_password_hash
import os
from dotenv import load_dotenv

load_dotenv()


def _build_db_config():
    """Build a Railway-compatible MySQL configuration.

    Railway normally exposes MYSQLHOST/MYSQLPORT/MYSQLUSER/
    MYSQLPASSWORD/MYSQLDATABASE. MYSQL_URL is supported as a fallback.
    """
    mysql_url = os.getenv("MYSQL_URL") or os.getenv("DATABASE_URL")

    if mysql_url:
        parsed = urlparse(mysql_url)
        if parsed.hostname:
            return {
                "host": parsed.hostname,
                "port": parsed.port or 3306,
                "user": parsed.username,
                "password": parsed.password,
                "database": (parsed.path or "").lstrip("/") or None,
            }

    return {
        "host": os.getenv("MYSQLHOST"),
        "port": int(os.getenv("MYSQLPORT", "3306")),
        "user": os.getenv("MYSQLUSER"),
        "password": os.getenv("MYSQLPASSWORD"),
        "database": os.getenv("MYSQLDATABASE") or os.getenv("MYSQL_DATABASE"),
    }


DB_CONFIG = _build_db_config()


def get_connection():
    missing = [
        key
        for key in ("host", "user", "password", "database")
        if not DB_CONFIG.get(key)
    ]
    if missing:
        raise RuntimeError(
            "Missing MySQL environment variables: " + ", ".join(missing)
        )

    return mysql.connector.connect(
        **DB_CONFIG,
        connection_timeout=10,
    )


def _ensure_column(cursor, table, column, definition):
    cursor.execute(
        """
        SELECT COUNT(*) AS total
        FROM information_schema.columns
        WHERE table_schema = DATABASE()
          AND table_name = %s
          AND column_name = %s
        """,
        (table, column),
    )
    exists = cursor.fetchone()[0] > 0
    if not exists:
        cursor.execute(f"ALTER TABLE `{table}` ADD COLUMN `{column}` {definition}")


def initialize_database():
    """Create/migrate all tables required by the application.

    This is intentionally idempotent so Railway can run it every time the
    container starts without deleting existing data.
    """
    conn = get_connection()
    cursor = conn.cursor()

    try:
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS admins (
                admin_id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(100) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL
            ) ENGINE=InnoDB
            """
        )

        cursor.execute(
            """
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
            """
        )

        # Migrate older interns tables created by previous versions.
        _ensure_column(cursor, "interns", "phone", "VARCHAR(20)")
        _ensure_column(cursor, "interns", "age", "INT")
        _ensure_column(cursor, "interns", "gender", "VARCHAR(20)")
        _ensure_column(cursor, "interns", "dob", "DATE")
        _ensure_column(cursor, "interns", "address", "TEXT")
        _ensure_column(cursor, "interns", "profile_image", "VARCHAR(255)")

        cursor.execute(
            """
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
                    FOREIGN KEY (intern_id) REFERENCES interns(intern_id)
                    ON DELETE CASCADE
            ) ENGINE=InnoDB
            """
        )
        _ensure_column(
            cursor, "work_logs", "created_at", "TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
        )

        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS attendance (
                attendance_id INT AUTO_INCREMENT PRIMARY KEY,
                intern_id INT NOT NULL,
                attendance_date DATE NOT NULL,
                status VARCHAR(50) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT fk_attendance_intern
                    FOREIGN KEY (intern_id) REFERENCES interns(intern_id)
                    ON DELETE CASCADE,
                UNIQUE KEY unique_intern_date (intern_id, attendance_date)
            ) ENGINE=InnoDB
            """
        )
        _ensure_column(
            cursor, "attendance", "created_at", "TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
        )

        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS leave_requests (
                leave_id INT AUTO_INCREMENT PRIMARY KEY,
                intern_id INT NOT NULL,
                from_date DATE NOT NULL,
                to_date DATE NOT NULL,
                reason TEXT NOT NULL,
                status VARCHAR(50) NOT NULL DEFAULT 'Pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT fk_leave_intern
                    FOREIGN KEY (intern_id) REFERENCES interns(intern_id)
                    ON DELETE CASCADE
            ) ENGINE=InnoDB
            """
        )
        _ensure_column(
            cursor, "leave_requests", "created_at", "TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
        )

        # This table was missing from the old init_db.py and caused the
        # Messages page to fail as soon as a message was sent.
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS messages (
                message_id INT AUTO_INCREMENT PRIMARY KEY,
                intern_id INT NOT NULL,
                sender VARCHAR(20) NOT NULL,
                sender_name VARCHAR(150),
                message TEXT,
                file_name VARCHAR(255),
                file_url VARCHAR(500),
                is_read BOOLEAN NOT NULL DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT fk_messages_intern
                    FOREIGN KEY (intern_id) REFERENCES interns(intern_id)
                    ON DELETE CASCADE,
                INDEX idx_messages_intern (intern_id),
                INDEX idx_messages_created (created_at)
            ) ENGINE=InnoDB
            """
        )

        # Migrate an older messages table if it already exists.
        _ensure_column(cursor, "messages", "sender_name", "VARCHAR(150)")
        _ensure_column(cursor, "messages", "message", "TEXT")
        _ensure_column(cursor, "messages", "file_name", "VARCHAR(255)")
        _ensure_column(cursor, "messages", "file_url", "VARCHAR(500)")
        _ensure_column(cursor, "messages", "is_read", "BOOLEAN NOT NULL DEFAULT FALSE")
        _ensure_column(cursor, "messages", "created_at", "TIMESTAMP DEFAULT CURRENT_TIMESTAMP")

        # Add a default admin only when the table is empty for this username.
        cursor.execute(
            "SELECT admin_id FROM admins WHERE LOWER(TRIM(username)) = 'admin' LIMIT 1"
        )
        if cursor.fetchone() is None:
            cursor.execute(
                "INSERT INTO admins (username, password) VALUES (%s, %s)",
                ("admin", generate_password_hash("admin123")),
            )

        conn.commit()
        return True
    except Exception:
        conn.rollback()
        raise
    finally:
        cursor.close()
        conn.close()


def database_status():
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT DATABASE()")
        database = cursor.fetchone()[0]
        cursor.execute(
            """
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = DATABASE()
            ORDER BY table_name
            """
        )
        tables = [row[0] for row in cursor.fetchall()]
        return {"database": database, "tables": tables}
    finally:
        cursor.close()
        conn.close()
