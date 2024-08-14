const mongoose = require('mongoose');

const vocabularyTopicSchema = new mongoose.Schema({
    vocabulary: { type: mongoose.Schema.Types.ObjectId, ref: 'Vocabulary' },
    topic: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic' }
}, { timestamps: true });

const VocabularyTopic = mongoose.model('VocabularyTopic', vocabularyTopicSchema);

module.exports = VocabularyTopic;
