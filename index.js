var express = require("express");
var socket = require("socket.io");

var app = express();
var PORT = process.env.PORT || 5000;

var server = app.listen(PORT, function() {
  console.log("listening on port", PORT);
});

app.use(express.static(__dirname + "/public/"));

var io = socket(server);

var joinableRooms = [];
var activeRooms = [];
var players = [];

io.on("connection", function(socket) {
  socket.on("newGame", function(data) {
    var roomKey;

    do {
      roomKey = Math.random()
        .toString(36)
        .substr(2, 5);
    } while (joinableRooms.includes(roomKey) === true);

    newPlayer(data, roomKey);
    var player = findPlayerIndex();

    joinableRooms.push({
      room: roomKey,
      status: "open",
      host: players[player],
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
      ],
      gameStarted: false
    });

    var room = joinableRooms[joinableRooms.findIndex(i => i.room === roomKey)];
    socket.broadcast.emit("availableRooms", joinableRooms);

    socket.join(players[player].roomKey);
    io.in(players[player].roomKey).emit("roomInfo", room);
    console.log("joinable rooms:", joinableRooms);
    console.log("active rooms:", activeRooms);
  });

  socket.on("searching", function() {
    socket.emit("availableRooms", joinableRooms);
  });
  socket.on("joinGame", function(data) {
    var player;
    var room = findJoinableRoomIndex(data.roomKey);
    try {
      if (
        joinableRooms[room].players.length < 5 &&
        joinableRooms[room].status === "open"
      ) {
        newPlayer(data.userName, data.roomKey);
        player = findPlayerIndex();
        joinableRooms[room].players.push(players[player]);
        socket.join(players[player].roomKey);
        if (joinableRooms[room].players.length === 5) {
          joinableRooms[room].status = "closed";
        }

        socket.broadcast.emit("availableRooms", joinableRooms);
        io.in(players[player].roomKey).emit("roomInfo", joinableRooms[room]);
        console.log("joinable rooms:", joinableRooms);
        console.log("active rooms:", activeRooms);
      } else if (joinableRooms[room].status === "closed") {
        socket.emit("roomFull");
      }
    } catch (TypeError) {
      socket.emit("invalidRoom");
    }
  });

  function newPlayer(data, roomKey) {
    players.push({ id: socket.id, userName: data, roomKey: roomKey, hand: [] });
    console.log(
      "-----------------------------------------------------------------------------------------"
    );
    console.log("active players:", players);
  }

  function findPlayerIndex() {
    return players.findIndex(i => i.id === socket.id);
  }

  function findJoinableRoomIndex(roomKey) {
    return joinableRooms.findIndex(i => i.room === roomKey);
  }

  function findActiveRoomIndex(roomKey) {
    return activeRooms.findIndex(i => i.room === roomKey);
  }

  socket.on("gameStart", function() {
    var player = findPlayerIndex();
    var roomKey = players[player].roomKey;
    var room = findJoinableRoomIndex(roomKey);

    joinableRooms[room].status = "closed";
    joinableRooms[room].gameStarted = true;

    activeRooms.push(joinableRooms[room]);

    joinableRooms.splice(room, 1);

    room = findActiveRoomIndex(roomKey);

    io.in(roomKey).emit("gameStart", activeRooms[room]);

    socket.broadcast.emit("availableRooms", joinableRooms);

    console.log(
      "-----------------------------------------------------------------------------------------"
    );
    console.log("active players:", players);
    console.log("joinable rooms:", joinableRooms);
    console.log("active rooms:", activeRooms);
  });

  socket.on("draw", function() {
    var player = findPlayerIndex();
    var roomKey = players[player].roomKey;
    var room = findActiveRoomIndex(roomKey);

    console.log("%s draws", activeRooms[room].players[player].userName);
  });

  socket.on("disconnect", function() {
    var player = findPlayerIndex();
    var roomKey;
    var room;

    if (player != -1) {
      roomKey = players[player].roomKey;
      room = findJoinableRoomIndex(roomKey);

      var removedPlayer = players.splice(player, 1);

      if (room != -1) {
        joinableRooms[room].players.splice(
          joinableRooms[room].players.findIndex(
            i => i.id === removedPlayer[0].id
          ),
          1
        );

        if (
          joinableRooms[room].host === removedPlayer[0] &&
          joinableRooms[room].players.length != 0
        ) {
          joinableRooms[room].host = joinableRooms[room].players[0];
          var hostId = ("${%s}", joinableRooms[room].host.id);
          io.to(hostId).emit("host");
        }

        if (joinableRooms[room].gameStarted != true) {
          joinableRooms[room].status = "open";
        }

        if (joinableRooms[room].players.length === 0) {
          joinableRooms.splice(room, 1);
        }
        io.in(roomKey).emit("roomInfo", joinableRooms[room]);
      }

      room = findActiveRoomIndex(roomKey);

      if (room != -1) {
        activeRooms[room].players.splice(
          activeRooms[room].players.findIndex(
            i => i.id === removedPlayer[0].id
          ),
          1
        );

        if (
          activeRooms[room].host === removedPlayer[0] &&
          activeRooms[room].players.length != 0
        ) {
          activeRooms[room].host = activeRooms[room].players[0];
          var hostId = ("${%s}", activeRooms[room].host.id);
          io.to(hostId).emit("host");
        }

        if (activeRooms[room].players.length === 0) {
          activeRooms.splice(room, 1);
        }
        io.in(roomKey).emit("roomInfo", activeRooms[room]);
      }
    }

    console.log(
      "-----------------------------------------------------------------------------------------"
    );

    socket.broadcast.emit("availableRooms", joinableRooms);
    console.log("active players:", players);
    console.log("joinable rooms:", joinableRooms);
    console.log("active rooms:", activeRooms);
  });
});
