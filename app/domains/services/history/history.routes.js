const express = require('express');
const historyRouter = express.Router();
const bodyParser = require('body-parser');

const verifyToken = require('../../../middlewares/auth/jwt/jwt.verify');

const historyController = require('./history.controller');

historyRouter.use(bodyParser.json());

historyRouter.get('/ocr', verifyToken, historyController.ocr);
historyRouter.get('/illegal', verifyToken, historyController.illegal);
historyRouter.get('/category', verifyToken, historyController.category);

module.exports = historyRouter;