const passport = require('passport');
const googleAuth = require('../../../../middlewares/auth/passport/google-oauth2');

passport.use(googleAuth.Strategy);
passport.serializeUser(googleAuth.serializeUser);
passport.deserializeUser(googleAuth.deserializeUser);

const authenticate = passport.authenticate('google', {
    scope: [ 'email', 'profile' ] 
});

const callback = passport.authenticate( 'google', {
    successRedirect: '/user/auth/sign-token',
    failureRedirect: '/user/auth/google/failure'
});

const logout = (req, res) => {
    req.logout();
    req.session.destroy();
    res.redirect(process.env.FE_HOST);
}

const failure = (req, res) => {
    return res.status(400).json({
        status: 'error',
        message: "Failed to authenticate using Google",
        data: {}
    });
}

const googleAuthController = {
    authenticate,
    callback,
    logout,
    failure
};

module.exports = googleAuthController;