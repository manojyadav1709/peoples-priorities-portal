import psycopg2

DATABASE_URL = "postgresql://postgres.wdrmmshhlbitmkufqqla:rs3Vr4Sb94eGhb2I@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres"

print("Connecting to Supabase PostgreSQL (via Pooler)...")
try:
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()
    print("SUCCESS: Connection to Supabase database established successfully!")
    
    # Correct plural table names defined in app/models.py
    tables = ['districts', 'blocks', 'gram_panchayats', 'villages', 'themes', 'submissions']
    for table in tables:
        try:
            cur.execute(f"SELECT COUNT(*) FROM {table};")
            count = cur.fetchone()[0]
            print(f"   - Table '{table}': {count} rows")
        except Exception as e:
            try:
                conn.rollback()
                cur.execute(f'SELECT COUNT(*) FROM "{table}";')
                count = cur.fetchone()[0]
                print(f"   - Table '{table}': {count} rows")
            except Exception as e2:
                print(f"   - Table '{table}': Not found. (Error: {e2})")
                conn.rollback()
            
    cur.close()
    conn.close()
except Exception as e:
    print(f"ERROR: Connection failed: {e}")
