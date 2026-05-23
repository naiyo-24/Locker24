import psycopg2

conn = psycopg2.connect(host='localhost', port=5432, dbname='locker24', user='postgres', password='password')
conn.autocommit = True
cur = conn.cursor()

def add_column_if_missing(table, column, definition):
    cur.execute(
        "SELECT COUNT(*) FROM information_schema.columns WHERE table_name=%s AND column_name=%s",
        (table, column)
    )
    if cur.fetchone()[0] == 0:
        cur.execute(f"ALTER TABLE {table} ADD COLUMN {column} {definition};")
        print(f"ADDED: {table}.{column}")
    else:
        print(f"EXISTS: {table}.{column}")

# Add new columns to folders table
add_column_if_missing("folders", "is_sensitive", "BOOLEAN DEFAULT FALSE")
add_column_if_missing("folders", "password_hash", "VARCHAR")

cur.close()
conn.close()
print("Migration complete!")
