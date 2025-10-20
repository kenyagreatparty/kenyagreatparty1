const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Ensure uploads directory exists (only in non-serverless environments)
const uploadsDir = path.join(__dirname, '../uploads');

// Check if we're in a serverless environment (Vercel, Netlify, etc.)
const isServerless = process.env.VERCEL || process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME;

if (!isServerless && !fs.existsSync(uploadsDir)) {
  try {
    fs.mkdirSync(uploadsDir, { recursive: true });
  } catch (error) {
    console.warn('Could not create uploads directory:', error.message);
  }
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // In serverless environments, use memory storage or temp directory
    if (isServerless) {
      // Use /tmp directory which is writable in serverless environments
      cb(null, '/tmp');
    } else {
      let uploadPath = uploadsDir;
      
      // Create subdirectories based on file type
      if (file.mimetype.startsWith('image/')) {
        uploadPath = path.join(uploadsDir, 'images');
      } else if (file.mimetype.includes('pdf') || file.mimetype.includes('document')) {
        uploadPath = path.join(uploadsDir, 'documents');
      } else {
        uploadPath = path.join(uploadsDir, 'others');
      }
      
      // Create directory if it doesn't exist
      if (!fs.existsSync(uploadPath)) {
        try {
          fs.mkdirSync(uploadPath, { recursive: true });
        } catch (error) {
          console.warn('Could not create upload directory:', error.message);
          // Fallback to temp directory
          cb(null, '/tmp');
          return;
        }
      }
      
      cb(null, uploadPath);
    }
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    const filename = file.fieldname + '-' + uniqueSuffix + extension;
    cb(null, filename);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  // Define allowed file types
  const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  const allowedDocTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  
  if (allowedImageTypes.includes(file.mimetype) || allowedDocTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images and PDF documents are allowed.'), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB default
  },
  fileFilter: fileFilter
});

// @desc    Upload single file
// @route   POST /api/upload/single
// @access  Private/Admin
router.post('/single', protect, authorize('admin'), upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Generate appropriate file URL based on environment
    const fileUrl = isServerless ? `/tmp/${req.file.filename}` : `/uploads/${req.file.filename}`;
    
    res.json({
      success: true,
      message: 'File uploaded successfully',
      data: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
        url: fileUrl
      }
    });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while uploading file'
    });
  }
});

// @desc    Upload multiple files
// @route   POST /api/upload/multiple
// @access  Private/Admin
router.post('/multiple', protect, authorize('admin'), upload.array('files', 10), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    const uploadedFiles = req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      url: isServerless ? `/tmp/${file.filename}` : `/uploads/${file.filename}`
    }));
    
    res.json({
      success: true,
      message: `${req.files.length} files uploaded successfully`,
      data: { files: uploadedFiles }
    });
  } catch (error) {
    console.error('Multiple file upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while uploading files'
    });
  }
});

// @desc    Upload image specifically
// @route   POST /api/upload/image
// @access  Private/Admin
router.post('/image', protect, authorize('admin'), upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image uploaded'
      });
    }

    // Check if it's actually an image
    if (!req.file.mimetype.startsWith('image/')) {
      // Delete the uploaded file
      fs.unlinkSync(req.file.path);
      return res.status(400).json({
        success: false,
        message: 'Uploaded file is not an image'
      });
    }

    const imageUrl = isServerless ? `/tmp/${req.file.filename}` : `/uploads/images/${req.file.filename}`;
    
    res.json({
      success: true,
      message: 'Image uploaded successfully',
      data: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
        url: imageUrl
      }
    });
  } catch (error) {
    console.error('Image upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while uploading image'
    });
  }
});

// @desc    Upload document specifically
// @route   POST /api/upload/document
// @access  Private/Admin
router.post('/document', protect, authorize('admin'), upload.single('document'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No document uploaded'
      });
    }

    // Check if it's actually a document
    const allowedDocTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedDocTypes.includes(req.file.mimetype)) {
      // Delete the uploaded file
      fs.unlinkSync(req.file.path);
      return res.status(400).json({
        success: false,
        message: 'Uploaded file is not a supported document type'
      });
    }

    const documentUrl = isServerless ? `/tmp/${req.file.filename}` : `/uploads/documents/${req.file.filename}`;
    
    res.json({
      success: true,
      message: 'Document uploaded successfully',
      data: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
        url: documentUrl
      }
    });
  } catch (error) {
    console.error('Document upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while uploading document'
    });
  }
});

// @desc    Delete uploaded file
// @route   DELETE /api/upload/:filename
// @access  Private/Admin
router.delete('/:filename', protect, authorize('admin'), (req, res) => {
  try {
    const filename = req.params.filename;
    
    // Security check - prevent directory traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid filename'
      });
    }

    // Try to find and delete the file in different directories
    const possiblePaths = isServerless ? [
      path.join('/tmp', filename)
    ] : [
      path.join(uploadsDir, 'images', filename),
      path.join(uploadsDir, 'documents', filename),
      path.join(uploadsDir, 'others', filename),
      path.join(uploadsDir, filename)
    ];

    let fileDeleted = false;
    for (const filePath of possiblePaths) {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        fileDeleted = true;
        break;
      }
    }

    if (!fileDeleted) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    res.json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    console.error('File deletion error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting file'
    });
  }
});

// @desc    Get list of uploaded files
// @route   GET /api/upload/list
// @access  Private/Admin
router.get('/list', protect, authorize('admin'), (req, res) => {
  try {
    const { type } = req.query;
    let searchPath = isServerless ? '/tmp' : uploadsDir;
    
    if (!isServerless) {
      if (type === 'images') {
        searchPath = path.join(uploadsDir, 'images');
      } else if (type === 'documents') {
        searchPath = path.join(uploadsDir, 'documents');
      }
    }

    if (!fs.existsSync(searchPath)) {
      return res.json({
        success: true,
        data: { files: [] }
      });
    }

    const files = fs.readdirSync(searchPath).map(filename => {
      const filePath = path.join(searchPath, filename);
      const stats = fs.statSync(filePath);
      
      return {
        filename,
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        url: isServerless ? `/tmp/${filename}` : `/uploads/${type ? type + '/' : ''}${filename}`
      };
    });

    res.json({
      success: true,
      data: { files }
    });
  } catch (error) {
    console.error('Get files list error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching files list'
    });
  }
});

// Error handling middleware for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size allowed is 5MB.'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Maximum 10 files allowed.'
      });
    }
  }
  
  if (error.message === 'Invalid file type. Only images and PDF documents are allowed.') {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }

  res.status(500).json({
    success: false,
    message: 'File upload error'
  });
});

module.exports = router;
