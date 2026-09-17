import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { User , Session } from "../sequelize/config/database.js";
import { logger } from "../utils/logger.js";
import sequelize from "../sequelize/config/database.js";

const JWT_SECRET = process.env.JWT_SECRET;
const REFRESH_SECRET = process.env.REFRESH_SECRET;
const RESET_SECRET = process.env.RESET_SECRET;
const ACCESS_TOKEN_EXPIRY = process.env.ACCESS_TOKEN_EXPIRY;
const REFRESH_TOKEN_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY;
const RESET_TOKEN_EXPIRY = process.env.RESET_TOKEN_EXPIRY;

function generateAccessToken(user) {
    return jwt.sign(
        {
            id: user.id,
            email: user.email,
            role: user.role,
        },
        JWT_SECRET,
        {
            expiresIn: ACCESS_TOKEN_EXPIRY
        }
    );
}

function generateRefreshToken(user) {
    return jwt.sign(
        {
            id: user.id,
            email: user.email
        },
        REFRESH_SECRET,
        {
            expiresIn: REFRESH_TOKEN_EXPIRY
        }
    );
}


async function signin(req,res) {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required"
            });
        }

        const user = await User.findOne({
            where:{email:email}
        })

        if (!user) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        } 

        const passwordMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!passwordMatch) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }
        const user1 = {
            id:user.id,
            email:user.email,
            role:user.role
        };

        const accessToken = generateAccessToken(user1);
        const refreshToken = generateRefreshToken(user1);

        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 1);
        
        await Session.create({
            userId:user.id,
            token:refreshToken,
            deletedAt:expiresAt
        })

        logger.info(`User ${user.id} signed in`);

        res.json({
            message: "Sign in successful 1",
            accessToken,
            refreshToken
        });

    } catch (error) {
        logger.error(error.stack || error.message);

        res.status(500).json({
            message: "Internal server error"
        });
    }
}


async function signup(req,res){
    try {
        const { name, email, password } = req.body;
        
        if (!name || !email || !password) {
            return res.status(400).json({
                message: "Name, email and password are required"
            });
        }
        
        const hashedPassword = await bcrypt.hash(password, 10);

        const {user,accessToken,refreshToken} = await sequelize.transaction(async(t)=>{
            const user = await User.create({ username:name, email : email, password : hashedPassword },{transaction:t});
            
    
            const newUser = {
                id: user.id,
                email,
                role: user.role,
            };
     
            const accessToken = generateAccessToken(newUser);
            const refreshToken = generateRefreshToken(newUser);
            const expiresAt = new Date();
            expiresAt.setHours(expiresAt.getHours() + 1);
    
            await Session.create({userId:user.id,token:refreshToken,deletedAt:expiresAt },{transaction:t})
            return {user,accessToken, refreshToken};
        })
        const { password:_password, ...safeUser } = user.toJSON();
        

        logger.info(`User ${user.id} signed up`);   

        res.status(201).json({
            safeUser,
            message: "User registered successfully",
            accessToken,
            refreshToken
        });

    } catch (error) {
        logger.error(error.stack || error.message);

        if(error.code=="23505"){
            return res.status(409).json({
                message:"username already exist"
            });
        }

        res.status(500).json({
            message: "Internal server error",
        });
    }
}
 


async function refreshToken(req,res) {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({
                message: "Refresh token is required"
            });
        }

        const decoded = jwt.verify(refreshToken, REFRESH_SECRET);

        const result = await User.findOne({
            where:{ email:decoded.email }
        })
        if (!result) {
            return res.status(401).json({
                message: "Invalid refresh token"
            });
        }

        const result1 = await Session.findOne({
            where:{userId : result.id , token:refreshToken}
        })
        
        if (!result1) {
            return res.status(401).json({
                message: "token expired login again"
            });
        }

        const accessToken = generateAccessToken({id:result.id,email:result.email,role:result.role});

        res.json({
            accessToken
        });

    } catch (error) {
        return res.status(403).json({
            message: "Invalid or expired refresh token"
        });
    }
}


