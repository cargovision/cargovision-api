const Service = require('../services.model').Service;
const uploadImage = require('../../../configs/storage/cloudflare-r2/s3.client');
const fileType = require('file-type');
const axios = require('axios');

const ocr = async (req, res) => {
    try {
        if (!Buffer.isBuffer(req.body)) {
            return res.status(400).json({
                status: 'error',
                message: `Body must be image buffer. Received: ${typeof req.body}`,
                data: {
                    contentType: req.get('Content-Type'),
                    bodyType: typeof req.body,
                    bodyLength: req.body ? req.body.length : 'undefined'
                }
            });
        }

        const type = await fileType.fileTypeFromBuffer(req.body);
        
        if (!type || !type.mime.startsWith('image/')) {
            return res.status(400).json({
                status: 'error',
                message: `Uploaded file is not a valid image`,
                data: {}
            });
        }

        const getService = await Service.findOne({ email: req.user.email });
        if (!getService) {
            return res.status(400).json({
                status: 'error',
                message: "User not found or not registered yet",
                data: {}
            });
        }

        const FormData = require('form-data');
        const formData = new FormData();
        
        const mimeType = type.mime;
        formData.append('file', req.body, {
            filename: `image.${type.ext}`,
            contentType: mimeType
        });

        try {
            const response = await axios.post(process.env.CARGOVISION_AI_HOST + "/inspect/container-with-ocr/", formData, {
                headers: {
                    ...formData.getHeaders(),
                    'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:140.0) Gecko/20100101 Firefox/140.0',
                    'Accept': 'application/json',
                    'Accept-Language': 'en-US,en;q=0.5'
                },
                maxContentLength: Infinity,
                maxBodyLength: Infinity
            });

            let data = response.data;

            const newOcrScanObject = {
                detections: data["detections"],
            };
            
            getService.ocrScans.push(newOcrScanObject);
            const savedService = await getService.save();

            const id = savedService.ocrScans.slice(-1)[0]._id;

            const scanImage = await uploadImage(req.body, `ocr/scan/${id}`);

            const visualizationFormData = new FormData();
            visualizationFormData.append('file', req.body, {
                filename: `image.${type.ext}`,
                contentType: type.mime
            });
            
            const visualizationResponse = await axios.post(process.env.CARGOVISION_AI_HOST + "/visualize/container-with-ocr/", visualizationFormData, {
                headers: visualizationFormData.getHeaders(),
                maxContentLength: Infinity,
                maxBodyLength: Infinity,
                responseType: 'arraybuffer'
            });

            let visualizationImage = null;
            if (visualizationResponse.status === 200) {
                const visualizationBuffer = Buffer.from(visualizationResponse.data);
                visualizationImage = await uploadImage(visualizationBuffer, `ocr/visualization/${id}`);
            } else {
                console.error('Visualization request failed:', visualizationResponse.status);
            }

            return res.status(200).json({
                status: "success",
                message: "Successfully created OCR analysis and visualization",
                data: {
                    id: id,
                    scanImage: scanImage,
                    visualizationImage: visualizationImage,
                    detections: data["detections"]
                }
            });
        } catch (error) {
            console.error("Axios error:", error.message);
            
            if (error.response) {
                console.error("Error response status:", error.response.status);
                console.error("Error response data:", error.response.data);
                return res.status(400).json({
                    status: 'error',
                    message: process.env.DEBUG ? error.response.data.detail || error.response.data.message : "Failed to process request",
                    data: error.response.data
                });
            } else if (error.request) {
                console.error("No response received:", error.request);
                return res.status(500).json({
                    status: 'error',
                    message: "No response from AI service",
                    data: {}
                });
            } else {
                console.error("Request setup error:", error.message);
                return res.status(500).json({
                    status: 'error',
                    message: "Error setting up request",
                    data: {}
                });
            }
        }
    } catch(err) {
        console.error(err);
        return res.status(400).json({
            status: 'error',
            message: process.env.DEBUG ? err.message : "Bad Request",
            data: {}
        });
    }
};

