const Service = require('../services.model').Service;

const ocr = async (req, res) => {
    try {
        const service = await Service.findOne({ email: req.user.email });
        
        if (!service) {
            return res.status(404).json({
                status: 'error',
                message: 'Service not found',
                data: {}
            });
        }
        
        const ocrScans = service.ocrScans.map(scan => ({
            id: scan._id,
            scanImage: scan.scanImage,
            visualizationImage: scan.visualizationImage,
            detections: scan.detections.map(detection => ({
                class_name: detection.class_name,
                confidence: detection.confidence,
                ocr_text: detection.ocr_text || null
            })),
            createdTime: scan.createdTime
        }));
        
        return res.status(200).json({
            status: 'success',
            message: 'successfully read OCR scan history',
            data: {
                ocrScans: ocrScans
            }
        });
    } catch (error) {
        console.error(error);
        return res.status(400).json({
            status: 'error',
            message: process.env.DEBUG ? error.message : "Bad Request",
            data: {}
        });
    }
};

const illegal = async (req, res) => {
    try {
        const service = await Service.findOne({ email: req.user.email });
        
        if (!service) {
            return res.status(404).json({
                status: 'error',
                message: 'Service not found',
                data: {}
            });
        }
        
        const illegalScans = service.illegalScans.map(scan => ({
            id: scan._id,
            containerID: scan.containerID || null,
            scanImage: scan.scanImage,
            visualizationImage: scan.visualizationImage,
            detections: scan.detections.map(detection => ({
                class_name: detection.class_name,
                confidence: detection.confidence
            })),
            createdTime: scan.createdTime
        }));
        
        return res.status(200).json({
            status: 'success',
            message: 'successfully read illegal scan history',
            data: {
                illegalScans: illegalScans
            }
        });
    } catch (error) {
        console.error(error);
        return res.status(400).json({
            status: 'error',
            message: process.env.DEBUG ? error.message : "Bad Request",
            data: {}
        });
    }
}

const category = async (req, res) => {
    try {
        const service = await Service.findOne({ email: req.user.email });
        
        if (!service) {
            return res.status(404).json({
                status: 'error',
                message: 'Service not found',
                data: {}
            });
        }
        
        const categoryScans = service.categoryScans.map(scan => ({
            id: scan._id,
            containerID: scan.containerID || null,
            scanImage: scan.scanImage,
            visualizationImage: scan.visualizationImage,
            detections: scan.detections.map(detection => ({
                class_name: detection.class_name,
                confidence: detection.confidence
            })),
            createdTime: scan.createdTime
        }));
        
        return res.status(200).json({
            status: 'success',
            message: 'successfully read category scan history',
            data: {
                categoryScans: categoryScans
            }
        });
    } catch (error) {
        console.error(error);
        return res.status(400).json({
            status: 'error',
            message: process.env.DEBUG ? error.message : "Bad Request",
            data: {}
        });
    }
};


module.exports = {
    ocr,
    illegal,
    category
}