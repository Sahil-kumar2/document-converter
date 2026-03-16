import { index } from "../config/pinecone.js";
import { createEmbedding } from "../services/embedService.js";

const documents = [
    // 📄 PDF Tools
    {
        id: "sign_pdf",
        title: "Sign PDF Tool",
        content: "Our Sign PDF tool allows you to add digital signatures (text or image) to your PDF documents easily and securely.",
        url: "https://aiofileflow.com/sign-pdf",
    },
    {
        id: "protect_pdf",
        title: "Protect PDF Tool",
        content: "Use the Protect PDF tool to password-protect your PDF files with strong encryption to prevent unauthorized access.",
        url: "https://aiofileflow.com/protect-pdf",
    },
    {
        id: "unlock_pdf",
        title: "Unlock PDF Tool",
        content: "The Unlock PDF tool helps you remove passwords and restrictions from protected PDF files.",
        url: "https://aiofileflow.com/unlock-pdf",
    },
    {
        id: "organize_pdf",
        title: "Organize PDF Tool",
        content: "Use the Organize PDF tool to reorder, rearrange, and sort the pages in your PDF document exactly how you want them.",
        url: "https://aiofileflow.com/organize-pdf",
    },
    {
        id: "compress_pdf",
        title: "Compress PDF Tool",
        content: "Use the Compress PDF tool to reduce the size of large PDF files. You can choose between low, medium, and high compression levels.",
        url: "https://aiofileflow.com/compress-pdf",
    },
    {
        id: "merge_pdf",
        title: "Merge PDF Tool",
        content: "Use the Merge PDF tool to combine multiple PDF files into a single, cohesive document.",
        url: "https://aiofileflow.com/merge-pdf",
    },
    {
        id: "split_pdf",
        title: "Split PDF Tool",
        content: "The Split PDF tool allows you to separate a PDF into multiple files, either by individual pages or by custom page ranges.",
        url: "https://aiofileflow.com/split-pdf",
    },
    {
        id: "remove_pages",
        title: "Remove Pages Tool",
        content: "Use the Remove Pages tool to delete specific, unwanted pages from your PDF document.",
        url: "https://aiofileflow.com/remove-pages",
    },
    {
        id: "extract_pages",
        title: "Extract Pages Tool",
        content: "The Extract Pages tool lets you pull out specific pages from a PDF and save them as a new, separate PDF file.",
        url: "https://aiofileflow.com/extract-pages",
    },
    {
        id: "rotate_pages",
        title: "Rotate Pages Tool",
        content: "Use the Rotate Pages tool to rotate PDF pages by 90°, 180°, or 270°. You can rotate individual pages or the entire document.",
        url: "https://aiofileflow.com/rotate-pages",
    },
    {
        id: "crop_pdf",
        title: "Crop PDF Tool",
        content: "The Crop PDF tool allows you to trim and crop the margins or specific areas of your PDF pages.",
        url: "https://aiofileflow.com/crop-pdf",
    },
    {
        id: "add_watermark",
        title: "Add Watermark Tool",
        content: "Our Add Watermark tool lets you stamp text or image watermarks onto your PDFs. You can customize the position, opacity, font, and rotation.",
        url: "https://aiofileflow.com/watermark-pdf",
    },
    {
        id: "add_page_numbers",
        title: "Add Page Numbers Tool",
        content: "Use the Add Page Numbers tool to insert page numbers into your PDF. You can customize the positioning, font style, and format.",
        url: "https://aiofileflow.com/add-page-numbers",
    },
    {
        id: "redact_pdf",
        title: "Redact PDF Tool",
        content: "The Redact PDF tool allows you to permanently hide or black out sensitive and confidential information from your PDF files.",
        url: "https://aiofileflow.com/redact-pdf",
    },
    {
        id: "repair_pdf",
        title: "Repair PDF Tool",
        content: "If you have a corrupted or damaged PDF file, our Repair PDF tool can help attempt to fix and recover the document's contents.",
        url: "https://aiofileflow.com/repair-pdf",
    },
    {
        id: "pdf_to_pdfa",
        title: "Convert to PDF/A Tool",
        content: "Use the Convert to PDF/A tool to transform your standard PDFs into the PDF/A archival format (supports PDF/A-1b, 2b, 3b) for long-term preservation.",
        url: "https://aiofileflow.com/pdf-to-pdfa",
    },
    {
        id: "edit_pdf",
        title: "Edit PDF Tool",
        content: "The Edit PDF tool allows you to add and edit text directly on the pages of your PDF document.",
        url: "https://aiofileflow.com/edit-pdf",
    },

    // 🖼️ Image Tools
    {
        id: "black_white_image",
        title: "Black & White Image Tool",
        content: "Convert your color images to grayscale or black and white using our Black & White Image tool.",
        url: "https://aiofileflow.com/black-white-image",
    },
    {
        id: "image_to_text",
        title: "Image to Text (OCR) Tool",
        content: "Extract text from images automatically using Optical Character Recognition (OCR) with our Image to Text tool.",
        url: "https://aiofileflow.com/image-to-text",
    },
    {
        id: "scan_to_pdf",
        title: "Scan to PDF Tool",
        content: "Turn your scanned document images into high-quality PDF files with the Scan to PDF tool.",
        url: "https://aiofileflow.com/scan-to-pdf",
    },
    {
        id: "jpg_to_png",
        title: "JPG to PNG Tool",
        content: "Easily convert JPG images to the PNG format without losing quality.",
        url: "https://aiofileflow.com/jpg-to-png",
    },
    {
        id: "png_to_jpg",
        title: "PNG to JPG Tool",
        content: "Convert PNG images into the space-saving JPG format quickly and easily.",
        url: "https://aiofileflow.com/png-to-jpg",
    },
    {
        id: "jpg_to_pdf",
        title: "JPG to PDF Tool",
        content: "Combine one or more JPG images into a single PDF document.",
        url: "https://aiofileflow.com/jpg-to-pdf",
    },
    {
        id: "webp_to_jpg",
        title: "WEBP to JPG Tool",
        content: "Convert the modern web WEBP image format into standard JPG files for wider compatibility.",
        url: "https://aiofileflow.com/webp-to-jpg",
    },
    {
        id: "webp_to_png",
        title: "WEBP to PNG Tool",
        content: "Convert WEBP images into high-quality PNG graphics with transparent backgrounds.",
        url: "https://aiofileflow.com/webp-to-png",
    },

    // ⚡ Quick Conversions
    {
        id: "pdf_to_docx",
        title: "PDF to DOCX (Word) Tool",
        content: "Convert your PDF files into fully editable Microsoft Word (DOCX) documents.",
        url: "https://aiofileflow.com/pdf-to-docx",
    },
    {
        id: "docx_to_pdf",
        title: "DOCX (Word) to PDF Tool",
        content: "Transform Microsoft Word (DOCX) documents into secure, universally readable PDF files.",
        url: "https://aiofileflow.com/docx-to-pdf",
    },
    {
        id: "pdf_to_xlsx",
        title: "PDF to Excel (XLSX) Tool",
        content: "Extract tables and data from PDF files and convert them into editable Excel (XLSX) spreadsheets.",
        url: "https://aiofileflow.com/pdf-to-xlsx",
    },
    {
        id: "xlsx_to_pdf",
        title: "Excel (XLSX) to PDF Tool",
        content: "Convert your Excel spreadsheets (XLSX) into clean, ready-to-print PDF documents.",
        url: "https://aiofileflow.com/xlsx-to-pdf",
    },
    {
        id: "pdf_to_jpg",
        title: "PDF to JPG Tool",
        content: "Extract pages from your PDF and save them as high-quality JPG image files.",
        url: "https://aiofileflow.com/pdf-to-jpg",
    },
    {
        id: "pdf_to_png",
        title: "PDF to PNG Tool",
        content: "Convert pages of your PDF document into crisp PNG image files.",
        url: "https://aiofileflow.com/pdf-to-png",
    },
    {
        id: "pdf_to_html",
        title: "PDF to HTML Tool",
        content: "Convert your PDF documents into web-ready HTML code to embed or display on websites.",
        url: "https://aiofileflow.com/pdf-to-html",
    },
    {
        id: "pdf_to_pptx",
        title: "PDF to PowerPoint (PPTX) Tool",
        content: "Transform your PDF files into editable Microsoft PowerPoint presentations.",
        url: "https://aiofileflow.com/pdf-to-pptx",
    },
    {
        id: "html_to_pdf",
        title: "HTML to PDF Tool",
        content: "Convert web pages or raw HTML code into polished PDF documents.",
        url: "https://aiofileflow.com/html-to-pdf",
    },

    // 📊 Other Features & General Info
    {
        id: "merge_excel",
        title: "Merge Excel Files Tool",
        content: "Use the Merge Excel tool to combine multiple XLSX spreadsheet files into a single master spreadsheet.",
        url: "https://aiofileflow.com/excel-merge",
    },
    {
        id: "ai_image_gen",
        title: "AI Image Generation Tool",
        content: "Generate stunning custom images from text prompts using advanced AI models directly within AIO FileFlow.",
        url: "https://aiofileflow.com/ai-image-generation",
    },
    {
        id: "general_features",
        title: "AIO FileFlow Features and Pricing",
        content: "AIO FileFlow is a completely free, fast, and easy-to-use online platform for file conversion and document manipulation. Everything is 100% free with no hidden charges, and absolutely no registration or account creation is required to start using our 34+ tools. Our platform works directly in the browser across desktops, tablets, and mobile devices, requiring no software installation.",
        url: "https://aiofileflow.com/",
    },
    {
        id: "privacy_security",
        title: "AIO FileFlow Privacy and Security",
        content: "At AIO FileFlow, your privacy and security are our top priorities. Files are processed securely on modern servers and are not stored permanently. Uploaded files are automatically deleted after processing.",
        url: "https://aiofileflow.com/",
    },
    {
        id: "batch_conversion",
        title: "Multiple File Upload and Batch Conversion",
        content: "AIO FileFlow supports multiple file uploads. You can upload and convert several files at once, and simply download a convenient ZIP file containing all your processed results.",
        url: "https://aiofileflow.com/",
    }
];

const upload = async () => {
    const vectors = [];

    for (const doc of documents) {
        const embedding = await createEmbedding(doc.content);

        vectors.push({
            id: doc.id,
            values: embedding,
            metadata: {
                title: doc.title,
                content: doc.content,
                url: doc.url,
            },
        });
    }

    await index.upsert(vectors);

    console.log("Knowledge uploaded to Pinecone");
};

upload();