const illegal = async (req, res) => {
    try {
        const containerID = req.params.id;

        if (!Buffer.isBuffer(req.body)) {
            return res.status(400).json({
                status: 'error',
                message: `Body must be image buffer. Received: ${typeof req.body}`,
                data: {
                    contentType: req.get('Content-Type'),
                    bodyType: typeof req.body,
                    bodyLength: req.body ? req.body.length : 'undefined'
                }
            });
        }

        const type = await fileType.fileTypeFromBuffer(req.body);
        
        if (!type || !type.mime.startsWith('image/')) {
            return res.status(400).json({
                status: 'error',
                message: `Uploaded file is not a valid image`,
                data: {}
            });
        }

        const getService = await Service.findOne({ email: req.user.email });
        if (!getService) {
            return res.status(400).json({
                status: 'error',
                message: "User not found or not registered yet",
                data: {}
            });
        }

        const FormData = require('form-data');
        const formData = new FormData();
        
        const filename = `${Date.now()}_${type.ext}.rf.${Math.random().toString(36).substr(2, 32)}.${type.ext}`;
        const mimeType = type.mime;
        
        formData.append('file', req.body, {
            filename: filename,
            contentType: mimeType
        });

        try {
            const response = await axios.post(process.env.CARGOVISION_AI_HOST + "/inspect/dangerous-goods/", formData, {
                headers: {
                    ...formData.getHeaders(),
                    'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:140.0) Gecko/20100101 Firefox/140.0',
                    'Accept': 'application/json',
                    'Accept-Language': 'en-US,en;q=0.5'
                },
                maxContentLength: Infinity,
                maxBodyLength: Infinity
            });

            let data = response.data;
            
            const newScanObject = {
                containerID: containerID,
                detections: data["detections"],
            };
            
            getService.illegalScans.push(newScanObject);
            const savedService = await getService.save();

            const id = savedService.illegalScans.slice(-1)[0]._id;

            const scanImage = await uploadImage(req.body, `illegal/scan/${id}`);

            const visualizationFormData = new FormData();
            visualizationFormData.append('file', req.body, {
                filename: filename,
                contentType: mimeType
            });
            
            const visualizationResponse = await axios.post(process.env.CARGOVISION_AI_HOST + "/visualize/dangerous-goods/", visualizationFormData, {
                headers: visualizationFormData.getHeaders(),
                maxContentLength: Infinity,
                maxBodyLength: Infinity,
                responseType: 'arraybuffer'
            });

            let visualizationImage = null;
            if (visualizationResponse.status === 200) {
                const visualizationBuffer = Buffer.from(visualizationResponse.data);
                visualizationImage = await uploadImage(visualizationBuffer, `illegal/visualization/${id}`);
            } else {
                console.error('Visualization request failed:', visualizationResponse.status);
            }

            return res.status(200).json({
                status: "success",
                message: "Successfully created dangerous goods detection and visualization",
                data: {
                    id: id,
                    scanImage: scanImage,
                    visualizationImage: visualizationImage,
                    detections: data["detections"]
                }
            });
        } catch (error) {
            console.error("Axios error:", error.message);
            
            if (error.response) {
                console.error("Error response status:", error.response.status);
                console.error("Error response data:", error.response.data);
                return res.status(400).json({
                    status: 'error',
                    message: process.env.DEBUG ? error.response.data.detail || error.response.data.message : "Failed to process request",
                    data: error.response.data
                });
            } else if (error.request) {
                console.error("No response received:", error.request);
                return res.status(500).json({
                    status: 'error',
                    message: "No response from AI service",
                    data: {}
                });
            } else {
                console.error("Request setup error:", error.message);
                return res.status(500).json({
                    status: 'error',
                    message: "Error setting up request",
                    data: {}
                });
            }
        }
    } catch(err) {
        console.error(err);
        return res.status(400).json({
            status: 'error',
            message: process.env.DEBUG ? err.message : "Bad Request",
            data: {}
        });
    }
};

