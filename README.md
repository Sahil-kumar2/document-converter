# 📄 Document Converter Web Application

A full-stack document conversion platform that allows users to upload files and convert them between formats directly from the browser.

This project integrates **frontend UI, backend APIs, system-level tools, and Python scripts** to perform real document processing.

---

## 🚀 Features

Supports the following conversions:

- Word → PDF  
- Excel → PDF  
- PowerPoint → PDF  
- PDF → Word  
- PDF → Excel  

Files are processed on the server and returned as downloads. Temporary files are automatically cleaned up.

---

## 🧠 Tech Stack

### Frontend
- React (Vite)
- Tailwind CSS
- Axios

### Backend
- Node.js
- Express.js
- Multer (file upload)
- child_process (run OS commands)
- fs & path modules

### Conversion Engines
- LibreOffice (Headless CLI mode)
- Python scripts:
  - pdf2docx (PDF → Word)
  - camelot + pandas (PDF → Excel)

---

## 👨‍💻 Author

**Sahil Kumar**  


