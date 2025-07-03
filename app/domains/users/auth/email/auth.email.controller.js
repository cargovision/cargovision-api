const User = require('../..//user.model').User;
const Service = require('../../../services/services.model').Service;

const bcrypt = require('bcrypt');
const signToken = require('../../../../utils/auth/jwt/sign');
const verifyJWT = require('../../../../utils/auth/jwt/verify');

const mailsender = require('../../../../utils/mail/sender');
const mailrenderer = require('../../../../utils/mail/renderer');

const emailVerificationInterval = 5 * 60;

const verify = async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({
                status: 'error',
                message: 'Parameter "email" required',
                data: {}
            });
        }

        const getUser = await User.findOne({ email: email });
    
        if (getUser) {
            if (getUser.isEmailVerified) {
                // return res.status(400).json({
                //     status: 'error',
                //     message: process.env.DEBUG ? "Email already verified" : "Bad Request",
                //     data: {}
                // });
                if (getUser.isRegistered) {
                    return res.status(400).json({
                        status: 'error',
                        message: process.env.DEBUG ? "Email already registered" : "Bad Request",
                        data: {}
                    });
                } else {
                    const currentTime = Math.floor(new Date().getTime() / 1000);
                    const timeDiff = currentTime - getUser.lastEmailVerification;
                    if (timeDiff <= emailVerificationInterval) {
                        return res.status(400).json({
                            status: 'error',
                            message: process.env.DEBUG ? `Email verification already sent. Please wait another ${Math.floor((emailVerificationInterval - timeDiff) / 60)} minutes${(emailVerificationInterval - timeDiff) % 60 > 0 ? " and " + ((emailVerificationInterval - timeDiff) % 60).toString() + " seconds" : ""}.` : "Bad Request",
                            data: {}
                        });
                    } else {
                        getUser.isEmailVerified = false;
                        getUser.lastEmailVerification = currentTime;
                        getUser.save();
                    }
                }
            } else {
                const currentTime = Math.floor(new Date().getTime() / 1000);
                const timeDiff = currentTime - getUser.lastEmailVerification;
                if (timeDiff <= emailVerificationInterval) {
                    return res.status(400).json({
                        status: 'error',
                        message: process.env.DEBUG ? `Email verification already sent. Please wait another ${Math.floor((emailVerificationInterval - timeDiff) / 60)} minutes${(emailVerificationInterval - timeDiff) % 60 > 0 ? " and " + ((emailVerificationInterval - timeDiff) % 60).toString() + " seconds" : ""}.` : "Bad Request",
                        data: {}
                    });
                } else {
                    getUser.lastEmailVerification = currentTime;
                    getUser.save();
                }
            }
        } else {
            const newUser = new User({
                email: email,
                auth: "email",
                lastEmailVerification: Math.floor(new Date().getTime() / 1000)
            });
            await newUser.save();
        }

        const verificationToken = signToken({
            email: email,
            isEmailVerification: true
        });

        const verificationCheckToken = signToken({
            email: email,
            isVerified: false
        });

        const html = await mailrenderer('activation', { 
            activation_url: `${req.get('host') == "localhost:" + (process.env.PORT || "8080") ? "http" : "https"}://${req.get('host')}/user/auth/email/activate?token=${encodeURIComponent(verificationToken)}`
        });
        
        await mailsender.sendmail({
            fromaddres: 'CargoVision <noreply@cargovision.app>',
            receipients: email,
            subject: 'Sign in to CargoVision',
            message: html,
            html: true
        });
        return res.status(200).json({
            status: 'success',
            message: 'Email sent. Please check yout inbox',
            data: {
                verificationCheck: `${req.get('host') == "localhost:" + (process.env.PORT || "8080") ? "http" : "https"}://${req.get('host')}/user/auth/email/activation?token=${encodeURIComponent(verificationCheckToken)}`
            }
        });
    } catch(err) {
        console.error(err);
        return res.status(400).json({
            status: 'error',
            message: process.env.DEBUG ? err.message : "Bad Request",
            data: {}
        });
    }
};

