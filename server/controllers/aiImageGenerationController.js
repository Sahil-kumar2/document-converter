import { generateImage } from "../services/geminiService.js";

export async function imageGenerateController(req, res) {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({
        success: false,
        message: "Prompt is required"
      });
    }

    const result = await generateImage(prompt);

    res.json({
      success: true,
      output: result
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
