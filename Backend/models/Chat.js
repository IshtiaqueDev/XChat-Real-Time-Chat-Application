const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema({
    from: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    to: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    message: {
        type: String,
        required: true,
        trim: true
    },
    atTime: {
        type: Date,
        default: Date.now
    },
    readAt: {
        type: Date,
        default: null
    }
});

const Chat = mongoose.model("Chat", chatSchema);

module.exports = Chat;