const User = require('../models/user.model');
const jwt = require('jsonwebtoken');
const Token = require('../models/token.model');

module.exports.getUser = async (req,res) => {
    try {
        const { token } = req.body;
        const decodedJwtToken = jwt.decode(token);
        const user = await User.findOne({userId:decodedJwtToken.userId})
        if(!user){
            return res.status(400).json({message:"No user found", code_msg:"no_user_found"});
        }
        return res.status(201).json({message:"User found", code_msg:"user_found", user:{
            email:user.email,
            username:user.username,
            isAdmin:user.isAdmin,
            first_login:user.first_login,
            last_login:user.last_login,
            userId:user.userId,
        }})
    } catch (error) {
        res.status(500).send({ message: "Internal server error", code_msg: "server_error" });
    }
}