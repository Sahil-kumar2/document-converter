import sys
import fitz
import base64

try:
    pdf_bytes = sys.stdin.buffer.read()
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")

    html_output = "<html><head><meta charset='utf-8'></head><body>"
    complex_layout = False

    for page in doc:
        blocks = page.get_text("blocks")

        # Detect multiple columns
        x_positions = [block[0] for block in blocks]
        unique_columns = len(set([round(x, -1) for x in x_positions]))

        if unique_columns > 2:
            complex_layout = True

        html_output += page.get_text("html")

    html_output += "</body></html>"

    # 🔥 If complex layout detected → fallback to image
    if complex_layout:
        html_output = "<html><body style='margin:0;padding:0;'>"

        for page in doc:
            pix = page.get_pixmap(dpi=180)
            img_bytes = pix.tobytes("png")
            base64_img = base64.b64encode(img_bytes).decode("utf-8")

            html_output += f"""
            <div style="text-align:center;">
                <img src="data:image/png;base64,{base64_img}" 
                     style="width:100%;max-width:900px;margin-bottom:20px;"/>
            </div>
            """

        html_output += "</body></html>"

    print(html_output)

except Exception as e:
    print(f"<h1>Error</h1><p>{str(e)}</p>")
    sys.exit(1)