const categorize = async (req, res) => {
    try {
        const containerID = req.params.id;

        if (!Buffer.isBuffer(req.body)) {
            return res.status(400).json({
                status: 'error',
                message: `Body must be image buffer. Received: ${typeof req.body}`,
                data: {
                    contentType: req.get('Content-Type'),
                    bodyType: typeof req.body,
                    bodyLength: req.body ? req.body.length : 'undefined'
                }
            });
        }

        const type = await fileType.fileTypeFromBuffer(req.body);
        
        if (!type || !type.mime.startsWith('image/')) {
            return res.status(400).json({
                status: 'error',
                message: `Uploaded file is not a valid image`,
                data: {}
            });
        }

        const getService = await Service.findOne({ email: req.user.email });
        if (!getService) {
            return res.status(400).json({
                status: 'error',
                message: "User not found or not registered yet",
                data: {}
            });
        }

        const FormData = require('form-data');
        const formData = new FormData();
        
        const mimeType = type.mime;
        formData.append('file', req.body, {
            filename: `image.${type.ext}`,
            contentType: mimeType
        });

        try {
            const response = await axios.post(process.env.CARGOVISION_AI_HOST + "/inspect/item-types/", formData, {
                headers: {
                    ...formData.getHeaders(),
                    'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:140.0) Gecko/20100101 Firefox/140.0',
                    'Accept': 'application/json',
                    'Accept-Language': 'en-US,en;q=0.5'
                },
                maxContentLength: Infinity,
                maxBodyLength: Infinity
            });

            let data = response.data;

            const newCategoryScanObject = {
                containerID: containerID,
                detections: data["detections"],
            };
            
            getService.categoryScans.push(newCategoryScanObject);
            const savedService = await getService.save();

            const id = savedService.categoryScans.slice(-1)[0]._id;

            const scanImage = await uploadImage(req.body, `categorize/scan/${id}`);

            const visualizationFormData = new FormData();
            visualizationFormData.append('file', req.body, {
                filename: `image.${type.ext}`,
                contentType: type.mime
            });
            
            const visualizationResponse = await axios.post(process.env.CARGOVISION_AI_HOST + "/visualize/item-types/", visualizationFormData, {
                headers: visualizationFormData.getHeaders(),
                maxContentLength: Infinity,
                maxBodyLength: Infinity,
                responseType: 'arraybuffer'
            });

            let visualizationImage = null;
            if (visualizationResponse.status === 200) {
                const visualizationBuffer = Buffer.from(visualizationResponse.data);
                visualizationImage = await uploadImage(visualizationBuffer, `categorize/visualization/${id}`);
            } else {
                console.error('Visualization request failed:', visualizationResponse.status);
            }

            return res.status(200).json({
                status: "success",
                message: "Successfully created item categorization and visualization",
                data: {
                    id: id,
                    scanImage: scanImage,
                    visualizationImage: visualizationImage,
                    detections: data["detections"]
                }
            });
        } catch (error) {
            console.error("Axios error:", error.message);
            
            if (error.response) {
                console.error("Error response status:", error.response.status);
                console.error("Error response data:", error.response.data);
                return res.status(400).json({
                    status: 'error',
                    message: process.env.DEBUG ? error.response.data.detail || error.response.data.message : "Failed to process request",
                    data: error.response.data
                });
            } else if (error.request) {
                console.error("No response received:", error.request);
                return res.status(500).json({
                    status: 'error',
                    message: "No response from AI service",
                    data: {}
                });
            } else {
                console.error("Request setup error:", error.message);
                return res.status(500).json({
                    status: 'error',
                    message: "Error setting up request",
                    data: {}
                });
            }
        }
    } catch(err) {
        console.error(err);
        return res.status(400).json({
            status: 'error',
            message: process.env.DEBUG ? err.message : "Bad Request",
            data: {}
        });
    }
};

module.exports = {
    ocr,
    illegal,
    categorize
};