const express = require('express');

const router = express.Router();

const adminController = require('../controllers/adminController');
const adminMiddleware = require('../middlewares/adminMiddleware');

// Route để get đăng nhập = done 100%
router.get('/login', adminController.getLoginAdmin);

// Route để post đăng nhập = done 100%
router.post('/login', adminController.postLoginAdmin);

// Route để get đăng xuất = done 100%
router.get('/logout', adminMiddleware.sessionAdmin, adminController.getLogoutAdmin);

// Route để get index = done 100%
router.get('/index', adminMiddleware.sessionAdmin, adminController.getIndexAdmin);

// Route để get thông tin profile = done 100%
router.get('/profile', adminMiddleware.sessionAdmin, adminController.getProfileAdmin);

// Route để get thông tin profile = done 100%
router.post('/change-password', adminMiddleware.sessionAdmin, adminController.postChangePasswordAdmin);

// Route để get danh sách từ vựng = done 100%
router.get('/list-vocabulary', adminMiddleware.sessionAdmin, adminController.getListVocabulary);

// Route để hiển thị chi tiết từng vựng theo ID  = done 100%
router.get('/detail-vocabulary/:vocabularyID', adminMiddleware.sessionAdmin, adminController.getDetailVocabularyByID);

// Route để get data từ vựng theo ID  = done 100%
router.post('/list-vocabulary/:vocabularyID', adminMiddleware.sessionAdmin, adminController.postVocabularyByID);

// Route để post thêm từ vựng = done 100%
router.post('/add-vocabulary', adminMiddleware.sessionAdmin, adminMiddleware.uploadVideo.single('vocabulary_video_link'), adminController.postAddVocabulary);

// Route để put chỉnh sửa từ vựng = done 100%
router.put('/edit-vocabulary/:vocabularyID', adminMiddleware.sessionAdmin, adminMiddleware.uploadVideo.single('vocabulary_video_link'), adminController.putEditVocabulary);

// Route để delete xóa từ vựng = done 100%
router.delete('/delete-vocabulary/:vocabularyID', adminMiddleware.sessionAdmin, adminController.deleteDeleteVocabulary);

// Route để get danh sách từ vựng phê duyệt = done 100%
router.get('/list-recommendation-vocabulary', adminMiddleware.sessionAdmin, adminController.getListRecommendationVocabulary);

// Route để put thay đổi thông tin từ vựng phê duyệt = done 100%
router.put('/change-recommendation-vocabulary/:vocabularyID', adminMiddleware.sessionAdmin, adminController.putChangeRecommendationVocabulary);

// Route để get danh sách chủ đề = done 100%
router.get('/list-topic', adminMiddleware.sessionAdmin, adminController.getListTopic);

// Route để lấy thông tin topic theo ID  = done 100%
router.get('/topic/:topicID', adminMiddleware.sessionAdmin, adminController.getTopicByID);

// Route để hiện thị chi tiết chủ đề theo ID = done 50%
router.get('/detail-topic/:topicID', adminMiddleware.sessionAdmin, adminController.getDetailTopicByID);

// Route để post thêm chủ đề = done 100%
router.post('/add-topic', adminMiddleware.sessionAdmin, adminMiddleware.uploadImage.single('topic_image'), adminController.postAddTopic);

// Route để put thay đổi chủ đề = done 100%
router.put('/edit-topic/:topicID', adminMiddleware.sessionAdmin, adminMiddleware.uploadImage.single('topic_image'), adminController.putEditTopic);

// Route để delete xóa chủ đề = done 100%
router.delete('/delete-topic/:topicID', adminMiddleware.sessionAdmin, adminController.deleteDeleteTopic);

// Route để get danh sách user = done 100%
router.get('/list-user', adminMiddleware.sessionAdmin, adminController.getListUser);

// Route để get chi tiết user 
router.get('/detail-user/:userID', adminMiddleware.sessionAdmin, adminController.getDetailUser);

// Route để post thay đổi trạng thái = done 100%
router.post('/change-status-user/:userID', adminMiddleware.sessionAdmin, adminController.postChangeStatusUser);

// Route để get upload model = done 100%
router.get('/upload-model', adminMiddleware.sessionAdmin, adminController.getUploadModel);

// Route để post upload model = done 100%
router.post('/upload-model', adminMiddleware.sessionAdmin, adminMiddleware.uploadModel, adminController.postUploadModel);

module.exports = router;
