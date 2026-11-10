const express = require("express");
const path = require("path");
require("dotenv").config();

const OpenAI = require("openai");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "20kb" }));

// جلوگیری از دسترسی مرورگر به فایل‌های داخلی سرور
app.use((req, res, next) => {
    if (
        req.path.startsWith("/ohad-server") ||
        req.path.startsWith("/node_modules")
    ) {
        return res.sendStatus(404);
    }
    next();
});

// نمایش فایل‌های سایت
app.use(express.static(path.join(__dirname, ".."), {
    dotfiles: "deny"
}));

// آزمایش سرور
app.get("/api/status", (req, res) => {
    res.json({
        success: true,
        message: "OHAD MEDICAL AI SERVER IS RUNNING"
    });
});

// مسیر گفت‌وگو با هوش مصنوعی
app.post("/api/chat", async (req, res) => {
    const message = req.body?.message;

    if (typeof message !== "string" || !message.trim()) {
        return res.status(400).json({
            error: "لطفاً پیام خود را وارد کنید."
        });
    }

    if (message.length > 4000) {
        return res.status(400).json({
            error: "پیام بیش از حد طولانی است."
        });
    }

    if (!process.env.OPENAI_API_KEY) {
        return res.status(503).json({
            error: "کلید اتصال هوش مصنوعی هنوز تنظیم نشده است."
        });
    }

    try {
        const client = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });

        const response = await client.responses.create({
            model: "gpt-6-astra",
            instructions:
                "You are OHAD AI, the helpful assistant for OHAD MEDICAL. " +
                "Answer clearly and politely in the user's language. " +
                "Help with general information about medical equipment. " +
                "Do not diagnose conditions or replace professional medical advice.",
            input: message.trim()
        });

        res.json({
            success: true,
            reply: response.output_text
        });

    } catch (error) {
        console.error("OHAD AI error:", error);

        res.status(500).json({
            error: "ارتباط با هوش مصنوعی با مشکل مواجه شد."
        });
    }
});

// اجرای سرور
app.listen(PORT, () => {
    console.log(`OHAD SERVER RUNNING: http://localhost:${PORT}`);
});