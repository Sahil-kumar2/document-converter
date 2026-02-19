import sys
import pytesseract
import cv2
import numpy as np
import json

pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"


try:
    file_bytes = sys.stdin.buffer.read()

    np_arr = np.frombuffer(file_bytes, np.uint8)
    img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

    if img is None:
        print(json.dumps({"text": ""}))
        sys.exit(0)

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    _, thresh = cv2.threshold(gray, 150, 255, cv2.THRESH_BINARY)

    text = pytesseract.image_to_string(thresh)

    print(json.dumps({
        "text": text.strip()
    }))

except Exception:
    print(json.dumps({"text": ""}))
    sys.exit(0)
