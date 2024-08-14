const mongoose = require('mongoose');

const vocabularyUserSchema = new mongoose.Schema({
    vocabulary: { type: mongoose.Schema.Types.ObjectId, ref: 'Vocabulary' },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

const VocabularyUser = mongoose.model('VocabularyUser', vocabularyUserSchema);

module.exports = VocabularyUser;