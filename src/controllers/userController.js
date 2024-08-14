const crypto = require('crypto');
const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const _ = require('lodash');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const Admin = require('../models/adminModel');
const Topic = require('../models/topicModel');
const User = require('../models/userModel');
const Vocabulary = require('../models/vocabularyModel');
const VocabularyTopic = require('../models/vocabularyTopicModel');
const VocabularyUser = require('../models/vocabularyUserModel');

// Hiển thị form đăng ký 
const getRegisterUser = async (req, res) => {
    try {
        res.render('user/user_Register');
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Gửi thông tin đăng ký 
const postRegisterUser = async (req, res) => {
    try {
        const { fullName, password, confirmPassword, email } = req.body;
        if (password !== confirmPassword) {
            req.flash('error', 'Password and Confirm Password do not match');
            return res.redirect('/user/register');
        }

        const existingUser = await User.findOne({ user_email: email });
        if (existingUser) {
            req.flash('error', 'The user already exists in the system');
            return res.redirect('/user/register');
        }

        const name = email.split('@')[0];

        const token = crypto.randomBytes(20).toString('hex');
        const tokenExpiration = Date.now() + 60000;

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            user_avatar: '/images_static/avatar_user.jpg',
            user_full_name: fullName,
            user_date_of_birth: null,
            user_phone_number: null,
            user_email: email,
            user_name: name,
            user_password: hashedPassword,
            user_status: true,
            check_email_confirmation: false,
            email_verification_token: token,
            email_verification_token_expiration: tokenExpiration,
        });

        await newUser.save();

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.USER_EMAIL,
                pass: process.env.PASS_EMAIL,
            },
        });

        const currentURL = req.protocol + '://' + req.get('host');

        const mailOptions = {
            from: 'Sign Language System',
            to: email,
            subject: 'Account Registration Verification',
            html: `
                <p>Hello ${fullName},</p>
                <p>Please click on the following link to verify your account registration:</p>
                <a href="${currentURL}/user/verify-email-token/${token}">Verify Account</a>
            `,
        };

        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error);
            } else {
                console.log('Email sent: ' + info.response);
            }
        });

        req.flash('success', 'User account successfully created. Verification email has been sent to user');
        return res.redirect('/user/login');
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Xác thực email token
const getVerifyEmailTokenUser = async (req, res) => {
    const { token } = req.params;

    try {
        const userMember = await User.findOne({
            email_verification_token: token,
            email_verification_token_expiration: { $gt: Date.now() }, 
        });

        if (!userMember) {
            req.flash('error', 'The token link has expired');
            return res.redirect('/user/login'); 
        }

        userMember.check_email_confirmation = true;
        await userMember.save();

        req.session.user = null; 

        req.flash('success', 'Email confirmed successfully');
        return res.redirect('/user/login'); 
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Hiển thị đăng nhập
const getLoginUser = async (req, res) => {
    try {
        if (req.session.user) {
            res.redirect('/user/home');
        } else {
            res.render('user/user_Login');
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Gửi thông tin đăng nhập  
const postLoginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ user_email: email });

        if (!user) {
            req.flash('error', 'Incorrectly entered user name or password');
            return res.redirect('/user/login');
        }

        const isMatch = await bcrypt.compare(password, user.user_password);

        if (!isMatch) {
            req.flash('error', 'Incorrectly entered user name or password');
            return res.redirect('/user/login');
        }

        req.session.user = user;
        return res.redirect('/user/home');
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Hiển thị quên mật khẩu
const getForgotPasswordUser = async (req, res) => {
    try {
        if (req.session.user) {
            res.redirect('/user/profile');
        } else {
            res.render('user/user_ForgotPassword');
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const postForgotPasswordUser = async (req, res) => {
    try {
        if (req.session.user) {
            res.redirect('/user/profile');
        } else {
            const { email } = req.body;
            const user = await User.findOne({ user_email: email });

            if (!user) {
                req.flash('error', 'No account with that email found');
                return res.redirect('/user/forgot-password');
            }

            // Tạo token JWT (JSON Web Token)
            const token = jwt.sign(
                { id: user._id, email: user.user_email },
                process.env.KEY,
                { expiresIn: '1h' }
            );

            // Gửi email với link đặt lại mật khẩu
            const transporter = nodemailer.createTransport({
                service: 'Gmail',
                auth: {
                    user: process.env.USER_EMAIL,
                    pass: process.env.PASS_EMAIL,
                }
            });

            const currentURL = req.protocol + '://' + req.get('host');

            const mailOptions = {
                from: 'Sign Language System',
                to: email,
                subject: 'Password Reset',
                html: `
                    <p>You are receiving this because you (or someone else) have requested the reset of the password for your account.</p>
                    <p>Please click on the following link, or paste this into your browser to complete the process:</p>
                    <a href="${currentURL}/user/reset-password/${token}">Verify Account</a>
                    <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
                `,
            };

            transporter.sendMail(mailOptions, (err) => {
                if (err) {
                    req.flash('error', 'Error sending the reset email');
                    return res.redirect('/user/forgot-password');
                }
                req.flash('success', 'An email has been sent to ' + user.user_email + ' with further instructions');
                return res.redirect('/user/forgot-password');
            });
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const getResetPasswordUser = async (req, res) => {
    try {
        const decoded = jwt.verify(req.params.token, process.env.KEY);
        res.render('user/user_ResetPassword', { token: req.params.token });
    } catch (err) {
        req.flash('error', 'Password reset token is invalid or has expired');
        return res.redirect('/user/fogot-password');
    }
};

const postResetPasswordUser = async (req, res) => {
    try {
        const decoded = jwt.verify(req.params.token, process.env.KEY);
        const { newPassword, confirmPassword } = req.body;

        if (newPassword !== confirmPassword) {
            req.flash('error', 'Passwords do not match');
            return res.redirect(`/user/reset-password/${req.params.token}`);
        }

        const user = await User.findOne({ _id: decoded.id, user_email: decoded.email });
        if (!user) {
            req.flash('error', 'No user found for this token');
            return res.redirect('/user/forgot-password');
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
 
        user.user_password = hashedPassword;
        await user.save();

        req.flash('success', 'Password has reset');
        res.redirect('/user/login');
    } catch (err) {
        req.flash('error', 'Password reset token is invalid or has expired');
        return res.redirect('/user/fogot-password');
    }
};


// Hiển thị để chặn khi người dùng bị khóa 
const getLockedStatusUser = async (req, res) => {
    try {
        res.render('user/user_LockedStatusUser');
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Hiển thị để chặn khi người dùng chưa xác nhận email 
const getResendEmailUser = async (req, res) => {
    try {
        res.render('user/user_ResendEmailUser');
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Hiển thị để người dùng gửi lại email xác nhận 
const postResendEmailUser = async (req, res) => { 
    try {
        const token = crypto.randomBytes(20).toString('hex');
        const tokenExpiration = Date.now() + 60000;

        const user = await User.findById(req.session.user._id);;

        if (user) {
            user.email_verification_token = token
            user.email_verification_token_expiration = tokenExpiration

            await user.save();

            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.USER_EMAIL,
                    pass: process.env.PASS_EMAIL, 
                },
            });
    
            const currentURL = req.protocol + '://' + req.get('host');
    
            const mailOptions = {
                from: 'Sign Language System',
                to: user.user_email,
                subject: 'Account Registration Verification',
                html: `
                    <p>Hello ${user.user_full_name},</p>
                    <p>Please click on the following link to verify your account registration:</p>
                    <a href="${currentURL}/user/verify-email-token/${token}">Verify Account</a>
                `,
            };        
    
            transporter.sendMail(mailOptions, function (error, info) {
                if (error) {
                    console.log(error);
                } else {
                    console.log('Email sent: ' + info.response);
                }
            });
    
            req.flash('success', 'User account successfully sent. Verification email has been sent to user');
            return res.redirect('/user/resend-email');
        } else {
            return res.status(404).json({ message: 'Please try again' });
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Đăng xuất 
const getLogoutUser = async (req, res) => { 
    try {
        req.session.user = null; 

        res.redirect('/user/login'); 
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Lấy thông tin trang chủ
const getHomeUser = async (req, res) => {
    try {
        const user = await User.findById(req.session.user._id);
        const topics = await Topic.find()
        const vocabularys = await Vocabulary.find()

        if (!user) {
            req.flash('error', 'Please try again');
            return res.redirect('/user/profile')
        }

        res.render('user/user_Home', { user, topics, vocabularys });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Lấy thông tin profile 
const getProfileUser = async (req, res) => {
    try {
        const user = await User.findById(req.session.user._id);

        if (!user) {
            req.flash('error', 'Please try again');
            return res.redirect('/user/profile')
        }

        res.render('user/user_Profile', { user });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Chỉnh sửa profile 
const getEditProfileUser = async (req, res) => {
    try {
        const user = await User.findById(req.session.user._id);
        if (!user) {
            req.flash('error', 'User not found.');
            return res.redirect('/user/profile');
        }
        res.render('user/user_EditProfile', { user });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Gửi post edit profile
const postEditProfileUser = async (req, res) => {
    try {
        const { user_name, user_full_name, user_date_of_birth, user_phone_number, user_email } = req.body;
        let updateData = {
            user_name,
            user_full_name,
            user_date_of_birth: new Date(user_date_of_birth),
            user_phone_number,
            user_email
        };

        if (req.file) {
            updateData.user_avatar = '/images/' + req.file.filename;
        }

        // Cập nhật thông tin người dùng trong cơ sở dữ liệu
        const user = await User.findByIdAndUpdate(req.session.user._id, updateData, { new: true });
        if (!user) {
            req.flash('error', 'Error updating profile. Please try again.');
            return res.redirect('/user/edit');
        }

        // Cập nhật thông tin người dùng trong session
        req.session.user = {
            _id: user._id,
            user_avatar: user.user_avatar,
            user_name: user.user_name,
            user_full_name: user.user_full_name,
            user_date_of_birth: user.user_date_of_birth,
            user_phone_number: user.user_phone_number,
            user_email: user.user_email,
            user_status: user.user_status,
            check_email_confirmation: user.check_email_confirmation
        };

        req.flash('success', 'Profile updated successfully.');
        res.redirect('/user/profile');
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const getSearchVocabulary = async (req, res) => {
    const { q } = req.query;
    try {
        const results = await Vocabulary.find({ vocabulary_name: new RegExp(q, 'i') }).limit(10).lean().exec();
        res.json(results);
    } catch (err) {
        res.status(500).send('Server Error');
    }
};

// Lấy thông tin tất cả từ vựng 
const getListVocabulary = async (req, res) => {
    const user = req.session.user;

    try {
        const list_vocabulary_user = await VocabularyUser.find({ user: user._id });
        const userVocabularyIds = list_vocabulary_user.map(v => v.vocabulary.toString());

        const list_vocabulary = await Vocabulary.find({ 
            vocabulary_recommendation_status: { $in: [1, 3] } 
        });

        // Add is_Favorite flag to each vocabulary
        list_vocabulary.forEach(vocabulary => {
            vocabulary.is_Favorite = userVocabularyIds.includes(vocabulary._id.toString());
        });
        
        res.render('user/user_ListVocabulary', { list_vocabulary });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Lấy thông tin chi tiết từ vựng 
const getDetailVocabulary = async (req, res) => {
    const vocabularyId = req.params.id;
    const user = req.session.user;

    try {
        const vocabulary = await Vocabulary.findById(vocabularyId);
        if (!vocabulary) {
            return res.redirect('/404');
        }

        // Chủ đề của từ vựng
        const list_vocabulary_topic = await VocabularyTopic.find({ vocabulary: vocabulary._id }).populate('topic').populate('vocabulary');

        // Thêm từ vựng yêu thích
        const is_Favorite = await VocabularyUser.exists({ user: user._id, vocabulary: vocabularyId });
        vocabulary.is_Favorite = is_Favorite;

        // Tìm các từ vựng cùng chủ đề (trừ từ vựng hiện tại)
        const relatedVocabularies = await Vocabulary.find({
            _id: { $ne: vocabularyId }, 
            vocabulary_topic: vocabulary.vocabulary_topic 
        }).limit(4); 

        res.render('user/user_DetailVocabulary', { vocabulary, list_vocabulary_topic, relatedVocabularies });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Lấy thông tin chi tiết từ vựng
const getDetailVocabularyAI = async (req, res) => {
    try {
        const list_vocabulary = await Vocabulary.find({ 
            vocabulary_recommendation_status: { $in: [1, 3] } 
        });

        res.render('user/user_DetailVocabularyAI', { list_vocabulary });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Lấy thông tin tất cả topic
const getListTopic = async (req, res) => {
    try {
        const list_topic = await Topic.find();
        res.render('user/user_ListTopic', { list_topic });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Lấy thông tin tất cả chữ cái
const getListLetter = async (req, res) => {
    const list_letter = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    res.render('user/user_ListLetter', { list_letter });
};

// Lấy thông tin tất cả độ khó
const getListDifficultyLevel = async (req, res) => {
    const list_difficulty_level = '12345'.split('');
    res.render('user/user_ListDifficultyLevel', { list_difficulty_level });
};

// Lấy danh sách từ vựng theo chủ đề
const getListVocabularyTopic = async (req, res) => {
    const topicId = req.params.id;
    const userId = req.session.user._id; 
    
    try {
        const topic = await Topic.findById(topicId);

        const filteredVocabTopics = await VocabularyTopic.find({ topic: topicId })
        .populate({
            path: 'vocabulary',
            match: { 
                vocabulary_recommendation_status: { $in: [1, 3] } 
            }
        });

        if (!filteredVocabTopics) {
            return res.redirect('/404');
        }

        const list_vocabulary_topic = filteredVocabTopics.filter(vt => vt.vocabulary !== null);

        const list_vocabulary_user = await VocabularyUser.find({ user: userId });
        const userVocabularyIds = list_vocabulary_user.map(v => v.vocabulary.toString());

        list_vocabulary_topic.forEach(vt => {
            vt.vocabulary.is_Favorite = userVocabularyIds.includes(vt.vocabulary._id.toString());
        });

        res.render('user/user_ListVocabularyTopic', { topic, list_vocabulary_topic });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Lấy danh sách từ vựng theo chữ cái
const getListVocabularyLetter = async (req, res) => {
    const letter = req.params.letter.toLowerCase();
    const userId = req.session.user._id; 
    
    try {
        const list_vocabulary_letter = await Vocabulary.find({
            vocabulary_name: new RegExp('^' + letter, 'i'), 
            vocabulary_recommendation_status: { $in: [1, 3] } 
        });

        const list_vocabulary_user = await VocabularyUser.find({ user: userId });
        const userVocabularyIds = list_vocabulary_user.map(v => v.vocabulary.toString());

        list_vocabulary_letter.forEach(vocabulary => {
            vocabulary.is_Favorite = userVocabularyIds.includes(vocabulary._id.toString());
        });

        res.render('user/user_ListVocabularyLetter', { letter, list_vocabulary_letter });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Lấy danh sách từ vựng theo độ khó
const getListVocabularyDifficultyLevel = async (req, res) => {
    const level = req.params.level;
    const userId = req.session.user._id;
    
    try {
        const list_vocabulary_difficulty_level = await Vocabulary.find({ 
            vocabulary_difficulty_level: level,
            vocabulary_recommendation_status: { $in: [1, 3] } 
        });
        
        if (!list_vocabulary_difficulty_level) {
            return res.redirect('/404');
        }

        const list_vocabulary_user = await VocabularyUser.find({ user: userId });
        const userVocabularyIds = list_vocabulary_user.map(v => v.vocabulary.toString());

        list_vocabulary_difficulty_level.forEach(vocabulary => {
            vocabulary.is_Favorite = userVocabularyIds.includes(vocabulary._id.toString());
        });

        res.render('user/user_ListVocabularyDifficultyLevel', { level, list_vocabulary_difficulty_level });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Thêm từ vựng vào danh sách yêu thích
const postToggleVocabularyUser = async (req, res) => {
    const userId = req.session.user._id;
    const { vocabularyId } = req.body;

    try {
        const favorite = await VocabularyUser.findOne({ user: userId, vocabulary: vocabularyId });

        if (favorite) {
            // If the vocabulary is already in the user's favorites, remove it
            await VocabularyUser.deleteOne({ user: userId, vocabulary: vocabularyId });
            return res.json({ is_Favorite: false });
        } else {
            // If not, add it to the user's favorites
            await VocabularyUser.create({ user: userId, vocabulary: vocabularyId });
            return res.json({ is_Favorite: true });
        }
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

// Lấy thông tin tất cả từ vựng yêu thích
const getListFavorite = async (req, res) => {
    const userId = req.session.user._id;

    try {
        const list_vocabulary_user = await VocabularyUser.find({ user: userId }).populate('vocabulary');

        const userVocabularyIds = list_vocabulary_user.map(v => v.vocabulary._id.toString());

        list_vocabulary_user.forEach(vocabularyUser => {
            vocabularyUser.vocabulary.is_Favorite = userVocabularyIds.includes(vocabularyUser.vocabulary._id.toString());
        });

        res.render('user/user_ListVocabularyUser', { list_vocabulary_user });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Lấy thông tin tất cả từ vựng yêu thích random để ôn tập
const getListPractice = async (req, res) => {
    try {
        const list_practice = await VocabularyUser.find().populate('vocabulary');

        // Random danh sách
        const shuffled_list_practice = _.shuffle(list_practice);

        res.render('user/user_ListPractice', { shuffled_list_practice });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Lấy thông tin tất cả từ vựng yêu thích random để ôn tập qua AI
const getListPracticeAI = async (req, res) => {
    try {
        const list_practice = await VocabularyUser.find().populate('vocabulary');

        // Random danh sách
        const shuffled_list_practice = _.shuffle(list_practice);

        res.render('user/user_ListPracticeAI', { shuffled_list_practice });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Xử lý và hiển thị kết quả ôn tập từ vựng yêu thích
const postListPractice = async (req, res) => {
    try {
        const { userAnswers } = req.body;

        console.log({ userAnswers })

        // Kiểm tra xem userAnswers có tồn tại và là mảng không
        if (!Array.isArray(userAnswers)) {
            console.error('Invalid input data: userAnswers is not an array');
            return res.status(400).json({ message: 'Invalid input data: userAnswers is not an array' });
        }

        let correct = 0;
        let incorrect = 0;

        // Duyệt qua từng câu trả lời để kiểm tra
        for (let i = 0; i < userAnswers.length; i++) {
            const userAnswer = userAnswers[i];
            const userResponse = userAnswer.answer ? userAnswer.answer.toLowerCase() : '';
            const correctResponse = userAnswer.correctAnswer ? userAnswer.correctAnswer.toLowerCase() : '';

            // So sánh câu trả lời của người dùng với đáp án đúng
            if (userResponse === correctResponse) {
                correct++;
            } else {
                incorrect++;
            }
        }

        // Trả về kết quả
        res.json({
            correct,
            incorrect,
            total: userAnswers.length
        });
    } catch (err) {
        console.error('Error processing results:', err);
        res.status(500).json({ message: 'Internal Server Error 11' });
    }
};

// Lấy thông tin tất cả từ vựng phê duyệt
const getListRecommendationVocabulary = async (req, res) => {
    const user = req.session.user;

    try {
        const list_topic = await Topic.find()
          
        const filteredVocabularies = await VocabularyUser.find({
            user: user._id
        }).populate({
            path: 'vocabulary',
            match: { vocabulary_recommendation_status: { $in: [0, 2, 3] } }
        });

        // Loại bỏ các kết quả không có vocabulary vì không match điều kiện match
        const list_recommendation_vocabulary = filteredVocabularies.filter(vu => vu.vocabulary !== null);
        
        res.render('user/user_ListRecommendationVocabulary', { list_topic, list_recommendation_vocabulary });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Thêm từ vựng đề xuất
const postAddRecommendationVocabulary = async (req, res) => {
    const { vocabulary_topic, vocabulary_name, vocabulary_description, vocabulary_difficulty_level } = req.body;
    let { vocabulary_video_link } = req.body;
    const user = req.session.user;

    if (req.file) {
        vocabulary_video_link = req.file.path;
    }

    try {
        const topic = await Topic.findById(vocabulary_topic);
        if (!topic) {
            return res.status(404).json({ error: 'Topic not found' });
        }

        const vocabulary = new Vocabulary({
            vocabulary_name,
            vocabulary_description,
            vocabulary_topic,
            vocabulary_difficulty_level,
            vocabulary_video_link,
            vocabulary_recommendation_status: 2,
        });
        await vocabulary.save();

        const vocabularyTopic = new VocabularyTopic({
            vocabulary: vocabulary._id,
            topic: topic._id
        });
        await vocabularyTopic.save();

        const vocabularyUser = new VocabularyUser({
            vocabulary: vocabulary._id,
            user: user._id
        });
        await vocabularyUser.save();

        req.flash('success', 'Successfully created and customized vocabulary');
        return res.redirect('/user/list-recommendation-vocabulary');
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = {
    getRegisterUser,
    postRegisterUser,
    getVerifyEmailTokenUser,
    getLoginUser,
    postLoginUser,
    getForgotPasswordUser,
    postForgotPasswordUser,
    getResetPasswordUser,
    postResetPasswordUser,
    getLockedStatusUser,
    getResendEmailUser,
    postResendEmailUser,
    getLogoutUser,
    getHomeUser,
    getProfileUser,
    getEditProfileUser,
    postEditProfileUser,
    getSearchVocabulary,
    getListVocabulary,
    getDetailVocabulary,
    getDetailVocabularyAI,
    getListTopic,
    getListLetter,
    getListDifficultyLevel,
    getListVocabularyTopic,
    getListVocabularyLetter,
    getListVocabularyDifficultyLevel,
    postToggleVocabularyUser,
    getListFavorite,
    getListPractice,
    getListPracticeAI,
    postListPractice,
    getListRecommendationVocabulary,
    postAddRecommendationVocabulary,
};