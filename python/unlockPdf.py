import sys
import pikepdf

if len(sys.argv) < 4:
    print("Missing arguments")
    sys.exit(1)

input_path = sys.argv[1]
output_path = sys.argv[2]
password = sys.argv[3]

restricted_keywords = [
    "government",
    "ministry",
    "department",
    "govt",
    "republic of india",
    "unique identification authority of india",
    "aadhaar",
    "aadhar",
    "pan card",
    "income tax department",
    "passport",
    "voter id",
    "election commission",
    "driving licence",
    "gov.in",
]

try:
    with pikepdf.open(input_path, password=password) as pdf:

        # ===============================
        # 1️⃣ Check Metadata
        # ===============================
        metadata = str(pdf.docinfo).lower()

        for word in restricted_keywords:
            if word in metadata:
                print("ERROR: Restricted document cannot be unlocked")
                sys.exit(5)

        # ===============================
        # 2️⃣ Extract REAL Page Text
        # ===============================
        for page in pdf.pages:
            try:
                text = page.extract_text()
                if text:
                    text_lower = text.lower()
                    for word in restricted_keywords:
                        if word in text_lower:
                            print("ERROR: Restricted document cannot be unlocked")
                            sys.exit(6)
            except Exception:
                continue

        # ===============================
        # 3️⃣ Safe → Unlock
        # ===============================
        pdf.save(output_path)

    print("SUCCESS")

except pikepdf.PasswordError:
    print("ERROR: invalid password")
    sys.exit(2)

except Exception as e:
    print(f"ERROR: {str(e)}")
    sys.exit(1)
