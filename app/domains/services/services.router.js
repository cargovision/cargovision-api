const express = require('express');
const serviceRouter = express.Router();

const scanRouter = require('./scan/scan.routes');
const historyRouter = require('./history/history.routes');

serviceRouter.use('/scan', scanRouter);
serviceRouter.use('/history', historyRouter);

module.exports = serviceRouter;