const activate = async (req, res) => {
    try {
        const token = req.query.token;
        const verification = verifyJWT(token);
        if (verification.status == "error") {
            const html = await mailrenderer('expired', {});
            res.send(html);
        } else {
            if (verification.data.isEmailVerification) {
                const getUser = await User.findOne({ email: verification.data.email });
                if (getUser) {
                    if (!getUser.isEmailVerified) {
                        getUser.isEmailVerified = true;
                        await getUser.save();
                        const html = await mailrenderer('verified', {});
                        res.send(html);
                    } else {
                        const html = await mailrenderer('already_verified', {});
                        res.send(html);
                    }
                } else {
                    const html = await mailrenderer('invalid', {});
                    res.send(html);
                }
            } else {
                const html = await mailrenderer('invalid', {});
                res.send(html);
            }
        }
    } catch (err) {
        console.error(err);
        res.send(process.env.DEBUG ? err.message : "Bad Request");
    }
};

const activation = async (req, res) => {
    try {
        const token = req.query.token;
        const verification = verifyJWT(token);
        if (verification.status == "error") {
            return res.status(401).json({
                status: "error", 
                message: "Verification Link Expired. Please request email verification again.",
                data: {
                    email: "",
                    isVerified: false
                }
            });
        } else {
            if (!verification.data.isVerified) {
                const getUser = await User.findOne({ email: verification.data.email });
                if (getUser) {
                    if (!getUser.isEmailVerified) {
                        return res.status(200).json({
                            status: "success", 
                            message: "User still not verified",
                            data: {
                                email: getUser.email,
                                isVerified: false
                            }
                        });
                    } else {
                        return res.status(200).json({
                            status: "success", 
                            message: "User is verified",
                            data: {
                                email: getUser.email,
                                isVerified: true
                            }
                        });
                    }
                } else {
                    return res.status(401).json({
                        status: "error", 
                        message: "Error: User not found",
                        data: {
                            email: verification.data.email,
                            isVerified: false
                        }
                    });
                }
            } else {
                return res.status(400).json({
                    status: 'error',
                    message: "Invalid Authentication",
                    data: {
                        email: verification.data.email,
                        isVerified: false
                    }
                });
            }
        }
    } catch (err) {
        console.error(err);
        return res.status(400).json({
            status: 'error',
            message: process.env.DEBUG ? err.message : "Bad Request",
            data: {
                email: "",
                isVerified: false
            }
        });
    }
};

const register = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({
                status: 'error',
                message: 'Parameter "email" and "password" required',
                data: {}
            });
        }

        const getUser = await User.findOne({ email: email });
    
        if (!getUser || !getUser.isEmailVerified) {
            return res.status(400).json({
                status: 'error',
                message: "Email is not yet verified",
                data: {}
            });
        }

        if (getUser.isRegistered) {
            return res.status(400).json({
                status: 'error',
                message: "User is registered",
                data: {}
            });
        }

        getUser.password = await bcrypt.hash(password, 10);
        getUser.isRegistered = true;
        getUser.save();

        const newService = new Service({
            email: email
        });
        await newService.save();

        const userTokenSign = {
            email: email,
            auth: "email",
        }
        
        return res.status(200).json({
            status: 'success',
            message: "Email registration successful",
            data: {
                email: email,
                token: signToken(userTokenSign)
            }
        });
    } catch(err) {
        console.error(err);
        return res.status(400).json({
            status: 'error',
            message: process.env.DEBUG ? err.message : "Bad Request",
            data: {}
        });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                status: 'error',
                message: 'Parameter "email" and "password" required',
                data: {}
            });
        }

        const getUser = await User.findOne({ email: email });
    
        if (!getUser) {
            return res.status(400).json({
                status: 'error',
                message: process.env.DEBUG ? "Email not Found" : "Invalid Credentials",
                data: {}
            });
        }

        if (!getUser.isEmailVerified) {
            return res.status(400).json({
                status: 'error',
                message: "Email is not yet verified",
                data: {}
            });
        }

        if (!getUser.isRegistered) {
            return res.status(400).json({
                status: 'error',
                message: "User is verified, but not registered",
                data: {}
            });
        }

        if (bcrypt.compareSync(password, getUser.password)) {
            const userTokenSign = {
                email: email,
                auth: "email",
            }
            return res.status(200).json({
                status: 'success',
                message: "Login Success",
                data: {
                    email: email,
                    token: signToken(userTokenSign)
                }
            });
        } else {
            return res.status(400).json({
                status: 'error',
                message: process.env.DEBUG ? "Wrong Password" : "Invalid Credentials",
                data: {}
            });
        }
    } catch(err) {
        console.error(err);
        return res.status(400).json({
            status: 'error',
            message: process.env.DEBUG ? err.message : "Bad Request",
            data: {}
        });
    }
};

