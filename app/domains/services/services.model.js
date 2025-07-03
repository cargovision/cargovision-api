const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
    email: { type: String, required: true }
});

const Service = mongoose.model("Service", serviceSchema);

module.exports = {
    Service
};