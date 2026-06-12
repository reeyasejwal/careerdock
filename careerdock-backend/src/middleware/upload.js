const multer = require('multer');
const path = require('path');

const resumeStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/resumes/'),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});

const jdStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/jd-files/'),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
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
