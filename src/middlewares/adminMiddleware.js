const multer = require('multer');
const path = require('path');

// Middleware kiểm tra session admin
const sessionAdmin = (req, res, next) => {
  if (req.session && req.session.admin) {
    next();
  } else {
    res.redirect('/admin/login');
  }
};

// Cấu hình lưu trữ cho video
const storageVideo = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'src/public/videos');
  },
  filename: function (req, file, cb) {
    const fieldName = file.fieldname;
    const fileExtension = file.originalname.split('.').pop();
    const uniqueFilename = fieldName + '_' + Date.now() + '.' + fileExtension;

    cb(null, uniqueFilename);
  }
});

// Cấu hình lưu trữ cho hình ảnh
const storageImage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'src/public/images');
  },
  filename: function (req, file, cb) {
    const fieldName = file.fieldname;
    const fileExtension = file.originalname.split('.').pop();

    const uniqueFilename = fieldName + '_' + Date.now() + '.' + fileExtension;

    cb(null, uniqueFilename);
  }
});

// Cấu hình lưu trữ cho mô hình
const storageModel = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'src/public/models');
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname); // Giữ nguyên tên và đuôi file
  }
});

// Khởi tạo upload cho các loại file khác nhau
const uploadVideo = multer({ storage: storageVideo });
const uploadImage = multer({ storage: storageImage });
const uploadModel = multer({ storage: storageModel }).array('modelFiles', 10);

module.exports = {
  sessionAdmin,
  uploadVideo,
  uploadImage,
  uploadModel,
};
