const mongoose = require('mongoose');

const simpleMessageSchema = new mongoose.Schema({
    message: { type: String, required: true },
    email: { type: String, required: true },
    username: { type: String, required: true },
    date: { type: Date, required: true },
    id: { type: String, required: true }
},{
    timestamps:true,
})

const Message = mongoose.model("message", simpleMessageSchema);

module.exports = Message;