async function logout(req,res) {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({
                message: "Refresh token is required"
            });
        }
        const decoded = jwt.verify(refreshToken, REFRESH_SECRET);
        const result = await User.findOne({
            where:{ email:decoded.email }
        })
        if (!result) {
            return res.status(401).json({
                message: "Invalid refresh token"
            });
        }
        const result1 = await Session.findOne({
            where:{userId : result.id , token:refreshToken}
        })
        if (!result1) {
            return res.status(401).json({
                message: "token expired login again"
            });
        }
        await result1.destroy();
        
        res.json({
            message: "Logged out successfully"
        });

    } catch (error) {
        logger.error(error.stack || error.message);

        res.status(500).json({
            message: "Internal server error"
        });
    }
}


async function logoutAll(req,res) {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({
                message: "Refresh token is required"
            });
        }

        const decoded = jwt.verify(refreshToken, REFRESH_SECRET);

        const result = await User.findOne({
            where:{ email:decoded.email }
        })

        if (!result) {
            return res.status(401).json({
                message: "Invalid refresh token"
            });
        }

        await Session.destroy({
            where:{userId : result.id}
        });

        logger.info(`User ${result.id} logged out from all devices`);

        res.json({
            message: "Logged out from all devices"
        });

    } catch (error) {
        return res.status(403).json({
            message: "Invalid or expired refresh token"
        });
    }
}


async function forgotPassword(req,res) {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                message: "Email is required"
            });
        }

        const user = await User.findOne({
            where:{ email:email }
        })

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const resetToken = jwt.sign(
            {
                id:user.id,
                email:email
            },
            RESET_SECRET,
            {
                expiresIn: RESET_TOKEN_EXPIRY
            }
        );

        await Session.create({
            userId : user.id,
            token:resetToken,
        })


        logger.info(`User ${user.id} requested a password reset`);

        res.json({
            message: "Reset token generated. In a real app this would be emailed instead of returned here",
            resetToken
        });

    } catch (error) {
        logger.error(error.stack || error.message);

        res.status(500).json({
            message: "Internal server error"
        });
    }
}


async function resetPassword(req,res) {
    try {
        const { resetToken, newPassword } = req.body;

        if (!resetToken || !newPassword) {
            return res.status(400).json({
                message: "Reset token and new password are required"
            });
        }

        const decoded = jwt.verify(resetToken, RESET_SECRET);

        const user = await User.findOne({
            where:{ email:decoded.email }
        })

        if (!user) {
            return res.status(403).json({
                message: "Invalid or expired reset token"
            });
        }

        const reset = await Session.findOne({
            where:{token:resetToken}
        })

        if (!reset) {
            return res.status(403).json({
                message: "Invalid or expired reset token"
            });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await sequelize.transaction(async (t) => {
            user.password = hashedPassword;
            await user.save({ transaction: t });

            await Session.destroy({
                where: { userId: user.id },
                transaction: t
            });
        });

        logger.info(`User ${user.id} reset their password`);

        res.json({
            message: "Password reset successful. Please sign in again"
        });

    } catch (error) {
        return res.status(403).json({
            message: "Invalid or expired reset token"
        });
    }
}
async function deleteAccount(req,res){
    try{
        const{password }=req.body;
        if(!password){
            return res.status(400).json({
                message:"Password is required"
            })
        }
        const user = await User.findOne({
            where:{id:req.user.id}
        });
        if(!user){
            return res.status(404).json({
                message:"User not found"
            });
        }

        const passwordMatch = await bcrypt.compare(password,user.password);
        if(!passwordMatch){
            return res.status(401).json({
                message:"Incorrect password"
            })
        }

        await sequelize.transaction(async(t)=>{{
            await user.destroy({transaction:t});
        }})

        logger.info(`User ${user.id} deleted their account`);

        res.json({
            message: "Account deleted successfully"
        });
    } catch (error) {
        logger.error(error.stack || error.message);

        res.status(500).json({
            message: "Internal server error"
        });
    }
}

export default {
    signin,
    signup,
    refreshToken,
    logout,
    logoutAll,
    forgotPassword,
    resetPassword,
    deleteAccount
}