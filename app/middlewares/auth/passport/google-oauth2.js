const User = require('../../../domains/users/user.model').User;
const Service = require('../../../domains/services/services.model').Service;
const GoogleStrategy = require('passport-google-oauth2').Strategy;

const Strategy = new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_OAUTH_CALLBACK,
    passReqToCallback: true,
}, async function(request, accessToken, refreshToken, profile, done) {
    try {
        const getUser = await User.findOne({ email: profile.email });
        if (!getUser) {
            const newUser = new User({
                email: profile.email,
                auth: "google",
                isEmailVerified: true,
                isRegistered: true
            });
            await newUser.save();
            
            const newService = new Service({
                email: profile.email
            });
            await newService.save();
        }
        return done(null, profile);
    } catch (err) {
        console.error(err);
    }
});

const serializeUser = (user, done) => {
    done(null, user);
};

const deserializeUser = (user, done) => {
    done(null, user);
};

const isLoggedIn = (req, res, next) => {
    req.user ? next() : res.status(401).json({
        status: 'error',
        message: 'Google Auth Unauthorized',
        data: {}
    });
};

module.exports = {
    Strategy,
    serializeUser,
    deserializeUser,
    isLoggedIn
};