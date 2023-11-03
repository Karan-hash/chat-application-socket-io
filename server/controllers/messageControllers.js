const Message = require("./../models/messageModel");
const User = require("./../models/userModel");
const Chat = require("./../models/chatModel");
const asyncHandler = require("express-async-handler");

//@description     sending and creating New Message
//@route           POST /api/Message/
//@access          Protected

const sendMessage = asyncHandler(async (req, res) => {
    const { content, chatId } = req.body;

    if (!content || !chatId) {
        const errorMessage = "Bad Request: Please provide 'content' and 'chatId' parameters in the request body.";
        console.error(errorMessage);
        return res.status(400).send(errorMessage);
    }

    let newMessage = {
        sender: req.user._id,
        content: content,
        chat: chatId
    }
    try{
        let message = await Message.create(newMessage);
        message = await message.populate("sender", "name pic")
        message = await message.populate("chat")
        message = await User.populate(message, {
            path: 'chat.users',
            select: 'name pic email',
        });
        await Chat.findByIdAndUpdate(req.body.chatId, { latestMessage: message });

        res.status(201).json(message);
    }
    catch(error) {
        res.status(400);
        throw new Error(error.message);
    }

});

//@description     Getting all Messages
//@route           GET /api/Message/:chatId
//@access          Protected
const allMessages = asyncHandler(async (req, res) => {
    try {
      const messages = await Message.find({ chat: req.params.chatId })
        .populate("sender", "name pic email")
        .populate("chat");
      res.status(200).json(messages);
    } catch (error) {
      res.status(400);
      throw new Error(error.message);
    }
  });

module.exports = { sendMessage, allMessages };

