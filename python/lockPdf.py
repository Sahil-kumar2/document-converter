import sys
from PyPDF2 import PdfReader, PdfWriter

input_file = sys.argv[1]
output_file = sys.argv[2]
password = sys.argv[3]

reader = PdfReader(input_file)
writer = PdfWriter()

for page in reader.pages:
    writer.add_page(page)

# PyPDF2 3.0.x compatibility (no algorithm argument)
writer.encrypt(user_password=password, owner_password=password, use_128bit=True)

with open(output_file, "wb") as f:
    writer.write(f)