const forgot = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                status: 'error',
                message: 'Parameter "email" required',
                data: {}
            });
        }

        const getUser = await User.findOne({ email: email });
    
        if (!getUser) {
            return res.status(400).json({
                status: 'error',
                message: process.env.DEBUG ? "Email not Found" : "Invalid Credentials",
                data: {}
            });
        }

        if (!getUser.isEmailVerified) {
            return res.status(400).json({
                status: 'error',
                message: process.env.DEBUG ? "Email is not yet verified" : "Invalid Credentials",
                data: {}
            });
        }

        if (!getUser.isRegistered) {
            return res.status(400).json({
                status: 'error',
                message: process.env.DEBUG ? "User is not yet registered" : "Invalid Credentials",
                data: {}
            });
        }

        const verificationToken = signToken({
            email: email,
            isForgotPassword: true
        });

        
        const html = await mailrenderer('reset', {
            reset_url: `${process.env.FE_HOST}/changepassword?token=${encodeURIComponent(verificationToken)}`
        });

        await mailsender.sendmail({
            fromaddres: 'CargoVision <noreply@cargovision.app>',
            receipients: email,
            subject: 'Password Reset for CargoVision',
            message: html,
            html: true
        });
        
        return res.status(200).json({
            status: 'success',
            message: 'Email sent. Please check yout inbox',
            data: {}
        });
    } catch(err) {
        console.error(err);
        return res.status(400).json({
            status: 'error',
            message: process.env.DEBUG ? err.message : "Bad Request",
            data: {}
        });
    } 
};

const change = async (req, res) => {
    try {
        const { password, token } = req.body;

        if (!password || !token) {
            return res.status(400).json({
                status: 'error',
                message: 'Parameter "password" and "token" required',
                data: {}
            });
        }

        const verification = verifyJWT(token);
        if (verification.status == "error") {
            return res.status(401).json({
                status: "error", 
                message: "Password Change Token Expired. Please request password reset again.",
                data: {}
            });
        } else {
            if (verification.data.isForgotPassword) {
                const getUser = await User.findOne({ email: verification.data.email });
                if (getUser) {
                    if (!getUser.isRegistered) {
                        return res.status(400).json({
                            status: "error", 
                            message: "User is not registered",
                            data: {}
                        });
                    } else {
                        getUser.password = await bcrypt.hash(password, 10);
                        getUser.save();
                        return res.status(200).json({
                            status: "success", 
                            message: "User password changed",
                            data: {}
                        });
                    }
                } else {
                    return res.status(401).json({
                        status: "error", 
                        message: "Error: User not found",
                        data: {}
                    });
                }
            } else {
                return res.status(400).json({
                    status: 'error',
                    message: "Invalid Authentication",
                    data: {
                        email: verification.data.email,
                        isVerified: false
                    }
                });
            }
        }
    } catch(err) {
        console.error(err);
        return res.status(400).json({
            status: 'error',
            message: process.env.DEBUG ? err.message : "Bad Request",
            data: {}
        });
    }
};

const emailAuthController = {
    verify,
    activate,
    activation,
    register,
    login,
    forgot,
    change
};

module.exports = emailAuthController;