const express = require('express');
const emailAuthRouter = express.Router();

const emailAuthController = require('./auth.email.controller');

emailAuthRouter.post('/verify', emailAuthController.verify);
emailAuthRouter.post('/register', emailAuthController.register);
emailAuthRouter.get('/activate', emailAuthController.activate);
emailAuthRouter.get('/activation', emailAuthController.activation);
emailAuthRouter.post('/login', emailAuthController.login);
emailAuthRouter.post('/forgot-password', emailAuthController.forgot);
emailAuthRouter.put('/change-password', emailAuthController.change);

module.exports = emailAuthRouter;