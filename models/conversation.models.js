import mongoose from "mongoose";

const participantSchema = new mongoose.Schema({

    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }],
    messages: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message',
    }],
}, { timestamps: true });


const Conversation = mongoose.model('Conversation', participantSchema);
export default Conversation;