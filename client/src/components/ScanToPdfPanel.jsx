import { useRef, useState } from "react";
import { convertFile } from "../api";

export default function ScanToPdf() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [loading, setLoading] = useState(false);

  const startCamera = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    videoRef.current.srcObject = stream;
  };

  const captureAndConvert = async () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0);

    const blob = await new Promise(res => canvas.toBlob(res, "image/jpeg"));

    const file = new File([blob], "scan.jpg", { type: "image/jpeg" });

    setLoading(true);
    const res = await convertFile(file, "pdf");


    const url = window.URL.createObjectURL(res.data);
    const a = document.createElement("a");
    a.href = url;
    a.download = "scanned.pdf";
    a.click();
    setLoading(false);
  };

  return (
    <div className="bg-white p-8 rounded-xl shadow-lg space-y-6">
      <video ref={videoRef} autoPlay className="w-full rounded-lg" />
      <canvas ref={canvasRef} className="hidden" />

      <div className="flex gap-4">
        <button onClick={startCamera} className="bg-blue-600 text-white px-6 py-3 rounded">
          Start Camera
        </button>

        <button onClick={captureAndConvert} disabled={loading}
          className="bg-green-600 text-white px-6 py-3 rounded">
          {loading ? "Processing..." : "Capture & Convert"}
        </button>
      </div>
    </div>
  );
}
