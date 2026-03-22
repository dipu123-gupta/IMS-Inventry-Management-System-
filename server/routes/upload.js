const router = require('express').Router();
const upload = require('../middleware/upload');
const cloudinaryService = require('../src/services/CloudinaryService');
const auth = require('../middleware/auth');
const tenant = require('../middleware/tenant');
const logger = require('../utils/logger');
const fs = require('fs');
const path = require('path');

/**
 * @desc    Upload product image locally
 * @route   POST /api/v1/upload
 * @access  Private
 */
router.post('/', auth, tenant, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Upload to Cloudinary
    const result = await cloudinaryService.uploadImage(req.file.path, 'ims/products');

    // Remove file from local uploads folder after Cloudinary upload
    fs.unlinkSync(req.file.path);

    res.json({ 
      success: true,
      url: result.url, 
      public_id: result.public_id 
    });
  } catch (error) {
    logger.error('Upload Error:', error);
    // Cleanup local file if it exists and upload failed
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: 'Upload failed: ' + error.message });
  }
});

module.exports = router;
