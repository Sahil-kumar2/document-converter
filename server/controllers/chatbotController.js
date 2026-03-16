import dotenv from "dotenv";
import { Pinecone } from '@pinecone-database/pinecone';
import { pipeline } from '@xenova/transformers';

dotenv.config();

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_API_KEY = process.env.GROQ_API_KEY;

// Keep models loaded in memory for faster subsequent requests
let extractor = null;
let pineconeIndex = null;

const SYSTEM_PROMPT_TEMPLATE = `You are the AIO FileFlow Assistant — a friendly, helpful AI chatbot embedded on the website https://aiofileflow.com.

Your job is to help users understand and navigate the website. Answer questions about available tools, how to use them, supported file formats, and general website usage. Be concise, friendly, and always guide users to the right tool when possible.

IMPORTANT RULES:
- Only answer questions related to AIO FileFlow and its features.
- If someone asks something unrelated to the website (e.g., coding questions, general knowledge), politely redirect them: "I'm the AIO FileFlow assistant — I can help you with file conversions, PDF tools, and more! What would you like to do with your files?"
- Never make up features that don't exist in the provided context.
- Always be encouraging and helpful.
- Keep answers concise (2-4 sentences typically).
- When mentioning a tool, include the direct URL path so users can click to navigate (e.g., "You can use our **PDF to Word** tool at [aiofileflow.com/pdf-to-docx](https://aiofileflow.com/pdf-to-docx)").

CONTEXT INFORMATION:
Here is some relevant information retrieved from our knowledge base to help you answer the user's question:
{context}`;

// Lazy load resources
async function initRAG() {
    if (!extractor) {
        console.log("Loading embedding model...");
        extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    }

    if (!pineconeIndex && process.env.PINECONE_API_KEY) {
        console.log("Initializing Pinecone client...");
        const pc = new Pinecone({
            apiKey: process.env.PINECONE_API_KEY,
        });
        const indexName = process.env.PINECONE_INDEX_NAME || 'aio-fileflow-chatbot';
        pineconeIndex = pc.Index(indexName);
    }
}

export const chatWithBot = async (req, res) => {
    try {
        const { message, history = [] } = req.body;

        if (!message || typeof message !== "string" || !message.trim()) {
            return res.status(400).json({ error: "Message is required" });
        }

        if (!GROQ_API_KEY) {
            return res.status(500).json({ error: "Chatbot is not configured. Missing API key." });
        }

        if (!process.env.PINECONE_API_KEY) {
            console.warn("Pinecone API key missing. RAG will not work.");
        }

        // 1. Initialize RAG resources if needed
        await initRAG();

        let retrievedContext = "";

        // 2. Perform Vector Search if Pinecone is available
        if (pineconeIndex && extractor) {
            try {
                // Generate embedding for user query
                const output = await extractor(message, { pooling: 'mean', normalize: true });
                const queryVector = Array.from(output.data);

                // Query Pinecone
                const queryResponse = await pineconeIndex.query({
                    vector: queryVector,
                    topK: 3,
                    includeMetadata: true,
                });

                // Combine retrieved contexts
                if (queryResponse.matches && queryResponse.matches.length > 0) {
                    retrievedContext = queryResponse.matches
                        .map(match => match.metadata.text)
                        .join("\n\n");
                }
            } catch (err) {
                console.error("Vector search failed:", err);
                // Continue without context if search fails
            }
        }

        if (!retrievedContext) {
            retrievedContext = "No specific match found, but AIO FileFlow offers a large variety of PDF editing, conversion, and image processing tools for free.";
        }

        // Build the system prompt with context
        const finalSystemPrompt = SYSTEM_PROMPT_TEMPLATE.replace("{context}", retrievedContext);

        // Build the messages array for Groq
        const messages = [
            { role: "system", content: finalSystemPrompt },
        ];

        // Add conversation history (last 20 messages to keep context manageable)
        const recentHistory = history.slice(-20);
        for (const msg of recentHistory) {
            if (msg.role === "user" || msg.role === "assistant") {
                messages.push({
                    role: msg.role,
                    content: msg.content,
                });
            }
        }

        // Add the current user message
        messages.push({ role: "user", content: message.trim() });

        // Call Groq API
        const response = await fetch(GROQ_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${GROQ_API_KEY}`,
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages,
                max_tokens: 1024,
                temperature: 0.7,
            }),
        });

        if (!response.ok) {
            const errorData = await response.text();
            console.error("Groq API error:", response.status, errorData);
            return res.status(502).json({ error: "Failed to get response from AI. Please try again." });
        }

        const data = await response.json();
        const reply = data.choices?.[0]?.message?.content || "I'm sorry, I couldn't generate a response. Please try again.";

        return res.json({ reply });
    } catch (error) {
        console.error("Chatbot error:", error);
        return res.status(500).json({ error: "Something went wrong. Please try again." });
    }
};
