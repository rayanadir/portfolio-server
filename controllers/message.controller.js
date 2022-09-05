const Message = require('../models/message.model');
const mongoose = require('mongoose')

module.exports.sendSimpleMessage = async (req,res) => {
    try{
        const { email, message, username } = req.body
        const emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        const emailTest = emailRegex.test(email);
        
        if(!email){
            return res.status(400).json({
                message:"Enter email",
                code_msg:"enter_email",
                status:'fail'
            })
        }
        if(!username){
            return res.status(400).json({
                message:"Enter username",
                code_msg:"enter_name",
                status:'fail'
            })
        }
        if(!message){
            return res.status(400).json({
                message:"Enter message",
                code_msg:"enter_message",
                status:'fail'
            })
        }

        if(username.length<3){
            return res.status(400).json({
                message:"Enter a valid name, at least 3 characters",
                code_msg:"invalid_name",
                status:'fail'
            })
        }

        if(!emailTest){
            return res.status(400).json({
                message:"Enter a valid email address",
                code_msg:"invalid_email",
                status:'fail'
            })
        }

        if(message.length<10){
            return res.status(400).json({
                message:"Enter a 10 minimum characters message",
                code_msg:"invalid_message",
                status:'fail'
            })
        }

        const id = new mongoose.Types.ObjectId().toHexString();
        const newMessage = new Message({
            email,
            username,
            message,
            date: new Date(),
            id,
        })

        await newMessage.save()

        return res.status(201).json({
            message:"Message sent",
            code_msg:"message_sent",
            status:'success',
        })

    }catch(err){
        return res.status(500).send({ message: "Internal server error", code_msg: "server_error", status:'fail' });
    }
}

module.exports.getAllSimpleMessages = async (req,res) => {
    try{
        const allMessages = await Message.find({}).sort({date: -1});
        if(!allMessages){
            return res.status(200).json({
                message:'No message yet',
                code_msg:'no_messages',
                messages:[]
            })
        }
        return res.status(201).json({
            message:'Messages existing',
            code_msg:"messages_existing",
            messages:allMessages
        })
    }catch(err){
        return res.status(500).send({ message: "Internal server error", code_msg: "server_error" });
    }
}

module.exports.getSimpleMessage = async (req,res) => {
    try{
        const {id} = req.body;
        const message = await Message.findOne({id});
        if(!message){
            return res.status(400).json({
                message:"No message found",
                code_msg:"no_message_found",
                messageData:{}
            });
        }
        return res.status(201).json({
            message:"Message found",
            code_msg:"message_found",
            messageData:message,
        })
    }catch(err){
        return res.status(500).send({ message: "Internal server error", code_msg: "server_error" });
    }
}

module.exports.checkIsValidMessage = async (req,res) => {
    try{
        const { id } = req.body;
        const message = await Message.findOne({id});
        if(!message){
            return res.status(400).json({
                message:"No message found",
                code_msg:"no_message_found",
                message:{},
            })
        }else if (message){
            return res.status(201).json({
                message:"Message found",
                code_msg:"message_found",
                message,
            }) 
        }
    }catch(err){
        return res.status(500).send({ message: "Internal server error", code_msg: "server_error" });
    }
}