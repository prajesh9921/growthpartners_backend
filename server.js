import express from "express";
import cors from "cors";
import multer from "multer";
import OpenAI from "openai";
import * as XLSX from "xlsx/xlsx.mjs";
import dotenv from "dotenv";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import excelToJson from "convert-excel-to-json";
import { log } from "console";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

// OpenAI Configuration
const openai = new OpenAI({
  apiKey: "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"
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage });

app.post("/api/upload", upload.single("file"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Access file details
    const { path, originalname, mimetype, size } = req.file;

    const result = excelToJson({
      sourceFile: path
  });

    res.status(200).json({ success: "file upload successful", data: result });
  } catch (error) {
    res.status(500).json({ error: error });
  }
});

// Chat Endpoint
app.post("/api/chat", async (req, res) => {
  const { message, financialContext } = req.body;  

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { 
          role: "system", 
          content: "You are a helpful data analyst assistant." 
        },
        { 
          role: "user", 
          content: `Analyze this sales data: ${JSON.stringify(financialContext)}. And answer ${message}.`
        }
      ]
    });

    console.log(response.choices[0].message.content);

    res.json({
      reply: response.choices[0].message.content,
    });
  } catch (error) {
    res.status(500).json({ error: "AI processing failed" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});