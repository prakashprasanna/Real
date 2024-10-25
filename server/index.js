import express from 'express';
import dotenv from 'dotenv';
import Stripe from 'stripe';
import cors from 'cors';
import multer from 'multer';
import ffmpeg from 'fluent-ffmpeg';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import { createRequire } from 'module';
import path from 'path';
import { EventEmitter } from 'events';
import os from 'os';
import { Storage } from '@google-cloud/storage';

const require = createRequire(import.meta.url);
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffprobePath = require('@ffprobe-installer/ffprobe').path;

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = process.env.PORT || 8080;
const app = express();

app.use(cors());
app.use(express.json());

const storage = new Storage({
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
});
const bucketName = process.env.GOOGLE_CLOUD_STORAGE_BUCKET;

ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

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
  console.log('ppp...');
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
app.post('/compress-video', async (req, res) => {
  console.log('Received request to compress video - ', req.body);
  const { filename } = req.body;
  const inputFilename = filename;
  const outputFilename = `compressed_${filename}`;

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no' // Disable buffering
  });

  const tempInputPath = path.join(os.tmpdir(), inputFilename);
  const tempOutputPath = path.join(os.tmpdir(), outputFilename);

  try {
    // Download file from Google Cloud Storage
    await storage.bucket(bucketName).file(inputFilename).download({ destination: tempInputPath });

    // Check if the file exists and is not empty
    const stats = fs.statSync(tempInputPath);
    if (stats.size === 0) {
      throw new Error('Downloaded file is empty');
    }

    // Get file information
    ffmpeg.ffprobe(tempInputPath, (err, metadata) => {
      if (err) {
        console.error('Error probing file:', err);
        res.write(`data: ${JSON.stringify({ status: 'error', error: 'Error probing input file: ' + err.message })}\n\n`);
        res.end();
        return;
      }
      console.log('Input file metadata:', JSON.stringify(metadata, null, 2));
      
      // Continue with compression...
      let progress = 0;
      let startTime = Date.now();
      let duration = 0;

      ffmpeg(tempInputPath)
        .outputOptions([
          '-c:v libx264',
          '-preset fast',
          '-crf 23',
          '-vf scale=720:-2',
          '-profile:v main',
          '-level 4.0',
          '-pix_fmt yuv420p',
          '-c:a aac',
          '-b:a 128k',
          '-movflags +faststart',
          '-r 30',
          '-strict experimental',
          '-max_muxing_queue_size 9999'
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
            const currentTime = progressData.timemark.replace(/:/g, '');
            progress = (parseInt(currentTime) / duration) * 100;
          } else {
            const elapsedTime = Date.now() - startTime;
            progress = Math.min((elapsedTime / 60000) * 100, 99);
          }
          
          console.log(`Processing: ${progress.toFixed(2)}% done`);
          res.write(`data: ${JSON.stringify({ status: 'progress', percent: parseFloat(progress.toFixed(2)) })}\n\n`);
        })
        .on('end', async () => {
          console.log('Compression finished');
          try {
            // Upload compressed file to Google Cloud Storage
            await storage.bucket(bucketName).upload(tempOutputPath, {
              destination: outputFilename,
            });

            const [url] = await storage.bucket(bucketName).file(outputFilename).getSignedUrl({
              version: 'v4',
              action: 'read',
              expires: Date.now() + 15 * 60 * 1000, // 15 minutes
            });

            // Delete the original file
            try {
              await storage.bucket(bucketName).file(inputFilename).delete();
              console.log(`Original file ${inputFilename} deleted successfully.`);
            } catch (deleteError) {
              console.error(`Error deleting original file ${inputFilename}:`, deleteError);
              // We don't throw here to avoid interrupting the process
            }

            res.write(`data: ${JSON.stringify({ status: 'completed', compressedVideoUrl: url })}\n\n`);
            res.end();

            // Clean up temporary files
            fs.unlinkSync(tempInputPath);
            fs.unlinkSync(tempOutputPath);
          } catch (error) {
            console.error('Error:', error);
            res.write(`data: ${JSON.stringify({ status: 'error', error: error.message })}\n\n`);
            res.end();
          }
        })
        .on('error', (err, stdout, stderr) => {
          console.error('FFmpeg error:', err);
          console.error('FFmpeg stdout:', stdout);
          console.error('FFmpeg stderr:', stderr);
          res.write(`data: ${JSON.stringify({ status: 'error', error: err.message, details: stderr })}\n\n`);
          res.end();
        
          // Clean up temporary files
          if (fs.existsSync(tempInputPath)) fs.unlinkSync(tempInputPath);
          if (fs.existsSync(tempOutputPath)) fs.unlinkSync(tempOutputPath);
        })
        .save(tempOutputPath);
    });
  } catch (error) {
    console.error('Error in compress-video:', error);
    res.write(`data: ${JSON.stringify({ status: 'error', error: error.message })}\n\n`);
    res.end();

    // Clean up temporary files
    if (fs.existsSync(tempInputPath)) fs.unlinkSync(tempInputPath);
    if (fs.existsSync(tempOutputPath)) fs.unlinkSync(tempOutputPath);
  }
});

// Add this new endpoint to delete a file from Google Cloud Storage
app.post('/delete-file', async (req, res) => {
  const { filename } = req.body;
  try {
    await storage.bucket(bucketName).file(filename).delete();
    console.log(`File ${filename} deleted successfully from Google Cloud Storage.`);
    res.status(200).json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error(`Error deleting file ${filename}:`, error);
    res.status(500).json({ error: 'Error deleting file' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});