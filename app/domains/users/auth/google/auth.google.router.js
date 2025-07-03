const express = require('express');
const googleAuthRouter = express.Router();

const googleAuthController = require('./auth.google.controller');

googleAuthRouter.get('/', googleAuthController.authenticate);
googleAuthRouter.get('/callback', googleAuthController.callback);
googleAuthRouter.get('/logout', googleAuthController.logout);
googleAuthRouter.get('/failure', googleAuthController.failure);

module.exports = googleAuthRouter;