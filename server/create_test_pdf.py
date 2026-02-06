from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
import os

# Create a simple test PDF
pdf_path = 'test_sign.pdf'
c = canvas.Canvas(pdf_path, pagesize=letter)
c.setFont('Helvetica', 24)
c.drawString(100, 750, 'Test Document for Signing')
c.setFont('Helvetica', 12)
c.drawString(100, 700, 'This is a test document.')
c.drawString(100, 650, 'Sign it to verify the feature works.')

# Add multiple pages to test page selection
c.showPage()
c.setFont('Helvetica', 24)
c.drawString(100, 750, 'Page 2 - Another Test Document')
c.setFont('Helvetica', 12)
c.drawString(100, 700, 'This is the second page.')
c.drawString(100, 650, 'You can add signatures on any page.')
c.showPage()
c.save()
print(f'Created {pdf_path}')
