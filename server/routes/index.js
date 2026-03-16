import express from "express";
import signPdfRoutes from "./signPdfRoutes.js";
import organizePdfRoutes from "./organizePdfRoutes.js";
import addPageNumbersRoutes from "./addPageNumbersRoutes.js";

const router = express.Router();

router.use("/pdf", signPdfRoutes);
router.use("/pdf", organizePdfRoutes);
router.use("/pdf", addPageNumbersRoutes);

// Log user visits and capture IP address
router.get("/visit", (req, res) => {
    // Debug: log all IP-related sources to see what's available
    console.log("[Visit Debug] req.ip:", req.ip);
    console.log("[Visit Debug] x-forwarded-for:", req.headers['x-forwarded-for']);
    console.log("[Visit Debug] x-real-ip:", req.headers['x-real-ip']);
    console.log("[Visit Debug] req.socket.remoteAddress:", req.socket.remoteAddress);

    // Get the real client IP - try multiple sources
    const forwarded = req.headers['x-forwarded-for'];
    const ip = (forwarded ? forwarded.split(',')[0].trim() : null)
             || req.headers['x-real-ip']
             || req.ip
             || req.socket.remoteAddress;

    console.log(`[Visit] New visitor from IP: ${ip}`);
    res.status(200).json({ success: true, message: "Visit logged", ip });
});

export default router;
