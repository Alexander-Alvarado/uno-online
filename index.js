var express = require("express");
var socket = require("socket.io");

var app = express();
var PORT = process.env.PORT || 5000;

var server = app.listen(PORT, function() {
  console.log("listening on port", PORT);
});

app.use(express.static(__dirname + "/public/"));

var io = socket(server);

var activeRooms = [];
var players = [];

io.on("connection", function(socket) {
  socket.on("newGame", function(data) {
    var roomKey;

    do {
      roomKey = Math.random()
        .toString(36)
        .substr(2, 5);
    } while (activeRooms.includes(roomKey) === true);

    newPlayer(data, roomKey);
    var player = findPlayerIndex();

    activeRooms.push({
      room: roomKey,
      status: "open",
      players: [players[player]],
      deck: [
        { cards: 108 },
        {
          red: [
            { 0: 1 },
            { 1: 2 },
            { 2: 2 },
            { 3: 2 },
            { 4: 2 },
            { 5: 2 },
            { 6: 2 },
            { 7: 2 },
            { 8: 2 },
            { 9: 2 },
            { r: 2 },
            { d: 2 },
            { s: 2 }
          ],
          blue: [
            { 0: 1 },
            { 1: 2 },
            { 2: 2 },
            { 3: 2 },
            { 4: 2 },
            { 5: 2 },
            { 6: 2 },
            { 7: 2 },
            { 8: 2 },
            { 9: 2 },
            { r: 2 },
            { d: 2 },
            { s: 2 }
          ],
          yellow: [
            { 0: 1 },
            { 1: 2 },
            { 2: 2 },
            { 3: 2 },
            { 4: 2 },
            { 5: 2 },
            { 6: 2 },
            { 7: 2 },
            { 8: 2 },
            { 9: 2 },
            { r: 2 },
            { d: 2 },
            { s: 2 }
          ],
          green: [
            { 0: 1 },
            { 1: 2 },
            { 2: 2 },
            { 3: 2 },
            { 4: 2 },
            { 5: 2 },
            { 6: 2 },
            { 7: 2 },
            { 8: 2 },
            { 9: 2 },
            { r: 2 },
            { d: 2 },
            { s: 2 }
          ],
          wild: [{ ww: 4 }, { wd: 4 }]
        }
      ]
    });

    var room = activeRooms[activeRooms.findIndex(i => i.room === roomKey)];
    socket.join(players[player].roomKey);
    io.in(players[player].roomKey).emit("roomInfo", room);

    console.log("active game rooms:", activeRooms);
  });

  socket.on("searching", function() {
    socket.emit("availableRooms", activeRooms);
  });
  socket.on("joinGame", function(data) {
    var player;
    var room = findRoomIndex(data.roomKey);
    try {
      if (
        activeRooms[room].players.length < 5 &&
        activeRooms[room].status === "open"
      ) {
        newPlayer(data.userName, data.roomKey);
        player = findPlayerIndex();
        activeRooms[room].players.push(players[player]);
        socket.join(players[player].roomKey);
        if (activeRooms[room].players.length === 5) {
          activeRooms[room].status = "closed";
        }
        io.in(players[player].roomKey).emit("roomInfo", activeRooms[room]);
        console.log("active game rooms:", activeRooms);
      } else if (activeRooms[room].status === "closed") {
        socket.emit("roomFull");
      }
    } catch (TypeError) {
      socket.emit("invalidRoom");
    }
  });

  function newPlayer(data, roomKey) {
    players.push({ id: socket.id, userName: data, roomKey: roomKey });
    console.log(players);
  }

  function findPlayerIndex() {
    return players.findIndex(i => i.id === socket.id);
  }

  function findRoomIndex(roomKey) {
    return activeRooms.findIndex(
      i => i.room === /* players[player]. */ roomKey
    );
  }

  socket.on("gameStart", function() {
    var player = findPlayerIndex();
    var roomKey = players[player].roomKey;
    var room = findRoomIndex(roomKey);

    activeRooms[room].status = "closed";
    console.log("Active rooms", activeRooms);

    io.in(roomKey).emit("gameStart", activeRooms[room]);
  });

  socket.on("disconnect", function() {
    var player = findPlayerIndex();
    var roomKey;
    var room;

    if (player != -1) {
      roomKey = players[player].roomKey;
      room = findRoomIndex(roomKey);
      player = players.splice(player, 1);

      activeRooms[room].players.splice(
        activeRooms[room].players.findIndex(i => i.players === player),
        1
      );

      activeRooms[room].status = "open";

      if (activeRooms[room].players.length === 0) {
        activeRooms.splice(room, 1);
      }
    }
    io.in(roomKey).emit("roomInfo", activeRooms[room]);
    console.log("Active players", players);
    console.log("Active rooms", activeRooms);
  });
});
