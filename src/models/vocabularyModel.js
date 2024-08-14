const mongoose = require('mongoose');

const vocabularySchema = new mongoose.Schema({
    vocabulary_name: String,
    vocabulary_description: String,
    vocabulary_difficulty_level: String,
    vocabulary_video_link: String,
    vocabulary_recommendation_status: Number
}, { timestamps: true });

const Vocabulary = mongoose.model('Vocabulary', vocabularySchema);

module.exports = Vocabulary;
