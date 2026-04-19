'use strict';
const multer = require('multer');
const path   = require('path');
const crypto = require('crypto');
const cfg    = require('../config/env');

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, path.join(cfg.upload.dir, 'menu')),
  filename:    (_req, file, cb) => {
    const ext  = path.extname(file.originalname).toLowerCase();
    const name = crypto.randomBytes(16).toString('hex');
    cb(null, `${name}${ext}`);
  },
});

const fileFilter = (_req, file, cb) => {
  const allowed = /jpeg|jpg|png|webp/;
  const ext     = allowed.test(path.extname(file.originalname).toLowerCase());
  const mime    = allowed.test(file.mimetype);
  if (ext && mime) return cb(null, true);
  cb(new Error('Only jpeg/jpg/png/webp images are allowed'));
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: cfg.upload.maxFileSize },
});

module.exports = { upload };
