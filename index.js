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
    var player = findGlobalPlayerIndex();

    joinableRooms.push({
      room: roomKey,
      status: "open",
      host: players[player],
      players: [players[player]],
      deck: [
        "r0",
        "r1",
        "r1",
        "r2",
        "r2",
        "r3",
        "r3",
        "r4",
        "r4",
        "r5",
        "r5",
        "r6",
        "r6",
        "r7",
        "r7",
        "r8",
        "r8",
        "r9",
        "r9",
        "rr",
        "rr",
        "rd",
        "rd",
        "rs",
        "rs",
        "y0",
        "y1",
        "y1",
        "y2",
        "y2",
        "y3",
        "y3",
        "y4",
        "y4",
        "y5",
        "y5",
        "y6",
        "y6",
        "y7",
        "y7",
        "y8",
        "y8",
        "y9",
        "y9",
        "yr",
        "yr",
        "yd",
        "yd",
        "ys",
        "ys",
        "b0",
        "b1",
        "b1",
        "b2",
        "b2",
        "b3",
        "b3",
        "b4",
        "b4",
        "b5",
        "b5",
        "b6",
        "b6",
        "b7",
        "b7",
        "b8",
        "b8",
        "b9",
        "b9",
        "br",
        "br",
        "bd",
        "bd",
        "bs",
        "bs",
        "g0",
        "g1",
        "g1",
        "g2",
        "g2",
        "g3",
        "g3",
        "g4",
        "g4",
        "g5",
        "g5",
        "g6",
        "g6",
        "g7",
        "g7",
        "g8",
        "g8",
        "g9",
        "g9",
        "gr",
        "gr",
        "gd",
        "gd",
        "gs",
        "gs",
        "ww",
        "ww",
        "ww",
        "ww",
        "wd",
        "wd",
        "wd",
        "wd"
        /*  { cards: 108 },
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
        } */
      ],
      discarded: [],
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
        joinableRooms[room].players.length < 4 &&
        joinableRooms[room].status === "open"
      ) {
        newPlayer(data.userName, data.roomKey);
        player = findGlobalPlayerIndex();
        joinableRooms[room].players.push(players[player]);
        socket.join(players[player].roomKey);
        if (joinableRooms[room].players.length === 4) {
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

  function findGlobalPlayerIndex() {
    return players.findIndex(i => i.id === socket.id);
  }

  function findRoomPlayerIndex(room) {
    return activeRooms[room].players.findIndex(i => i.id === socket.id);
  }

  function findJoinableRoomIndex(roomKey) {
    return joinableRooms.findIndex(i => i.room === roomKey);
  }

  function findActiveRoomIndex(roomKey) {
    return activeRooms.findIndex(i => i.room === roomKey);
  }

  socket.on("gameStart", function() {
    var player = findGlobalPlayerIndex();
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
    var player = findGlobalPlayerIndex();
    var roomKey = players[player].roomKey;
    var room = findActiveRoomIndex(roomKey);
    player = findRoomPlayerIndex(room);

    var card = Math.floor(Math.random() * activeRooms[room].deck.length);

    activeRooms[room].players[player].hand.push(activeRooms[room].deck[card]);

    activeRooms[room].deck.splice(
      activeRooms[room].deck.findIndex(i => i === activeRooms[room].deck[card]),
      1
    );

    console.log(
      activeRooms[room].players[player].userName +
        "'s hand:" +
        activeRooms[room].players[player].hand,
      "cards in deck:" + activeRooms[room].deck.length
    );

    io.in(players[player].roomKey).emit("updateInfo", activeRooms[room]);
  });

  socket.on("deal", function() {
    var player = findGlobalPlayerIndex();
    var roomKey = players[player].roomKey;
    var room = findActiveRoomIndex(roomKey);
    player = findRoomPlayerIndex(room);

    for (var i = 0; i < 7; i++) {
      var card = Math.floor(Math.random() * activeRooms[room].deck.length);

      activeRooms[room].players[player].hand.push(activeRooms[room].deck[card]);

      activeRooms[room].deck.splice(
        activeRooms[room].deck.findIndex(
          i => i === activeRooms[room].deck[card]
        ),
        1
      );
    }

    console.log(
      activeRooms[room].players[player].userName +
        "'s hand:" +
        activeRooms[room].players[player].hand,
      "cards in deck:" + activeRooms[room].deck.length
    );

    io.in(players[player].roomKey).emit("updateInfo", activeRooms[room]);
  });

  socket.on("disconnect", function() {
    var player = findGlobalPlayerIndex();
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
