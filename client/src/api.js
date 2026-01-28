import axios from "axios";

export const convertFile = (formData) =>
  axios.post("http://localhost:3000/api/convert", formData, {
    responseType: "blob",
  });
