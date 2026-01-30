import camelot
import sys
import pandas as pd
from PyPDF2 import PdfReader

pdf_file = sys.argv[1]
excel_file = sys.argv[2]

tables = camelot.read_pdf(pdf_file, pages='all')

if tables and len(tables) > 0:
    df = pd.concat([table.df for table in tables])
    df.to_excel(excel_file, index=False)
else:
    # Fallback: extract plain text into Excel
    reader = PdfReader(pdf_file)
    text_data = []

    for page in reader.pages:
        text_data.append([page.extract_text()])

    df = pd.DataFrame(text_data, columns=["PDF Text"])
    df.to_excel(excel_file, index=False)
