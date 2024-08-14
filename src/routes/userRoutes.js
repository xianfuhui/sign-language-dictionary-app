const express = require('express');

const router = express.Router();

const userController = require('../controllers/userController');
const userMiddleware = require('../middlewares/userMiddleware');

// Route để get đăng ký = done 100%
router.get('/register', userController.getRegisterUser);

// Route để post đăng ký = done 100%
router.post('/register', userController.postRegisterUser);

// Route để xác nhận email = done 100%
router.get('/verify-email-token/:token', userController.getVerifyEmailTokenUser);

// Route để get đăng nhập = done 100%
router.get('/login', userController.getLoginUser);

// Route để post đăng nhập = done 100%
router.post('/login', userController.postLoginUser);

// Route để post đăng nhập = done 100%
router.get('/forgot-password', userController.getForgotPasswordUser);

// Route để post đăng nhập = done 100%
router.post('/forgot-password', userController.postForgotPasswordUser);

// Route để post đăng nhập = done 100%
router.get('/reset-password/:token', userController.getResetPasswordUser);

// Route để post đăng nhập = done 100%
router.post('/reset-password/:token', userController.postResetPasswordUser);

// Route để get chặn khi người dùng bị khóa 
router.get('/locked-status', userMiddleware.sessionBlockUser, userController.getLockedStatusUser);

// Route để get chặn khi người dùng chưa xác nhận email 
router.get('/resend-email', userMiddleware.sessionBlockUser, userController.getResendEmailUser);

// Route để post gửi lại email xác nhận cho người dùng
router.post('/resend-email', userMiddleware.sessionBlockUser, userController.postResendEmailUser);

// Route để get đăng xuất 
router.get('/logout', userMiddleware.sessionBlockUser, userController.getLogoutUser);

// Route để get trang chủ = done
router.get('/home', userMiddleware.sessionUser, userController.getHomeUser);

// Route để get profile = done
router.get('/profile', userMiddleware.sessionUser, userController.getProfileUser);

// Route để get edit profile = done
router.get('/edit-profile', userMiddleware.sessionUser, userController.getEditProfileUser);

// Route để post edit profile = done
router.post('/edit-profile', userMiddleware.sessionUser, userMiddleware.uploadImage.single('user_avatar'), userController.postEditProfileUser);

// Route để get search từ vựng = done
router.get('/search-vocabulary', userMiddleware.sessionUser, userController.getSearchVocabulary);

// Route để get danh sách từ vựng = thêm tìm kiếm
router.get('/list-vocabulary', userMiddleware.sessionUser, userController.getListVocabulary);

// Route để get chi tiết từ vựng = done
router.get('/detail-vocabulary/:id', userMiddleware.sessionUser, userController.getDetailVocabulary);

// Route để get chi tiết từ vựng = done 
router.get('/detail-vocabulary-ai', userMiddleware.sessionUser, userController.getDetailVocabularyAI);

// Route để get danh sách chủ đề = done
router.get('/list-topic', userMiddleware.sessionUser, userController.getListTopic);

// Route để get danh sách chủ đề chữ cái = done
router.get('/list-letter', userMiddleware.sessionUser, userController.getListLetter);

// Route để get danh sách chủ đề độ khó = done
router.get('/list-difficulty-level', userMiddleware.sessionUser, userController.getListDifficultyLevel);

// Route để get các từ vựng trong chủ đề = done
router.get('/list-vocabulary-topic/:id', userMiddleware.sessionUser, userController.getListVocabularyTopic);

// Route để get các từ vựng trong chủ đề chữ cái = done
router.get('/list-vocabulary-letter/:letter', userMiddleware.sessionUser, userController.getListVocabularyLetter);

// Route để get các từ vựng trong chủ đề độ khó = done
router.get('/list-vocabulary-difficulty-level/:level', userMiddleware.sessionUser, userController.getListVocabularyDifficultyLevel);

// Route để post danh sách từ vựng yêu thích = done
router.post('/toggle-vocabulary-user', userMiddleware.sessionUser, userController.postToggleVocabularyUser);

// Route để get danh sách từ vựng yêu thích = done
router.get('/list-favorite', userMiddleware.sessionUser, userController.getListFavorite);

// Route để get danh sách từ vựng tập luyện
router.get('/list-practice', userMiddleware.sessionUser, userController.getListPractice);

// Route để get danh sách từ vựng tập luyện ai
router.get('/list-practice-ai', userMiddleware.sessionUser, userController.getListPracticeAI);

// Route để post danh sách từ vựng tập luyện
router.post('/list-practice', userMiddleware.sessionUser, userController.postListPractice);

// Route để get danh sách từ vựng đề xuất
router.get('/list-recommendation-vocabulary', userMiddleware.sessionUser, userController.getListRecommendationVocabulary);

// Route để get danh sách từ vựng đề xuất
router.post('/add-recommendation-vocabulary', userMiddleware.sessionUser, userMiddleware.uploadVideo.single('vocabulary_video_link'), userController.postAddRecommendationVocabulary);

module.exports = router;
