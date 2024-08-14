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

// Hiển thị đăng nhập 
const getLoginAdmin = async (req, res) => {
    try {
        if (req.session.admin) {
            res.redirect('/admin/index');
        } else {
            res.render('admin/admin_Login');
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Gửi thông tin đăng nhập
const postLoginAdmin = async (req, res) => {
    const { admin_name, admin_password } = req.body;

    try {
        const admin = await Admin.findOne({ admin_name, admin_password });

        if (!admin) {
            req.flash('error', 'Incorrectly entered administrator name or password');
            return res.redirect('/admin/login')
        } else {
            req.session.admin = admin;
            return res.redirect('/admin/index')
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Đăng xuất 
const getLogoutAdmin = async (req, res) => {
    try {
        req.session.admin = null; 

        res.redirect('/admin/login'); 
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Hiển thị trang phân tích báo cáo
const getIndexAdmin = async (req, res) => {
    try {
        const list_topic = await Topic.find();
        const list_user = await User.find();
        const list_vocabulary = await Vocabulary.find();
        const list_vocabulary_user = await VocabularyUser.distinct('vocabulary');

        const topicCount = await Topic.countDocuments();
        const userCount = await User.countDocuments();
        const vocabularyCount = await Vocabulary.countDocuments();
        let favoriteVocabularyCount = list_vocabulary_user.length;

        res.render('admin/admin_Index.ejs', { list_topic, list_user, list_vocabulary, topicCount, userCount, vocabularyCount, favoriteVocabularyCount});
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Lấy thông tin profile
const getProfileAdmin = async (req, res) => {
    try {
        res.render('admin/admin_Profile');
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Chỉnh sửa mật khẩu
const postChangePasswordAdmin = async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const admin = await Admin.findById(req.session.admin._id); 

    try {
        if (currentPassword !== admin.admin_password) {
            req.flash('error', 'Current password is incorrect');
            return res.redirect('/admin/profile'); 
        }

        admin.admin_password = newPassword;
        await admin.save();

        req.flash('success', 'Password changed successfully');
        return res.redirect('/admin/profile'); 
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Lấy thông tin tất cả từ vựng
const getListVocabulary = async (req, res) => {
    try {
        const list_topic = await Topic.find()
        const list_vocabulary_topic = await VocabularyTopic.find().populate('vocabulary').populate('topic')

        res.render('admin/admin_ListVocabulary', { list_topic, list_vocabulary_topic });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Chi tiết từ vựng
const getDetailVocabularyByID = async (req, res) => {
    const vocabularyID = req.params.vocabularyID

    try {
        const vocabulary = await Vocabulary.findById(vocabularyID);

        if (!vocabulary) {
            return res.status(404).json({ message: 'Vocabulary not found' });
        }

        const list_vocabulary_topic = await VocabularyTopic.find({ vocabulary: vocabulary._id }).populate('topic').populate('vocabulary');

        res.render('admin/admin_DetailVocabulary', { vocabulary, list_vocabulary_topic });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Lấy data từ vựng để đưa vô EDIT MODAL
const postVocabularyByID = async (req, res) => {
    const vocabulary = await Vocabulary.findById(req.params.vocabularyID);

    try {
        res.json(vocabulary);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Thêm từ vựng 
const postAddVocabulary = async (req, res) => {
    const { vocabulary_topic, vocabulary_name, vocabulary_description, vocabulary_difficulty_level } = req.body;
    const vocabulary_video_link = req.file.path;

    try {
        const topic = await Topic.findById(vocabulary_topic);
        if (!topic) {
            return res.status(404).json({ error: 'Topic not found' });
        }

        const vocabulary = new Vocabulary({
            vocabulary_name,
            vocabulary_description,
            vocabulary_difficulty_level,
            vocabulary_video_link,
            vocabulary_recommendation_status: 1,
        });
        await vocabulary.save();

        const vocabularyTopic = new VocabularyTopic({
            vocabulary: vocabulary._id,
            topic: topic._id
        });
        await vocabularyTopic.save();

        res.status(200).json({ message: 'Vocabulary added to topic successfully', vocabulary, vocabularyTopic });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Chỉnh sửa từ vựng 
const putEditVocabulary = async (req, res) => {
    const vocabularyId = req.params.vocabularyID;
    const { vocabulary_topic, vocabulary_name, vocabulary_description, vocabulary_difficulty_level } = req.body;
    const vocabulary_video_link = req.file.path;

    try {
        const topic = await Topic.findById(vocabulary_topic);
        if (!topic) {
            return res.status(404).json({ error: 'Topic not found' });
        }

        const updatedVocabulary = await Vocabulary.findByIdAndUpdate(vocabularyId, {
            vocabulary_name,
            vocabulary_description,
            vocabulary_difficulty_level,
            vocabulary_video_link,
        }, { new: true });

        if (!updatedVocabulary) {
            return res.status(404).json({ message: 'Please try again' });
        }

        const updatedVocabularyTopic = await VocabularyTopic.findOneAndUpdate(
            { vocabulary: vocabularyId },
            { topic: vocabulary_topic },
            { new: true, upsert: true }
        );

        res.status(200).json({
            message: 'Edit vocabulary successfully',
            vocabulary: updatedVocabulary,
            vocabularyTopic: updatedVocabularyTopic
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Xóa sản phẩm vào database
const deleteDeleteVocabulary  = async (req, res) => {
    const vocabularyId = req.params.vocabularyID;

    try {
        await VocabularyTopic.deleteMany({ vocabulary: vocabularyId });

        await VocabularyUser.deleteMany({ vocabulary: vocabularyId });

        const deletedVocabulary = await Vocabulary.findOneAndDelete({ _id: vocabularyId });

        if (!deletedVocabulary) {
            return res.status(404).json({ message: 'Vocabulary not found.' });
        }

        res.status(200).json({ message: 'Vocabulary and associated references deleted successfully.', data: deletedVocabulary });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Lấy thông tin tất cả từ vựng phê duyệt = done
const getListRecommendationVocabulary = async (req, res) => {
    try {
        const vocabularyList = await Vocabulary.find({ 
            vocabulary_recommendation_status: { $in: [0, 2, 3] } 
        });
          
        const vocabularyIds = vocabularyList.map(vocab => vocab._id);
          
        const list_recommendation_vocabulary = await VocabularyTopic.find({ 
            vocabulary: { $in: vocabularyIds }
        }).populate('vocabulary').populate('topic');

        res.render('admin/admin_ListRecommendationVocabulary', { list_recommendation_vocabulary });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Thay đổi thông tin từ vựng phê duyệt = done
const putChangeRecommendationVocabulary = async (req, res) => {
    const vocabularyId = req.params.vocabularyID;
    const { request } = req.body; //gui 0 de tu choi, gui 3 hien thi 

    try {
        const updatedVocabulary = await Vocabulary.findByIdAndUpdate(
            vocabularyId,
            { vocabulary_recommendation_status: request },
            { new: true }
        );

        if (!updatedVocabulary) {
            return res.status(404).json({ message: 'Please try again' });
        }

        res.status(200).json({ message: 'Change status vocabulary successfully', vocabulary: updatedVocabulary });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

// Lấy thông tin tất cả chủ đề = done
const getListTopic = async (req, res) => {
    try {
        const list_topic = await Topic.find();
        res.render('admin/admin_ListTopic', { list_topic });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Lấy data danh sách chủ đề để đưa vô EDIT MODAL
const getTopicByID = async (req, res) => {
    const topic = await Topic.findById(req.params.topicID);

    try {
        res.json(topic);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Lấy data chủ đề chi tiết để đưa vô EDIT MODAL
const getDetailTopicByID = async (req, res) => {
    const topic = await Topic.findById(req.params.topicID);

    try {
        const list_vocabulary_topic = await VocabularyTopic.find({ topic: req.params.topicID })
            .populate('vocabulary');

        res.render('admin/admin_DetailTopic.ejs', { topic, list_vocabulary_topic })
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Thêm chủ đề vào database  ==> DONE
const postAddTopic = async (req, res) => {
    try {
        const {
            topic_name,
            topic_description
        } = req.body;

        const topic_image = req.file.filename;
        
        const newTopic = new Topic({
            topic_name,
            topic_description,
            topic_image
        });

        await newTopic.save();

        res.status(200).json({ message: 'Added topic successfully', topic: newTopic });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Chỉnh sửa chủ đè vào database
const putEditTopic = async (req, res) => {
    const topicId = req.params.topicID;
    const {
        topic_name,
        topic_description,
    } = req.body;

    const topic_image = req.file.filename;

    try {
        const updatedTopic = await Topic.findByIdAndUpdate(topicId, {
            topic_name,
            topic_description,
            topic_image
        }, { new: true });

        if (!updatedTopic) {
            return res.status(404).json({ message: 'Please try again' });
        }

        res.status(200).json({ message: 'Edit topic successfully', topic: updatedTopic });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Xóa sản phẩm vào database
const deleteDeleteTopic = async (req, res) => {
    const topicId = req.params.topicID;
    
    try {
        await VocabularyTopic.deleteMany({ topic: topicId });

        const deletedTopic = await Topic.findByIdAndDelete(topicId);

        if (!deletedTopic) {
            return res.status(404).json({ message: 'Topic not found.' });
        }

        res.status(200).json({ message: 'Topic and associated references deleted successfully.', data: deletedTopic });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Lấy thông tin tất cả người dùng
const getListUser = async (req, res) => {
    try {
        const list_user = await User.find();
        res.render('admin/admin_ListUser', { list_user });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Lấy thông tin chi tiết người dùng
const getDetailUser = async (req, res) => {
    const userId = req.params.userID;

    try {
        const user = await User.findById(userId);
        const vocabularyUser = await VocabularyUser.find({ user: userId }).populate('user').populate('vocabulary') || [];

        res.render('admin/admin_DetailUser', { user, vocabularyUser });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Thay đổi trạng thái người dùng
const postChangeStatusUser = async (req, res) => {
    const userID = req.params.userID
    const { status } = req.body;
    try {
        const user = await User.findById(userID);

        if (!user) {
            return res.status(404).json({ message: 'Please try again' });
        }

        user.user_status = !status;
        await user.save();

        return res.status(200).json({ message: 'Updated status', user: user });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

// Hiển thị trang upload mô hình
const getUploadModel = async (req, res) => {
    try {
        res.render('admin/admin_UploadModel');
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Gửi mô hình lên thư mục
const postUploadModel = async (req, res) => {
    try {
        req.flash('success', 'Model uploaded successfully');
        return res.redirect('/admin/upload-model'); 
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = {
    getLoginAdmin,
    postLoginAdmin,
    getLogoutAdmin,
    getIndexAdmin,
    getProfileAdmin,
    postChangePasswordAdmin,
    getListVocabulary,
    getDetailVocabularyByID,
    postVocabularyByID,
    postAddVocabulary,
    putEditVocabulary,
    deleteDeleteVocabulary,
    getListRecommendationVocabulary,
    putChangeRecommendationVocabulary,
    getListTopic,
    getTopicByID,
    getDetailTopicByID,
    postAddTopic,
    putEditTopic,
    deleteDeleteTopic,
    getListUser,
    getDetailUser,
    postChangeStatusUser,
    getUploadModel,
    postUploadModel,
};