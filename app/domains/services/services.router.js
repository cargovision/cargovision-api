const express = require('express');
const serviceRouter = express.Router();

const scanRouter = require('./scan/scan.routes');

serviceRouter.use('/scan', scanRouter);

module.exports = serviceRouter;