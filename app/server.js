const path = require('path');
const express = require('express');
const passport = require('passport');
const session = require('express-session');
const cors = require('cors');

const app = express();

// const bodyParser = require('body-parser');
// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({ extended: true }));

app.use(cors({
    origin: [
        'http://localhost:80',
        'http://localhost:3000',
        'http://localhost:8080',
        'http://localhost:4173',
        'http://localhost:5173',
        'https://cargovision.app',
        'https://api.cargovision.app'
    ],
    credentials: true
}));
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

const userRouter = require('./domains/users/user.router');
app.use('/user', userRouter);

const serviceRouter = require('./domains/services/services.router');
app.use('/service', serviceRouter);

app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname, 'templates/pages/index.html'));
});

module.exports = app;
