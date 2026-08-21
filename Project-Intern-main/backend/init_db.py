from db import initialize_database, database_status


if __name__ == "__main__":
    try:
        initialize_database()
        print("Database initialization completed successfully.")
        print(database_status())
    except Exception as exc:
        print(f"Database initialization failed: {exc}")
        raise
