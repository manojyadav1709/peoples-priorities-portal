import xml.etree.ElementTree as ET
import pandas as pd
import time
import os
from sqlmodel import Session, SQLModel, create_engine
from sqlalchemy.dialects.sqlite import insert as sqlite_insert
from sqlalchemy.dialects.postgresql import insert as pg_insert
from app.core.db import engine, DATABASE_URL
from app.models import District, Block, GramPanchayat, Village, MPSeat, ConstituencyBlock

def parse_xml_spreadsheet_to_df(file_path, header_row_idx, data_start_row_idx):
    print(f"Parsing {os.path.basename(file_path)}...")
    t0 = time.time()
    
    rows = []
    # Use ET iterparse to be memory efficient
    context = ET.iterparse(file_path, events=('end',))
    
    row_tag = '{urn:schemas-microsoft-com:office:spreadsheet}Row'
    cell_tag = '{urn:schemas-microsoft-com:office:spreadsheet}Cell'
    data_tag = '{urn:schemas-microsoft-com:office:spreadsheet}Data'
    
    for event, elem in context:
        if elem.tag == row_tag:
            row_cells = []
            for cell in elem.findall(cell_tag):
                data_elem = cell.find(data_tag)
                val = data_elem.text if data_elem is not None else ""
                row_cells.append(val)
            rows.append(row_cells)
            elem.clear() # clear memory
            
    header = rows[header_row_idx]
    header = [h.strip() if h else f"Col_{i}" for i, h in enumerate(header)]
    
    data_rows = rows[data_start_row_idx:]
    cleaned_data = []
    for r in data_rows:
        if len(r) < len(header):
            r = r + [""] * (len(header) - len(r))
        elif len(r) > len(header):
            r = r[:len(header)]
        cleaned_data.append(r)
        
    df = pd.DataFrame(cleaned_data, columns=header)
    print(f"Loaded {len(df)} rows from {os.path.basename(file_path)} in {time.time() - t0:.2f}s")
    return df

def clean_and_normalize_data():
    t0 = time.time()
    data_dir = r"C:\Users\Dell\.gemini\antigravity\scratch\peoples_priorities\backend\data"
    
    file_bv = os.path.join(data_dir, "allBlockStateWithCoveredVillage12026_07_06_23_55_42_996.xls")
    file_vg = os.path.join(data_dir, "villageGramPanchayatMapping2026_07_06_23_55_39_019.xls")
    
    df_block_vil = parse_xml_spreadsheet_to_df(file_bv, header_row_idx=4, data_start_row_idx=5)
    df_vil_gp = parse_xml_spreadsheet_to_df(file_vg, header_row_idx=4, data_start_row_idx=6)
    
    # Standardize column headers
    df_block_vil.columns = [c.replace(' ', '').replace('(', '_').replace(')', '_').replace('\n', '').strip() for c in df_block_vil.columns]
    df_vil_gp.columns = [c.replace(' ', '').replace('(', '_').replace(')', '_').replace('\n', '').strip() for c in df_vil_gp.columns]
    
    # Ensure all values are stripped of spaces
    for col in df_block_vil.columns:
        df_block_vil[col] = df_block_vil[col].astype(str).str.strip()
    for col in df_vil_gp.columns:
        df_vil_gp[col] = df_vil_gp[col].astype(str).str.strip()
        
    # Extract only needed columns
    df_bv = df_block_vil[['DistrictCode', 'DistrictName_InEnglish_', 'BlockCode', 'BlockName_InEnglish_', 'VillageCode', 'VillageName_InEnglish_']].copy()
    df_vg = df_vil_gp[['VillageCode', 'LocalBodyCode', 'LocalBodyName']].copy()
    
    # Filter empty Village Codes
    df_bv = df_bv[df_bv['VillageCode'] != '']
    df_vg = df_vg[df_vg['VillageCode'] != '']
    
    # Merge datasets on VillageCode
    merged = pd.merge(df_bv, df_vg, on='VillageCode', how='inner')
    
    # Filter out unmapped Gram Panchayats
    merged = merged[merged['LocalBodyCode'] != '']
    
    # Convert codes to numeric, dropping invalid rows
    for col in ['DistrictCode', 'BlockCode', 'LocalBodyCode', 'VillageCode']:
        merged[col] = pd.to_numeric(merged[col], errors='coerce')
        
    merged = merged.dropna(subset=['DistrictCode', 'BlockCode', 'LocalBodyCode', 'VillageCode'])
    
    # Cast to integer
    for col in ['DistrictCode', 'BlockCode', 'LocalBodyCode', 'VillageCode']:
        merged[col] = merged[col].astype(int)
        
    print(f"Data cleaning and merging completed in {time.time() - t0:.2f}s. Clean records: {len(merged)}")
    return merged

