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


const require = createRequire(import.meta.url);
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const port = 3000;
const app = express();
const publishableKey = 'pk_test_51Q0KewLN1sWuQDkGPMtzTZVYJ0HB2AJppDVIHGwZlTw6BJ5YXzhh5X8Rf2GpqsFzLMDONVoJYsh0pklNEoQK8vDM00YY4xJfWP';
const secretKey = 'sk_test_51Q0KewLN1sWuQDkGSWiX2DRR35Y3gcY3n87EtJmNAE2yefG3Vd23jOPv1O47CH84r6p6uyupn8kpXzQa8zxrau3U00g8CTT9hI';
app.use(cors({
  origin: '*', // Be more specific in production
}));
app.use(express.json());

const stripe = Stripe(secretKey, {
  apiVersion: '2024-06-20',
});

ffmpeg.setFfmpegPath(ffmpegPath);

// Change multer configuration to use disk storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, os.tmpdir()) // Use system's temp directory
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname)
  }
})

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 600 * 1024 * 1024 // 1000 MB
  }
});


app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

console.log(secretKey);
console.log('Stripe API Key set:', !!secretKey);

app.post('/create-payment-intent', async (req, res) => {
  if (!secretKey) {
    return res.status(500).json({ error: 'Stripe API key is not set' });
  }

  console.log(req.body);
  let amount = 1000;  // or use req.body.amount if you want to get it from the request
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
    });
    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ error: error.message });
  }
});

app.use('/compressed', express.static(path.join(__dirname, 'compressed')));

app.post('/compress-video', upload.single('video'), async (req, res) => {
  console.log('Received compression request');
  if (!req.file) {
    console.log('No file received');
    return res.status(400).send('No video file uploaded.');
  }

  console.log('File received:', req.file);

  const inputPath = req.file.path;
  const outputDir = join(__dirname, 'compressed');
  const outputPath = join(outputDir, `${Date.now()}_compressed.mp4`);

  try {
    await fs.mkdir(outputDir, { recursive: true });

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
      .output(outputPath)
      .on('progress', (progress) => {
        if (progress.percent) {
          res.write(`data: ${JSON.stringify({ percent: Math.round(progress.percent) })}\n\n`);
        }
      })
      .on('end', async () => {
        console.log('Compression finished');
        const filename = path.basename(outputPath);
        res.write(`data: ${JSON.stringify({ compressedVideoFilename: filename })}\n\n`);
        res.end();
        await fs.unlink(inputPath);
      })
      .on('error', async (err) => {
        console.error('Error during compression:', err);
        res.write(`data: ${JSON.stringify({ error: 'Error compressing video' })}\n\n`);
        res.end();
        await fs.unlink(inputPath);
      })
      .run();

  } catch (error) {
    console.error('Error setting up compression:', error);
    res.write(`data: ${JSON.stringify({ error: 'Error setting up video compression' })}\n\n`);
    res.end();
    if (inputPath) {
      try {
        await fs.unlink(inputPath);
      } catch (unlinkError) {
        console.error('Error deleting input file:', unlinkError);
      }
    }
  }
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${port}`);
});