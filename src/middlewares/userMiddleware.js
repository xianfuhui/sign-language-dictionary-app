const multer = require('multer');
const path = require('path');

const sessionUser = (req, res, next) => {
  if (req.session && req.session.user) {
    if (req.session.user.user_status === false) {
      return res.redirect('/user/locked-status');
    } else if (req.session.user.check_email_confirmation === false) {
      return res.redirect('/user/resend-email');
    } else {
      next();
    }
  } else {
    return res.redirect('/user/login');
  }
};

const sessionBlockUser = (req, res, next) => {
  if (req.session && req.session.user) {
    next()
  } else {
    return res.redirect('/404');
  }
};

const storageVideo = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'src/public/videos');
  },
  filename: function (req, file, cb) {
    const fieldName = file.fieldname;
    const userId = req.session.user._id;
    const fileExtension = file.originalname.split('.').pop();
    const uniqueFilename = fieldName + '_' + userId + '_' + Date.now() +  '.' + fileExtension;

    cb(null, uniqueFilename);
  }
});

const storageImage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'src/public/images');
  },
  filename: function (req, file, cb) {
    const fieldName = file.fieldname;
    const userId = req.session.user._id;
    const fileExtension = file.originalname.split('.').pop();

    const uniqueFilename = fieldName + '_' + userId + '_' + Date.now() + '.' + fileExtension;

    cb(null, uniqueFilename);
  }
});

const uploadVideo = multer({ storage: storageVideo });
const uploadImage = multer({ storage: storageImage });

module.exports = {
  sessionUser,
  sessionBlockUser,
  uploadVideo,
  uploadImage,
}