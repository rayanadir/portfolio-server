const mongoose = require('mongoose');

const tokenSchema = new mongoose.Schema({
    userId:{
        type: String,
        required: true,
        ref:"users",
        unique: true,
    },
    token: {
        type:String,
        required:true,
    },
    tokenType:{
        type:String,
        enum:["login","resetPassword"],
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 3600*24,
    }
})

const Token = mongoose.model("Token", tokenSchema);

module.exports = Token

