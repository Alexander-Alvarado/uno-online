var express = require("express");
var socket = require("socket.io");

var app = express();
var PORT = process.env.PORT || 5500;
var server = app.listen(PORT, function() {
  console.log("listening on port", PORT);
});

app.use(express.static(__dirname + "/public/"));

var io = socket(server);

var activeClients = 0;

io.on("connection", function(socket) {
  activeClients++;
  console.log(socket.id, "connected, active conncections:", activeClients);
  io.sockets.emit("clientCount", activeClients);
  socket.on("chat", function(data) {
    io.sockets.emit("chat", data);
  });

  socket.on("typing", function(data) {
    socket.broadcast.emit("typing", data);
  });

  socket.on("disconnect", function() {
    activeClients--;
    console.log(socket.id, "disconnected, active conncections:", activeClients);
    io.sockets.emit("clientCount", activeClients);
  });
});
