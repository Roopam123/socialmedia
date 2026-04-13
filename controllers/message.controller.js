import Conversation from "../models/conversation.models.js";
import Message from "../models/message.model.js";

const sendMessage = async (req, res) => {
    try {
        const senderId = req.user.id;
        const receiverId = req.body.id;
        const message = req.body.message;

        let conversation = await Conversation.findOne({
            particepants: { $all: [senderId, receiverId] },
        });

        // Start a new conversation if one doesn't exist
        if (!conversation) {
            conversation = await Conversation.create({
                particepants: [senderId, receiverId],
            })
        }
        const newMessage = await Message.create({
            text: message,
            senderId,
            receiver: receiverId,
        });
        if (newMessage) conversation.messages.push(newMessage._id);
        await Promise.all([conversation.save(), newMessage.save()]);

        // Implement socket.io logic to emit the new message to the receiver here

        return res.status(200).json({
            message: "Message sent successfully.",
            success: true,
            data: newMessage
        });
    } catch (error) {
        console.log("Error in sendMessage controller:", error);
        res.status(500).json({ error: "An error occurred while sending the message." });
    }
}


const getMessages = async (req, res) => {
    try {
        const senderId = req.user.id;
        const receiverId = req.params.id;

        const conversation = await Conversation.findOne({
            particepants: { $all: [senderId, receiverId] },
        });
        if (!conversation) {
            return res.status(200).json({
                error: "No conversation found between the users.",
                success: true,
            });
        }

        return res.status(200).json({
            message: "Messages fetched successfully.",
            success: true,
            data: conversation?.messages
        });
    } catch (error) {
        console.log("Error in getMessages controller:", error);
        res.status(500).json({ error: "An error occurred while fetching the messages." });
    }
}




export { sendMessage, getMessages };