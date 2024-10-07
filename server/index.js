import express from 'express';
import dotenv from 'dotenv';
import Stripe from 'stripe';
import cors from 'cors';
import multer from 'multer';
import ffmpeg from 'fluent-ffmpeg';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs/promises';  
import { createRequire } from 'module';
import path from 'path';
import { EventEmitter } from 'events';
import os from 'os';
import { Storage } from '@google-cloud/storage';


const require = createRequire(import.meta.url);
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const port = 8080;
const app = express();
//https://real-9f3b8.ts.r.appspot.com'||'http://localhost:8080
// app.use(cors({
//   origin: '*', // Be more specific in production
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
//   allowedHeaders: ['Content-Type', 'Authorization']
// }));
app.use(cors());

app.use(express.json());

const storage = new Storage({
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
});const bucketName = process.env.GOOGLE_CLOUD_STORAGE_BUCKET;

ffmpeg.setFfmpegPath(ffmpegPath);

// // Change multer configuration to use disk storage
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, os.tmpdir()) // Use system's temp directory
//   },
//   filename: function (req, file, cb) {
//     cb(null, Date.now() + '-' + file.originalname)
//   }
// })

// const upload = multer({
//   storage: storage,
//   limits: {
//     fileSize: 600 * 1024 * 1024 // 1000 MB
//   }
// });
const upload = multer({ dest: 'uploads/' });


app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

app.use('/compressed', express.static(path.join(__dirname, 'compressed')));

// Generate signed URL for upload
app.post('/get-upload-url', async (req, res) => {
  console.log('Received request to get upload URL - ',bucketName);
  try {
    const filename = `${Date.now()}-${req.body.filename}`;
    const [url] = await storage.bucket(bucketName).file(filename).getSignedUrl({
      version: 'v4',
      action: 'write',
      expires: Date.now() + 15 * 60 * 1000, // 15 minutes
    });
    console.log('Generated signed URL:', url, filename);
    res.json({ uploadUrl: url, filename });
  } catch (error) {
    console.error('Error generating signed URL:', error);
    res.status(500).json({ error: 'Error generating upload URL' });
  }
});

// Compress video
app.post('/compress-video', upload.single('video'), (req, res) => {
  console.log('Received file:', req.file);
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }

  const inputPath = req.file.path;
  const outputPath = path.join(os.tmpdir(), `compressed_${Date.now()}.mp4`);

  console.log('Starting compression for file:', inputPath);
  console.log('Output path:', outputPath);

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no' // Disable buffering
  });

  let progress = 0;
  let startTime = Date.now();
  let duration = 0;

  ffmpeg(inputPath)
    .outputOptions([
      '-c:v libx264',
      '-preset ultrafast',
      '-crf 28',
      '-vf scale=720:-2',
      '-profile:v baseline',
      '-level 3.0',
      '-pix_fmt yuv420p',
      '-c:a aac',
      '-b:a 128k',
      '-movflags +faststart',
      '-r 30'  // Force 30 fps
    ])
    .toFormat('mp4')
    .on('start', (commandLine) => {
      console.log('Compression started with command:', commandLine);
      res.write(`data: ${JSON.stringify({ status: 'started' })}\n\n`);
    })
    .on('codecData', (data) => {
      duration = parseInt(data.duration.replace(/:/g, ''));
    })
    .on('progress', (progressData) => {
      if (progressData.percent) {
        progress = progressData.percent;
      } else if (duration > 0) {
        // Calculate progress based on time if percent is not available
        const currentTime = progressData.timemark.replace(/:/g, '');
        progress = (parseInt(currentTime) / duration) * 100;
      } else {
        // If duration is not available, use a simple increasing progress
        const elapsedTime = Date.now() - startTime;
        progress = Math.min((elapsedTime / 60000) * 100, 99); // Assume 1 minute for 100%
      }
      
      console.log(`Processing: ${progress.toFixed(2)}% done`);
      res.write(`data: ${JSON.stringify({ status: 'progress', percent: parseFloat(progress.toFixed(2)) })}\n\n`);
    })
    .on('end', async () => {
      console.log('Compression finished');
      try {
        const compressedVideoBuffer = await fs.readFile(outputPath);
        const filename = `compressed_${Date.now()}.mp4`;
        await storage.bucket(bucketName).file(filename).save(compressedVideoBuffer);
        const [url] = await storage.bucket(bucketName).file(filename).getSignedUrl({
          version: 'v4',
          action: 'read',
          expires: Date.now() + 15 * 60 * 1000, // 15 minutes
        });
        res.write(`data: ${JSON.stringify({ status: 'completed', compressedVideoUrl: url })}\n\n`);
        res.end();
        // Clean up temporary files
        await fs.unlink(inputPath);
        await fs.unlink(outputPath);
      } catch (error) {
        console.error('Error:', error);
        res.write(`data: ${JSON.stringify({ status: 'error', error: error.message })}\n\n`);
        res.end();
      }
    })
    .on('error', (err) => {
      console.error('FFmpeg error:', err);
      res.write(`data: ${JSON.stringify({ status: 'error', error: err.message })}\n\n`);
      res.end();
    })
    .save(outputPath);
});

app.listen(8080, () => {
  console.log('Server running on port 8080');
});