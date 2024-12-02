import express from 'express';
import cors from 'cors';
import multer from 'multer';
import OpenAI from 'openai';
import * as XLSX from 'xlsx';

const app = express();
app.use(cors());
app.use(express.json());

// OpenAI Configuration
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// File Upload Configuration
const upload = multer({ dest: 'uploads/' });

// File Upload Endpoint
app.post('/api/upload', upload.single('file'), (req, res) => {
  try {
    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);
    
    res.json(jsonData);
  } catch (error) {
    res.status(500).json({ error: 'File processing failed' });
  }
});

// Chat Endpoint
app.post('/api/chat', async (req, res) => {
  const { message, financialContext } = req.body;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { 
          role: "system", 
          content: "You are a financial analyst helping interpret financial data." 
        },
        { 
          role: "user", 
          content: JSON.stringify(financialContext || {}) 
        },
        { 
          role: "user", 
          content: message 
        }
      ]
    });

    res.json({ 
      reply: completion.choices[0].message.content 
    });
  } catch (error) {
    res.status(500).json({ error: 'AI processing failed' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// const express = require('express');
// const multer = require('multer');
// const path = require('path');
// const fs = require('fs');

// // Configure multer for file upload
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     const uploadDir = path.join(__dirname, 'uploads');
    
//     // Create uploads directory if it doesn't exist
//     if (!fs.existsSync(uploadDir)) {
//       fs.mkdirSync(uploadDir);
//     }
    
//     cb(null, uploadDir);
//   },
//   filename: (req, file, cb) => {
//     // Generate unique filename
//     const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
//     cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
//   }
// });

// const upload = multer({ 
//   storage: storage,
//   fileFilter: (req, file, cb) => {
//     // Accept specific file types
//     const filetypes = /xlsx|xls|csv|json/;
//     const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
//     const mimetype = filetypes.test(file.mimetype);

//     if (extname && mimetype) {
//       return cb(null, true);
//     } else {
//       cb(new Error('Only Excel, CSV, and JSON files are allowed!'));
//     }
//   },
//   limits: { fileSize: 10 * 1024 * 1024 } // 10MB file size limit
// });

// // File upload route
// app.post('/upload-financial-data', upload.array('financialData'), async (req, res) => {
//   try {
//     if (!req.files || req.files.length === 0) {
//       return res.status(400).json({ message: 'No files uploaded' });
//     }

//     // Process uploaded files
//     const uploadedFiles = req.files.map(file => ({
//       originalName: file.originalname,
//       filename: file.filename,
//       path: file.path,
//       size: file.size
//     }));

//     // Optional: Convert files to a standard format
//     const convertedFiles = uploadedFiles.map(file => {
//       // Add conversion logic here if needed
//       return file;
//     });

//     res.json({
//       message: 'Files uploaded successfully',
//       files: convertedFiles
//     });
//   } catch (error) {
//     console.error('File upload error:', error);
//     res.status(500).json({ message: 'File upload failed', error: error.message });
//   }
// });