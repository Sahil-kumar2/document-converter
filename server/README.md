# PDF Tools API

Express.js backend for PDF tools: **Split**, **Crop**, **Extract**, **Rotate**, **Watermark**, **Redact**, **PDF/A**.

## Stack

- Node.js, Express.js, REST APIs
- pdf-lib, multer, archiver
- Controller → Service architecture

## Setup

```bash
npm install
npm start
```

Server: `http://localhost:3000`

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /health | Health check |
| POST | /api/pdf/split | Split PDF (each page → ZIP, or range → single PDF) |
| POST | /api/pdf/crop | Crop PDF (cropBox + optional pageNumbers) |
| POST | /api/pdf/extract | Extract pages into new PDF |
| POST | /api/pdf/rotate | Rotate PDF (90°, 180°, 270°) |
| POST | /api/pdf/watermark | Add text watermark to PDF |
| POST | /api/pdf/redact | Redact PDF (by text or areas; flattens to remove text permanently) |
| POST | /api/pdf/pdfa | Convert PDF to PDF/A (requires Ghostscript) |

See **POSTMAN.md** and **postman/PDF-Tools-API.postman_collection.json** for Postman usage.

## Folder structure

- `controllers/` – request/response only
- `services/` – PDF business logic
- `routes/` – route definitions
- `utils/` – multer, page-range parser, cleanup, errors
