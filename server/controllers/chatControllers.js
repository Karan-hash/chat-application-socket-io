const asyncHandler = require("express-async-handler");
const Chat = require("../models/chatModel");
const User = require("../models/userModel");

//@description     Create or fetch One to One Chat
//@route           POST /api/chat/
//@access          Protected

// This controller function is responsible for creating or accessing a new chat, First one is the login user and for the other user, we will provide an _id. 
// We also need to provide the bearer token of logged in user.

// ********* Output is ***** 
// {
//     "_id": "6540906e490eb10877375304",
//     "chatName": "sender",
//     "isGroupChat": false,
//     "users": [
//         {
//             "_id": "6540891f576c94ae0bb3dd33",
//             "name": "Karan Kaushal1",
//             "email": "karankaushal@gmail.com",
//             "pic": "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg",
//             "isAdmin": false,
//             "__v": 0
//         },
//         {
//             "_id": "653f9526cbcaa22184467be5",
//             "name": "Karan",
//             "email": "karan.1123@zenmonk.tech",
//             "pic": "http://res.cloudinary.com/dhsc1nsso/image/upload/v1698665701/tvvhvw72cuprsejzxqdz.png",
//             "isAdmin": false,
//             "__v": 0
//         }
//     ],
//     "createdAt": "2023-10-31T05:28:14.038Z",
//     "updatedAt": "2023-10-31T05:28:14.038Z",
//     "__v": 0
// }
const accessChat = asyncHandler(async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    console.log("UserId param not sent with request");
    return res.sendStatus(400);
  }

  let isChat = await Chat.find({
    isGroupChat: false,
    $and: [
      { users: { $elemMatch: { $eq: req.user._id } } },
      { users: { $elemMatch: { $eq: userId } } },
    ],
  })
    .populate("users", "-password")
    .populate("latestMessage");

  isChat = await User.populate(isChat, {
    path: "latestMessage.sender",
    select: "name pic email",
  });

  if (isChat.length > 0) {
    res.send(isChat[0]);
  } else {
    let chatData = {
      chatName: "sender",
      isGroupChat: false,
      users: [req.user._id, userId],
    };

    try {
      const createdChat = await Chat.create(chatData);
      const FullChat = await Chat.findOne({ _id: createdChat._id }).populate(
        "users",
        "-password"
      );
      res.status(200).json(FullChat);
    } catch (error) {
      res.status(400);
      throw new Error(error.message);
    }
  }
});

//@description     Fetch all chats for a particular user
//@route           GET /api/chat/
//@access          Protected
const fetchChats = asyncHandler(async (req, res) => {
  try {
    Chat.find({ users: { $elemMatch: { $eq: req.user._id } } })
      .populate("users", "-password")
      .populate("groupAdmin", "-password")
      .populate("latestMessage")
      .sort({ updatedAt: -1 })
      .then(async (results) => {
        results = await User.populate(results, {
          path: "latestMessage.sender",
          select: "name pic email",
        });
        res.status(200).send(results);
      });
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

//@description     Create New Group Chat
//@route           POST /api/chat/group
//@access          Protected

// Here Kindly pass the stringify version of the _ids in the users.

// {
//     "_id": "654094dae3f163700b74d058",
//     "chatName": "test group",
//     "isGroupChat": true,
//     "users": [
//         {
//             "_id": "653f9526cbcaa22184467be5",
//             "name": "Karan",
//             "email": "karan.1123@zenmonk.tech",
//             "pic": "http://res.cloudinary.com/dhsc1nsso/image/upload/v1698665701/tvvhvw72cuprsejzxqdz.png",
//             "isAdmin": false,
//             "__v": 0
//         },
//         {
//             "_id": "654094aae3f163700b74d055",
//             "name": "Varun Kaushal",
//             "email": "varunkaushal@gmail.com",
//             "pic": "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg",
//             "isAdmin": false,
//             "__v": 0
//         },
//         {
//             "_id": "6540891f576c94ae0bb3dd33",
//             "name": "Karan Kaushal1",
//             "email": "karankaushal@gmail.com",
//             "pic": "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg",
//             "isAdmin": false,
//             "__v": 0
//         }
//     ],
//     "groupAdmin": {
//         "_id": "6540891f576c94ae0bb3dd33",
//         "name": "Karan Kaushal1",
//         "email": "karankaushal@gmail.com",
//         "pic": "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg",
//         "isAdmin": false,
//         "__v": 0
//     },
//     "createdAt": "2023-10-31T05:47:06.324Z",
//     "updatedAt": "2023-10-31T05:47:06.324Z",
//     "__v": 0
// }
const createGroupChat = asyncHandler(async (req, res) => {
  if (!req.body.users || !req.body.name) {
    return res.status(400).send({ message: "Please Fill all the feilds" });
  }

  // We will pass it in the stringify format in the frontend and parse the stringify content into object at the backend.
  let users = JSON.parse(req.body.users);

  if (users.length < 2) {
    return res
      .status(400)
      .send("More than 2 users are required to form a group chat");
  }

  
  // Current user who is logged in will also be a part of group chat.
  users.push(req.user);

  try {
    const groupChat = await Chat.create({
      chatName: req.body.name,
      users: users,
      isGroupChat: true,
      groupAdmin: req.user,
    });

    const fullGroupChat = await Chat.findOne({ _id: groupChat._id })
      .populate("users", "-password")
      .populate("groupAdmin", "-password");

    res.status(200).json(fullGroupChat);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

// @desc    Rename Group
// @route   PUT /api/chat/rename
// @access  Protected
const renameGroup = asyncHandler(async (req, res) => {
  const { chatId, chatName } = req.body;

  const updatedChat = await Chat.findByIdAndUpdate(
    chatId,
    {
      chatName: chatName,
    },
    {
      new: true,
    }
  )
    .populate("users", "-password")
    .populate("groupAdmin", "-password");

  if (!updatedChat) {
    res.status(404);
    throw new Error("Chat Not Found");
  } else {
    res.json(updatedChat);
  }
});

// @desc    Remove user from Group
// @route   PUT /api/chat/groupremove
// @access  Protected
const removeFromGroup = asyncHandler(async (req, res) => {
  const { chatId, userId } = req.body;

  // check if the requester is admin

  const removed = await Chat.findByIdAndUpdate(
    chatId,
    {
      $pull: { users: userId },
    },
    {
      new: true,
    }
  )
    .populate("users", "-password")
    .populate("groupAdmin", "-password");

  if (!removed) {
    res.status(404);
    throw new Error("Chat Not Found");
  } else {
    res.json(removed);
  }
});

// @desc    Add user to Group / Leave
// @route   PUT /api/chat/groupadd
// @access  Protected
const addToGroup = asyncHandler(async (req, res) => {
  const { chatId, userId } = req.body;

  // check if the requester is admin

  const added = await Chat.findByIdAndUpdate(
    chatId,
    {
      $push: { users: userId },
    },
    {
      new: true,
    }
  )
    .populate("users", "-password")
    .populate("groupAdmin", "-password");

  if (!added) {
    res.status(404);
    throw new Error("Chat Not Found");
  } else {
    res.json(added);
  }
});

module.exports = {
  accessChat,
  fetchChats,
  createGroupChat,
  renameGroup,
  addToGroup,
  removeFromGroup,
};