import sqlite3
from pathlib import Path

db_path = Path(__file__).parent.parent / "data" / "learning_jobs.db"
db_path.parent.mkdir(parents=True, exist_ok=True)

job = {
    "title": "Data Analyst Intern",
    "company": "Example Company",
    "location": "Frankfurt am Main",
    "source": "manual",
}

connection = sqlite3.connect(db_path)
cursor = connection.cursor()

cursor.execute(
    """
    CREATE TABLE IF NOT EXISTS jobs (
        id INTEGER PRIMARY KEY,
        title TEXT,
        company TEXT,
        location TEXT,
        source TEXT
    )
    """
)

cursor.execute(
    """
    INSERT INTO jobs (title, company, location, source)
    VALUES (:title, :company, :location, :source)
    """,
    job,
)

connection.commit()

cursor.execute("SELECT * FROM jobs")
for saved_job in cursor.fetchall():
    print(saved_job)

connection.close()