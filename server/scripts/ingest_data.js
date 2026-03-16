import { Pinecone } from '@pinecone-database/pinecone';
import { pipeline } from '@xenova/transformers';
import dotenv from 'dotenv';

dotenv.config();

const KNOWLEDGE_BASE = [
    {
        id: "intro",
        text: "AIO FileFlow is a free, fast, and easy-to-use online platform for file conversion and document manipulation. No registration is required. The website is officially called 'AIO FileFlow' with the tagline: 'Every tool you need to work with PDFs & images.' 100% Free to use — No hidden charges. No registration required — Start using immediately. Secure — Files are processed and not stored permanently. Fast processing — Powered by modern server-side tools. Supports multiple file uploads — Convert several files at once. Works on any device — Responsive design for desktop, tablet, and mobile. No installation needed — Everything runs in the browser."
    },
    {
        id: "how_to_use",
        text: "HOW TO USE: 1. Go to the homepage or select a specific tool. 2. Upload your file(s) by clicking 'Select your file(s)' or drag-and-drop. 3. Configure options if available (e.g., compression level, page ranges). 4. Click the action button (Convert, Merge, Split, etc.). 5. Download the result."
    },
    {
        id: "pdf_tools_1",
        text: "PDF Tools Part 1: 1. Sign PDF (/sign-pdf) — Add digital signatures (text or image) to PDF documents. 2. Protect PDF (/protect-pdf) — Password-protect PDF files with encryption. 3. Unlock PDF (/unlock-pdf) — Remove passwords from protected PDFs. 4. Organize PDF (/organize-pdf) — Reorder, rearrange pages in a PDF. 5. Compress PDF (/compress-pdf) — Reduce PDF file size (low/medium/high compression). 6. Merge PDFs (/merge-pdf) — Combine multiple PDF files into one. 7. Split PDF (/split-pdf) — Separate a PDF into multiple files (by page or custom ranges)."
    },
    {
        id: "pdf_tools_2",
        text: "PDF Tools Part 2: 8. Remove Pages (/remove-pages) — Delete specific pages from a PDF. 9. Extract Pages (/extract-pages) — Extract specific pages into a new PDF. 10. Rotate Pages (/rotate-pages) — Rotate PDF pages (90°, 180°, 270°) individually or in bulk. 11. Crop PDF (/crop-pdf) — Trim/crop PDF pages to a specific area. 12. Add Watermark (/watermark-pdf) — Add text or image watermarks to PDFs with custom position, opacity, font, and rotation. 13. Add Page Numbers (/add-page-numbers) — Add page numbers with custom positioning, font, and styling. 14. Redact PDF (/redact-pdf) — Permanently hide/black out sensitive information. 15. Repair PDF (/repair-pdf) — Fix corrupted or damaged PDF files. 16. Convert to PDF/A (/pdf-to-pdfa) — Convert to archival PDF/A format (PDF/A-1b, 2b, 3b). 17. Edit PDF (/edit-pdf) — Add and edit text directly on PDF pages."
    },
    {
        id: "image_tools",
        text: "Image Tools: 1. Black & White (/black-white-image) — Convert images to grayscale/B&W. 2. Image to Text (/image-to-text) — OCR: Extract text from images. 3. Scan to PDF (/scan-to-pdf) — Create PDF documents from scanned images. 4. JPG to PNG (/jpg-to-png) — Convert JPG images to PNG format. 5. PNG to JPG (/png-to-jpg) — Convert PNG images to JPG format. 6. JPG to PDF (/jpg-to-pdf) — Convert JPG images to PDF documents. 7. WEBP to JPG (/webp-to-jpg) — Convert WEBP images to JPG. 8. WEBP to PNG (/webp-to-png) — Convert WEBP images to PNG."
    },
    {
        id: "quick_conversions",
        text: "Quick Conversions: 1. PDF to DOCX (/pdf-to-docx) — Convert PDF to editable Word documents. 2. DOCX to PDF (/docx-to-pdf) — Convert Word documents to PDF. 3. PDF to XLSX (/pdf-to-xlsx) — Convert PDF to Excel spreadsheets. 4. Excel to PDF (/xlsx-to-pdf) — Convert Excel files to PDF. 5. PDF to JPG (/pdf-to-jpg) — Convert PDF pages to JPG images. 6. PDF to PNG (/pdf-to-png) — Convert PDF pages to PNG images. 7. PDF to HTML (/pdf-to-html) — Convert PDF to web HTML format. 8. PDF to PPTX (/pdf-to-pptx) — Convert PDF to PowerPoint presentations. 9. HTML to PDF (/html-to-pdf) — Convert web pages/HTML to PDF."
    },
    {
        id: "other_features",
        text: "Other Features: - Merge Excel Files (/merge-excel) — Combine multiple XLSX files into one. - AI Image Generation (/generate-image) — Generate images from text prompts using AI. - Multiple File Upload — Upload and convert multiple files at once (results as ZIP)."
    }
];

async function ingest() {
    console.log("Starting data ingestion...");
    console.log("Initializing Pinecone...");

    if (!process.env.PINECONE_API_KEY) {
        console.error("Missing PINECONE_API_KEY in .env");
        process.exit(1);
    }

    const pc = new Pinecone({
        apiKey: process.env.PINECONE_API_KEY,
    });

    // Check if index exists, create if not
    const indexName = process.env.PINECONE_INDEX_NAME || 'aio-fileflow-chatbot';

    const existingIndexes = await pc.listIndexes();
    if (!existingIndexes.indexes.some(idx => idx.name === indexName)) {
        console.log(`Creating index "${indexName}" (this might take a few minutes)...`);
        await pc.createIndex({
            name: indexName,
            dimension: 384, // for all-MiniLM-L6-v2
            metric: 'cosine',
            spec: {
                serverless: {
                    cloud: 'aws',
                    region: 'us-east-1'
                }
            }
        });

        // Wait a bit for the index to be ready
        console.log("Waiting for index to initialize...");
        await new Promise(resolve => setTimeout(resolve, 10000));
    }

    const index = pc.Index(indexName);

    console.log("Loading embedding model...");
    // Using pipeline from @xenova/transformers
    const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');

    const vectors = [];

    for (const item of KNOWLEDGE_BASE) {
        console.log(`Embedding chunk: ${item.id}`);

        // Generate embedding
        const output = await extractor(item.text, { pooling: 'mean', normalize: true });

        // Convert Float32Array to standard JS array
        const embeddingArray = Array.from(output.data);

        vectors.push({
            id: item.id,
            values: embeddingArray,
            metadata: {
                text: item.text
            }
        });
    }

    console.log("Upserting vectors to Pinecone...");
    await index.upsert({ records: vectors });

    console.log("Ingestion completed successfully!");
}

ingest().catch(err => {
    console.error("Error during ingestion:", err);
    process.exit(1);
});
