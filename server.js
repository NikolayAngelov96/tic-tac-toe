const http = require("http");
const express = require("express");
const socketIO = require("socket.io");

const app = express();
app.use("/", express.static("static"));

const server = http.createServer(app);

const io = socketIO(server);

const rooms = {};

io.on("connect", (socket) => {
  console.log("Player connected");

  socket.on("selectRoom", ({ roomId, nickname }) => {
    if (rooms[roomId] == undefined) {
      rooms[roomId] = new Map();
    }
    const players = rooms[roomId];

    socket.on("message", (message) => {
      io.to(roomId).emit("message", { message, nickname });
    });

    if (players.size >= 2) {
      socket.emit("error", "Room is full");
      return socket.disconnect();
    } else {
      socket.join(roomId);
      initGame(roomId, players, socket);
    }
  });
});

function initGame(roomId, players, socket) {
  socket.on("position", (pos) => {
    io.to(roomId).emit("position", pos);
  });

  socket.on("newGame", () => {
    console.log("new game started");
    io.to(roomId).emit("newGame");
  });

  socket.on("disconnect", () => {
    console.log("Player left");
    players.delete(socket);
  });

  let symbol = "X";
  if (players.size > 0) {
    const otherSymbol = [...players.values()][0];
    if (otherSymbol == "X") {
      symbol = "O";
    }
  }
  players.set(socket, symbol);
  socket.emit("symbol", symbol);
}

server.listen(3000, () => {
  console.log("Server is listening on Port: 3000");
});
