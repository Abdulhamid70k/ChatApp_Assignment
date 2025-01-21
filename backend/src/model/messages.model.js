//src/model/messages.model.js

import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        allowNull: true
    },
    sentToGroup: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group'
    },
    message: {
        type: String,
        required: true
    }
}, { timestamps: true });

export default mongoose.model('Message', messageSchema);
