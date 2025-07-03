const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email: { type: String, required: true },
    password: { type: String, required: false },
    auth: { type: String, enum: ['google', 'email'], required: true },
    lastEmailVerification: { type: Number, required: true, default: 0 },
    isEmailVerified: { type: Boolean, required: true, default: false },
    isRegistered: { type: Boolean, required: true, default: false }
});

const User = mongoose.model("User", userSchema);

module.exports = {
    User
};