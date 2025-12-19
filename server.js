const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();
const authRoutes = require("./routes/auth.js");
const bookRoutes = require("./routes/book");
const categoryRoutes = require("./routes/category");
const bookmarkRoutes = require("./routes/bookmark");
const favoriteRoutes = require("./routes/favorite");
const commentRoutes = require("./routes/comment");
const reportRoutes = require("./routes/report");
const chatRoutes = require("./routes/chat");
const cors = require("cors");
const path = require("path");

const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

app.set("io", io);

app.use((req, res, next) => {
  req.io = io;
  next();
});

io.on("connection", (socket) => {
  console.log("client connected", socket.id);

  socket.on("send-message", (data) => {
    io.emit("receive-message", data);
  });

  // phòng chat riêng cho comment theo từng sách
  socket.on("join-book", (book) => {
    socket.join(book);
    console.log(`📚 Client ${socket.id} đã vào phòng sách ${book}`);
  });

  // kênh chat chung (di chuyển vào đây)
  socket.on("sendMessage", (msg) => {
    io.emit("newMessage", {
      socketId: socket.id,
      ...msg,
    });
  });

  socket.on("disconnect", () => {
    console.log("client disconnected", socket.id);
  });
});


app.use(cors());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/auth", authRoutes);
app.use("/book", bookRoutes);
app.use("/category", categoryRoutes);
app.use("/bookmark", bookmarkRoutes);
app.use("/favorite", favoriteRoutes);
app.use("/comment", commentRoutes);
app.use("/report", reportRoutes);
app.use("/chat", chatRoutes);

const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    server.listen(PORT, "0.0.0.0", () =>
      console.log(`Server running on port ${PORT}`)
    );
  })
  .catch((err) => console.error(err));