def run_bulk_insert(session, model, mappings):
    is_pg = session.bind.dialect.name == 'postgresql'
    insert_fn = pg_insert if is_pg else sqlite_insert
    
    chunk_size = 1000
    total = len(mappings)
    inserted = 0
    t0 = time.time()
    
    for i in range(0, total, chunk_size):
        chunk = mappings[i:i+chunk_size]
        stmt = insert_fn(model).values(chunk)
        stmt = stmt.on_conflict_do_nothing()
        session.execute(stmt)
        inserted += len(chunk)
        
    session.commit()
    print(f"Inserted {inserted}/{total} records for model {model.__name__} in {time.time() - t0:.2f}s")

def seed_lgd_database():
    df = clean_and_normalize_data()
    
    # Extract unique Districts
    districts_df = df[['DistrictCode', 'DistrictName_InEnglish_']].drop_duplicates(subset=['DistrictCode'])
    districts = [
        {"id": int(row['DistrictCode']), "name": row['DistrictName_InEnglish_'].strip(), "state": "Madhya Pradesh"}
        for _, row in districts_df.iterrows()
    ]
    
    # Extract unique Blocks
    blocks_df = df[['BlockCode', 'BlockName_InEnglish_', 'DistrictCode']].drop_duplicates(subset=['BlockCode'])
    blocks = [
        {"id": int(row['BlockCode']), "name": row['BlockName_InEnglish_'].strip(), "district_id": int(row['DistrictCode'])}
        for _, row in blocks_df.iterrows()
    ]
    
    # Extract unique GPs
    gps_df = df[['LocalBodyCode', 'LocalBodyName', 'BlockCode']].drop_duplicates(subset=['LocalBodyCode'])
    gps = [
        {"id": int(row['LocalBodyCode']), "name": row['LocalBodyName'].strip(), "block_id": int(row['BlockCode'])}
        for _, row in gps_df.iterrows()
    ]
    
    # Extract unique Villages
    villages_df = df[['VillageCode', 'VillageName_InEnglish_', 'LocalBodyCode']].drop_duplicates(subset=['VillageCode'])
    villages = [
        {
            "id": int(row['VillageCode']), 
            "name": row['VillageName_InEnglish_'].strip(), 
            "gram_panchayat_id": int(row['LocalBodyCode']),
            "population": 0,
            "literacy_rate": 0.0,
            "school_enrollment_ratio": 0.0,
            "distance_to_nearest_hospital_km": 0.0,
            "road_quality_index": 0.0,
            "boundary_geojson": "{}"
        }
        for _, row in villages_df.iterrows()
    ]
    
    # Create sample MP Seats
    mp_seats = [
        {"id": "mp-indore", "name": "Indore", "state": "Madhya Pradesh"},
        {"id": "mp-bhopal", "name": "Bhopal", "state": "Madhya Pradesh"},
        {"id": "mp-jabalpur", "name": "Jabalpur", "state": "Madhya Pradesh"},
        {"id": "mp-gwalior", "name": "Gwalior", "state": "Madhya Pradesh"},
        {"id": "mp-agar-malwa", "name": "Agar-Malwa", "state": "Madhya Pradesh"}
    ]
    
    # Map seats to blocks
    # district code mappings: Indore: 410, Bhopal: 396, Jabalpur: 411, Gwalior: 407, Agar-Malwa: 667
    seat_districts = {
        "mp-indore": 410,
        "mp-bhopal": 396,
        "mp-jabalpur": 411,
        "mp-gwalior": 407,
        "mp-agar-malwa": 667
    }
    
    constituency_blocks = []
    for seat_id, dist_code in seat_districts.items():
        # Get blocks in this district
        dist_blocks = [b["id"] for b in blocks if b["district_id"] == dist_code]
        for b_id in dist_blocks:
            constituency_blocks.append({"constituency_id": seat_id, "block_id": b_id})
            
    print(f"\nPrepared Seeding Counts:")
    print(f"Districts: {len(districts)}")
    print(f"Blocks: {len(blocks)}")
    print(f"Gram Panchayats: {len(gps)}")
    print(f"Villages: {len(villages)}")
    print(f"MP Seats: {len(mp_seats)}")
    print(f"Constituency-Block Mappings: {len(constituency_blocks)}")
    
    # Execute inserting
    print("\nStarting bulk database insertion...")
    SQLModel.metadata.create_all(engine)
    
    with Session(engine) as session:
        # Seed MP Seats first (no dependencies)
        run_bulk_insert(session, MPSeat, mp_seats)
        # Seed Districts
        run_bulk_insert(session, District, districts)
        # Seed Blocks
        run_bulk_insert(session, Block, blocks)
        # Seed GP
        run_bulk_insert(session, GramPanchayat, gps)
        # Seed Villages
        run_bulk_insert(session, Village, villages)
        # Seed constituency_blocks junction
        run_bulk_insert(session, ConstituencyBlock, constituency_blocks)
        
    print("\nDatabase Seeding Completed Successfully!")

if __name__ == "__main__":
    seed_lgd_database()
