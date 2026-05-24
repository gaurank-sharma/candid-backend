const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const multer = require('multer');
const streamifier = require('streamifier');
const cloudinary = require('cloudinary').v2;

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Use memoryStorage to handle file buffers
const storage = multer.memoryStorage();
const upload = multer({ storage });

// IMPORTANT: Change from upload.single('image') to upload.array('images', 10)
// This accepts an array of files (up to 10) with the field name "images".
router.post('/', auth, upload.array('images', 10), async (req, res) => {
  try {
    // req.file is now req.files (an array of files)
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ msg: 'No files were uploaded.' });
    }

    const uploadPromises = req.files.map(file => {
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: 'blog_images' },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        );
        streamifier.createReadStream(file.buffer).pipe(uploadStream);
      });
    });

    // Wait for all uploads to complete
    const results = await Promise.all(uploadPromises);
    
    // Map the results to an array of URLs
    const urls = results.map(result => result.secure_url);

    // IMPORTANT: Return an object with a 'urls' array, as the frontend expects
    res.json({ urls: urls });

  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

module.exports = router;