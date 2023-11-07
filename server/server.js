const app = require("./app");
const connectDatabase = require("./db/Database");

// const socketIo = require("socket.io");
// const cloudinary = require("cloudinary");

// Handling uncaught Exception
process.on("uncaughtException", (err) => {
  console.log(`Error: ${err.message}`);
  console.log(`shutting down the server for handling uncaught exception`);
});

// config
if (process.env.NODE_ENV !== "PRODUCTION") {
  require("dotenv").config({
    path: "config/.env",
  });
}

// connect db
connectDatabase();


app.get("/", (req, res) => {
  res.send("Chat Application Backend apis are running succesfully");
})

const PORT = process.env.PORT || 5000;
// create server
const server = app.listen(PORT, () => {
  console.log(
    `Server is running on http://localhost:${process.env.PORT}`
  );
});

const ioinstance = require("socket.io")(server, {
  pingTimeout: 60000,
  cors: {
    origin: "http://localhost:3000",
    // credentials: true,
  },
});

ioinstance.on("connection", (socket) => {
  console.log("A user connected to socket.io");

  // Creating connection and then creating the new room
  socket.on('setup', (userData) => {
    // Creating new room with the id of the user _id 
    socket.join(userData._id);
    socket.emit("connected");
  });

  // Joining the chat
  socket.on("Joining the chat", (room) => {
    socket.join(room);
    console.log("User Joined the room: " + room);
  });

  socket.on("typing", (room) => {
    socket.in(room).emit("typing")
  }
  );
  socket.on("stop typing", (room) => { socket.in(room).emit("stop typing") });

  socket.on("new message", (newMessageRecieved) => {
    let message = newMessageRecieved.chat;
    if (!message.users) return console.log("chat.users not defined");
    message.users.forEach((user) => {
      if (user._id == newMessageRecieved.sender._id) return;

      socket.in(user._id).emit("New message recieved", newMessageRecieved);
    });
  });

  socket.off("setup", () => {
    console.log("USER DISCONNECTED");
    socket.leave(userData._id);
  });
})

// unhandled promise rejection
process.on("unhandledRejection", (err) => {
  console.log(`Shutting down the server for ${err.message}`);
  console.log(`shutting down the server for unhandle promise rejection`);

  server.close(() => {
    process.exit(1);
  });
});