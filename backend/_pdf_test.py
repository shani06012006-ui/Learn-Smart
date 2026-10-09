import sys
from pypdf import PdfReader
path = r"C:\path\to\1st Std English FL Part - 1.pdf"   # change to real path
reader = PdfReader(path)
total = 0
for i, page in enumerate(reader.pages[:3]):
    t = page.extract_text() or ""
    total += len(t)
    print(f"Page {i+1}: {len(t)} chars")
print(f"Total (first 3 pages): {total} chars")
print("SAMPLE:", repr((reader.pages[0].extract_text() or "")[:200]))