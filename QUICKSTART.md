# ⚡ Quick Start Guide

Get the Document Converter running in 2 minutes!

## 1️⃣ Start Backend Server

```bash
cd server
npm start
```

**Expected Output:**
```
Server running on port 9000
```

✅ Backend is now ready at `http://localhost:9000`

## 2️⃣ Start Frontend Server

Open a **new terminal** and run:

```bash
cd client
npm run dev
```

**Expected Output:**
```
VITE v7.3.1 ready in 586 ms
➜ Local: http://localhost:5174/
```

✅ Frontend is now ready at `http://localhost:5174`

## 3️⃣ Open in Browser

Click the link or paste in your browser:

```
http://localhost:5174
```

🎉 **That's it! You're ready to convert files!**

---

## 🎯 What You Can Do Right Now

### Quick Convert Tab
1. Upload any supported file (PDF, DOCX, Image, etc.)
2. Select target format
3. Click "Convert File"
4. Download result

### PDF Tools Tab
1. Upload a PDF
2. Choose a tool (Split, Extract, Rotate, Watermark, etc.)
3. Configure options
4. Download result

### Image Tools Tab
1. Upload an image
2. Choose tool (B&W, OCR, Format conversion)
3. Download result

---

## 📋 Supported Conversions

### PDF → Convert to
- DOCX (Word)
- XLSX (Excel)
- PNG (Image)
- JPG (Image)

### Images → Convert to
- PNG
- JPG

### Documents → Convert to
- DOCX → PDF
- XLSX → PDF
- PPT/PPTX → PDF

---

## 🔧 Configuration

Both servers are pre-configured and ready to go!

### Backend (Already Set)
- Port: 9000
- File: `server/.env`
- Setting: `PORT=9000`

### Frontend (Already Set)
- Port: 5174
- File: `client/.env`
- Setting: `VITE_API_URL=http://localhost:9000`

---

## ✨ Features

✅ Drag-and-drop file upload
✅ Real-time loading indicators
✅ Advanced PDF tools
✅ Image processing
✅ Error handling with helpful messages
✅ One-click downloads
✅ Mobile responsive UI
✅ Modern design

---

## 🆘 Troubleshooting

### "Cannot find port 9000"
```bash
# Kill process using port 9000 (Windows)
netstat -ano | findstr :9000
taskkill /PID <PID> /F
```

### "Vite port 5173 in use"
Vite automatically tries port 5174 - just use that instead!

### Files won't download
- Check browser's download settings
- Look for download prompt in browser
- Check firewall/antivirus blocking

### "Failed to connect to backend"
1. Make sure backend is running on port 9000
2. Check browser console (F12) for errors
3. Verify `.env` file has correct URL

---

## 📱 Try These Features

### 1. Convert a PDF to Word
- Upload any PDF file
- Select "docx" format
- Download DOCX file

### 2. Split a PDF
- Go to PDF Tools
- Upload PDF
- Click "Split PDF"
- Download split files

### 3. Extract Text from Image
- Go to Image Tools
- Upload image
- Click "Extract Text"
- Get extracted text

---

## 📚 Learn More

For detailed information:
- [FRONTEND_INTEGRATION.md](./client/FRONTEND_INTEGRATION.md) - Complete guide
- [API_USAGE_EXAMPLES.md](./client/API_USAGE_EXAMPLES.md) - Code examples
- [README_FRONTEND.md](./README_FRONTEND.md) - Full project overview

---

## 🎊 You're All Set!

Both servers are running and ready to convert files.

### Next Steps:
1. ✅ Open `http://localhost:5174`
2. ✅ Upload a file
3. ✅ Convert it
4. ✅ Download result

**Enjoy! 🚀**
