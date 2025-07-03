const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
    email: { type: String, required: true },
    ocrScans: [{
        scanImage: { 
            type: String, 
            required: true, 
            default: function() {
                return `https://cdn.cargovision.app/ocr/scan/${this._id}`;
            }
        },
        visualizationImage: { 
            type: String, 
            required: true, 
            default: function() {
                return `https://cdn.cargovision.app/ocr/visualization/${this._id}`;
            }
        },
        detections: [{
            class_name: { type: String, required: true },
            confidence: { type: Number, required: true },
            box: {
                x1: { type: Number, required: true },
                y1: { type: Number, required: true },
                x2: { type: Number, required: true },
                y2: { type: Number, required: true }
            },
            ocr_text: { type: String, required: false }
        }],
        createdTime: { type: Date, required: true, default: new Date() }
    }],
    illegalScans: [{
        containerID: { type: String, required: false },
        scanImage: { 
            type: String, 
            required: true, 
            default: function() {
                return `https://cdn.cargovision.app/illegal/scan/${this._id}`;
            }
        },
        visualizationImage: { 
            type: String, 
            required: true, 
            default: function() {
                return `https://cdn.cargovision.app/illegal/visualization/${this._id}`;
            }
        },
        detections: [{
            class_name: { type: String, required: true },
            confidence: { type: Number, required: true },
            box: {
                x1: { type: Number, required: true },
                y1: { type: Number, required: true },
                x2: { type: Number, required: true },
                y2: { type: Number, required: true }
            }
        }],
        createdTime: { type: Date, required: true, default: new Date() }
    }],
    categoryScans: [{
        containerID: { type: String, required: false },
        scanImage: { 
            type: String, 
            required: true, 
            default: function() {
                return `https://cdn.cargovision.app/categorize/scan/${this._id}`;
            }
        },
        visualizationImage: { 
            type: String, 
            required: true, 
            default: function() {
                return `https://cdn.cargovision.app/categorize/visualization/${this._id}`;
            }
        },
        detections: [{
            class_name: { type: String, required: true },
            confidence: { type: Number, required: true },
            polygon: [{
                x: { type: Number, required: true },
                y: { type: Number, required: true }
            }]
        }],
        createdTime: { type: Date, required: true, default: new Date() }
    }]
});

const Service = mongoose.model("Service", serviceSchema);

module.exports = {
    Service
};