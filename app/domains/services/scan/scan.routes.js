const express = require('express');
const scanRouter = express.Router();
const bodyParser = require('body-parser');

const verifyToken = require('../../../middlewares/auth/jwt/jwt.verify');

const scanController = require('./scan.controller');

scanRouter.use(bodyParser.raw({ 
    type: ['application/octet-stream', 'image/*'], 
    limit: '50mb' 
}));

scanRouter.post('/ocr', verifyToken, scanController.ocr);

scanRouter.post('/illegal', verifyToken, scanController.illegal);
scanRouter.post('/illegal/:id', verifyToken, scanController.illegal);

scanRouter.post('/categorize', verifyToken, scanController.categorize);
scanRouter.post('/categorize/:id', verifyToken, scanController.categorize);

module.exports = scanRouter;