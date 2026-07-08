import xml.etree.ElementTree as ET
import glob
import os
import json

data_dir = r"C:\Users\Dell\.gemini\antigravity\scratch\peoples_priorities\backend\data"
xls_files = glob.glob(os.path.join(data_dir, "*.xls"))

namespaces = {'ss': 'urn:schemas-microsoft-com:office:spreadsheet'}

file_headers = {}

for f in sorted(xls_files):
    filename = os.path.basename(f)
    print(f"Reading {filename}...")
    try:
        # We only need the first few elements to see the headers. Let's parse incrementally or stop after some rows.
        rows = []
        # ElementTree iterparse is faster and uses less memory
        context = ET.iterparse(f, events=('end',))
        for event, elem in context:
            if elem.tag == '{urn:schemas-microsoft-com:office:spreadsheet}Row':
                row_cells = []
                for cell in elem.findall('{urn:schemas-microsoft-com:office:spreadsheet}Cell'):
                    data_elem = cell.find('{urn:schemas-microsoft-com:office:spreadsheet}Data')
                    val = data_elem.text if data_elem is not None else ""
                    row_cells.append(val)
                rows.append(row_cells)
                elem.clear() # clear memory
                if len(rows) >= 10:
                    break
        
        file_headers[filename] = rows
    except Exception as e:
        file_headers[filename] = f"Error: {str(e)}"

# Save to a JSON file for inspection
output_file = r"C:\Users\Dell\.gemini\antigravity\scratch\peoples_priorities\backend\data_headers.json"
with open(output_file, 'w', encoding='utf-8') as jf:
    json.dump(file_headers, jf, indent=2, ensure_ascii=False)

print(f"Headers saved to {output_file}")
