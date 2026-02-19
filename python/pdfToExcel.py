# import camelot
# import sys
# import pandas as pd
# from PyPDF2 import PdfReader

# pdf_file = sys.argv[1]
# excel_file = sys.argv[2]

# tables = camelot.read_pdf(pdf_file, pages='all')

# if tables and len(tables) > 0:
#     df = pd.concat([table.df for table in tables])
#     df.to_excel(excel_file, index=False)
# else:
#     # Fallback: extract plain text into Excel
#     reader = PdfReader(pdf_file)
#     text_data = []

#     for page in reader.pages:
#         text_data.append([page.extract_text()])

#     df = pd.DataFrame(text_data, columns=["PDF Text"])
#     df.to_excel(excel_file, index=False)


# import camelot
# import sys
# import pandas as pd
# from PyPDF2 import PdfReader

# pdf_file = sys.argv[1]
# excel_file = sys.argv[2]

# # Try Lattice first (best for proper tables)
# tables = camelot.read_pdf(pdf_file, pages='all', flavor='lattice')

# if len(tables) == 0:
#     # If lattice fails, try stream
#     tables = camelot.read_pdf(pdf_file, pages='all', flavor='stream')

# if len(tables) > 0:
#     writer = pd.ExcelWriter(excel_file, engine='openpyxl')
    
#     for i, table in enumerate(tables):
#         df = table.df
        
#         # First row ko header bana dete hain
#         df.columns = df.iloc[0]
#         df = df[1:]
        
#         df.to_excel(writer, sheet_name=f"Table_{i+1}", index=False)

#     writer.close()

# else:
#     # Fallback: extract plain text into Excel
#     reader = PdfReader(pdf_file)
#     text_data = []

#     for page in reader.pages:
#         text_data.append([page.extract_text()])

#     df = pd.DataFrame(text_data, columns=["PDF Text"])
#     df.to_excel(excel_file, index=False)



import camelot
import sys
import pandas as pd
from PyPDF2 import PdfReader

try:
    pdf_file = sys.argv[1]
    excel_file = sys.argv[2]

    print(f"Processing: {pdf_file}")

    # 🔹 Try Lattice first (best for bordered tables)
    tables = camelot.read_pdf(pdf_file, pages='all', flavor='lattice')

    # 🔹 If no tables found, try Stream
    if len(tables) == 0:
        tables = camelot.read_pdf(pdf_file, pages='all', flavor='stream')

    if len(tables) > 0:
        with pd.ExcelWriter(excel_file, engine='openpyxl') as writer:
            for i, table in enumerate(tables):
                df = table.df

                # First row as header
                if len(df) > 1:
                    df.columns = df.iloc[0]
                    df = df[1:]

                df.to_excel(writer, sheet_name=f"Table_{i+1}", index=False)

        print("SUCCESS")
        sys.exit(0)

    else:
        # 🔹 Fallback: extract plain text
        reader = PdfReader(pdf_file)
        text_data = []

        for page in reader.pages:
            text = page.extract_text()
            if text:
                text_data.append([text])

        df = pd.DataFrame(text_data, columns=["PDF Text"])
        df.to_excel(excel_file, index=False)

        print("NO_TABLE_FOUND_TEXT_EXPORTED")
        sys.exit(0)

except Exception as e:
    print("ERROR:", str(e))
    sys.exit(1)
