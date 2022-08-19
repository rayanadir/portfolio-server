const Conversation = require('../models/conversation.model');
const User = require('../models/user.model');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

module.exports.getAdmin = async (req, res) => {
    try {
        const adminUser = await User.findOne({ email: String(process.env.USER) });
        if (!adminUser) {
            return res.status(400).json({
                message: "No admin found",
                code_msg: "no_admin"
            })
        }
        return res.status(201).json({
            message: "Admin found",
            code_msg: "Admin found",
            admin_username: adminUser.username
        })
    } catch (err) {
        return res.status(500).send({ message: "Internal server error", code_msg: "server_error" });
    }
}

module.exports.newConversation = async (req, res) => {
    try {
        const id = new mongoose.Types.ObjectId().toHexString()
            return res.status(201).json({
                message:"ID generated",
                code_msg:"id_generated",
                id
            });
    } catch (err) {
        console.error(err);
        return res.status(500).send({ message: "Internal server error", code_msg: "server_error" });
    }
}

module.exports.sendMessage = async (req, res) => {
    try {
        const { userId, message, id } = req.body;
        if (id !== undefined) {
            const conversation = await Conversation.findOne({ id });
            if (!conversation) {
                return res.status(400).json({
                    message: "No conversation found",
                    code_msg: "no_conversation"
                })
            }
            const messageId = new mongoose.Types.ObjectId().toHexString()
            const messageObj = { message, userId, date: new Date().toISOString(), id: messageId }
            await conversation.updateOne({
                $push: { messages: messageObj },
            });
            return res.status(201).json({ message: "Message sent", code_msg: "message_sent", messageData:messageObj })
        }else if(id===undefined){
            const adminUser = await User.findOne({ email: String(process.env.USER) });
            if (!adminUser) {
                return res.status(400).json({
                    message: "No admin found",
                    code_msg: "no_admin"
                })
            }
            const newConversationId = new mongoose.Types.ObjectId().toHexString();
            const messageId=new mongoose.Types.ObjectId().toHexString();
            const newMessage =[{message, userId, date: new Date().toISOString(), id: messageId}]
            const conversation = new Conversation({
                id: newConversationId,
                users:[userId,adminUser.userId],
                messages: newMessage
            });
            await conversation.save();
            return res.status(201).json({ message: "First message sent", code_msg: "first_message_sent", id: newConversationId, messageData: newMessage })
        }

    } catch (error) {
        return res.status(500).send({ message: "Internal server error", code_msg: "server_error" });
    }
}

module.exports.getSingleConversation = async (req, res) => {
    try {
        const { id, userId } = req.params;
        const conversation = await Conversation.findOne({ id });
        if (!conversation) {
            return res.status(400).json({
                message: "No conversation found",
                code_msg: "no_conversation"
            })
        }
        const token = jwt.sign(
            {
                userId,
            },
            process.env.TOKEN_SECRET,
            { expiresIn: '24h' },
        );

        return res
            .cookie("token", token, {
                httpOnly: true,
                secure: true,
                sameSite: "none",
            })
            .status(201).json({ message: "Conversation found", code_msg: "conversation_found", conversation });
    } catch (err) {
        return res.status(500).send({ message: "Internal server error", code_msg: "server_error" });
    }
}

module.exports.getAllConversations = async (req, res) => {
    try {
        const { userId } = req.body
        Conversation.find({}).sort({ updatedAt: -1 }).lean().exec((err, doc) => {
            if (err) {
                return res.status(400).json({
                    message: "No conversations found",
                    code_msg: "no_conversations"
                })
            } else if (doc) {
                const test = doc.map(async (conversation) => {
                    const users_arr = await User.find({userId: conversation.users})
                    conversation.users_arr= users_arr;
                    return conversation;
                })
                Promise.all(test).then((conversations) => {
                    const token = jwt.sign(
                        {
                            userId,
                        },
                        process.env.TOKEN_SECRET,
                        { expiresIn: '24h' },
                    );
                    return res
                        .cookie("token", token, {
                            httpOnly: true,
                            secure: true,
                            sameSite: "none",
                        })
                        .status(201).json({ message: "Query all conversations", code_msg: "query_all_conversations", conversations });
                })
            }
        });
    }
    catch (err) {
        return res.status(500).send({ message: "Internal server error", code_msg: "server_error" });
    }
}

module.exports.hasConversation = async (req, res) => {
    try {
        const { userId } = req.body;
        Conversation.findOne({ users: userId }).lean().exec(async (err, doc) => {
            if (!doc) {
                return res.status(200)
                    .json({ message: "No conversation started", code_msg: "no_conversation_started" });
            }
            if (doc) {
                const otherUser = doc.users.find(u => u !== userId);
                const user = await User.findOne({ userId: otherUser });
                doc.username = user.username
                return res.status(201)
                    .json({ message: "Conversation already started", code_msg: "conversation_already_started", conversation: doc });
            }
            if(err){
                return res.status(400).send({ message: "Error", code_msg: "error" })
            }
        })

    } catch (err) {
        return res.status(500).send({ message: "Internal server error", code_msg: "server_error" });
    }
}

module.exports.checkIsValidConversation = async (req,res) => {
    try{
        const { id } = req.body;
        if(id===undefined){
            return res.status(200).json({
                message:"New conversation",
                code_msg:"new_conversation",
            })
        }else if(id && id!==undefined && id!==null){
            const conversation = await Conversation.findOne({id});
            if(!conversation){
                return res.status(400).json({
                    message:"No conversation found",
                    code_msg:"no_conversation_found"
                })
            }else if(conversation){
                return res.status(201).json({
                    message:"Conversation found",
                    code_msg:"conversation_found"
                })
            }
        }
    }catch(err){
        return res.status(500).send({ message: "Internal server error", code_msg: "server_error" });
    }
}