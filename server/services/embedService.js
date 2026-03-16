import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

export const createEmbedding = async (text) => {
  const response = await axios.post(
    "https://api-inference.huggingface.co/pipeline/feature-extraction/BAAI/bge-small-en-v1.5",
    text,
    {
      headers: {
        Authorization: `Bearer ${process.env.HF_API_KEY}`,
      },
    }
  );

  return response.data[0];
};