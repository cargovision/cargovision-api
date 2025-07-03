const signToken = require('../../../utils/auth/jwt/sign');

const sign = async (req, res) => {
    try {
        if (req.user) {
            const userTokenSign = {
                email: req.user.email,
                auth: "google"
            }
            const token = signToken(userTokenSign);
            res.redirect(process.env.FE_HOST + '/oauth-callback?token=' + token);
        } else {
            return res.status(401).json({
                status: "error", 
                message: "Unauthorized: Authentication required",
                data: {}
            });
        }
    } catch (err) {
        console.error(err);
        return res.status(400).json({
            status: 'error',
            message: process.env.DEBUG ? err.message : "Bad Request",
            data: {}
        });
    }
}

const refresh = async (req, res) => {
    return res.status(200).json({
        status: 'success',
        message: "Token Refresh Success",
        data: {
            email: req.user.email,
            token: signToken({
                email: req.user.email,
                auth: req.user.auth
            })
        }
    });
};

module.exports = {
    sign,
    refresh
};