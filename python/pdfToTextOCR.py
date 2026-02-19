import sys
import fitz
import pytesseract
import cv2
import numpy as np

# Windows only (if needed)
pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

try:
    pdf_bytes = sys.stdin.buffer.read()

    doc = fitz.open(stream=pdf_bytes, filetype="pdf")

    final_text = ""

    for page in doc:
        pix = page.get_pixmap(dpi=200)
        img_bytes = pix.tobytes("png")

        np_arr = np.frombuffer(img_bytes, np.uint8)
        img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

        thresh = cv2.adaptiveThreshold(
            gray, 255,
            cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY,
            11, 2
        )

        custom_config = r'--oem 3 --psm 6'

        text = pytesseract.image_to_string(thresh, config=custom_config)

        final_text += text + "\n\n"

    print(final_text.strip())

except Exception as e:
    print("")
    sys.exit(1)
