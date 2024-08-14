const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    user_avatar: String,
    user_name: String,
    user_password: String,
    user_full_name: String,
    user_date_of_birth: Date,
    user_phone_number: String,
    user_email: String,
    user_status: Boolean,
    check_email_confirmation: Boolean,
    email_verification_token: String,
    email_verification_token_expiration: Date,
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

module.exports = User;