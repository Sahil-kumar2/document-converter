import genAI from "../utils/geminiClient.js";

export async function generateImage(prompt) {
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash"
  });

  const result = await model.generateContent({
    contents: [
      {
        parts: [
          { text: prompt }
        ]
      }
    ]
  });

  return result.response.text();
}
