const multer = require('multer');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// resource_type:'raw' handles any file type; file filtering is done by multer's fileFilter below
const resumeStorage = new CloudinaryStorage({
  cloudinary,
  params: { folder: 'careerdock/resumes', resource_type: 'raw' },
});

const jdStorage = new CloudinaryStorage({
  cloudinary,
  params: { folder: 'careerdock/jd-files', resource_type: 'raw' },
});

exports.uploadResume = multer({
  storage: resumeStorage,
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.doc', '.docx'];
    if (allowed.includes(path.extname(file.originalname).toLowerCase())) cb(null, true);
    else cb(new Error('Only PDF/DOC/DOCX files allowed'));
  },
  limits: { fileSize: 10 * 1024 * 1024 },
});

exports.uploadJd = multer({
  storage: jdStorage,
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.doc', '.docx', '.txt'];
    if (allowed.includes(path.extname(file.originalname).toLowerCase())) cb(null, true);
    else cb(new Error('Only PDF/DOC/DOCX/TXT files allowed'));
  },
  limits: { fileSize: 10 * 1024 * 1024 },
});
