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
      ],
      currentCard: "",
      discarded: [],
      playerTurn: 0,
      firstTurn: true,
      reverseOrder: false,
      gameStarted: false
    });

    var room = joinableRooms[joinableRooms.findIndex(i => i.room === roomKey)];
    socket.broadcast.emit("availableRooms", joinableRooms);

    socket.join(players[player].roomKey);
    io.in(players[player].roomKey).emit("roomInfo", room);
    log();
    console.clear();
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
        log();
      } else if (joinableRooms[room].status === "closed") {
        socket.emit("roomFull");
      }
    } catch (TypeError) {
      socket.emit("invalidRoom");
    }
  });

  function newPlayer(data, roomKey) {
    players.push({
      id: socket.id,
      userName: data,
      roomKey: roomKey,
      hand: []
    });
    socket.emit("userID", socket.id);
    log();
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

    var card;

    do {
      card = Math.floor(Math.random() * activeRooms[room].deck.length);
    } while (activeRooms[room].deck[card] === "ww" || activeRooms[room].deck[card].substr(1, 2) === "d" || activeRooms[room].deck[card].substr(1, 2) === "r" || activeRooms[room].deck[card].substr(1, 2) === "s");

    activeRooms[room].currentCard = activeRooms[room].deck[card];

    activeRooms[room].deck.splice(
      activeRooms[room].deck.findIndex(i => i === activeRooms[room].deck[card]),
      1
    );

    io.in(roomKey).emit("gameStart", activeRooms[room]);

    socket.broadcast.emit("availableRooms", joinableRooms);

    io.in(roomKey).emit("updateRoom", activeRooms[room]);

    nextTurn();
  });

  function log() {
    console.log(
      "-----------------------------------------------------------------------------------------"
    );
    console.log("active players:", players);
    console.log("joinable rooms:", joinableRooms);
    console.log("active rooms:", activeRooms);
  }

  socket.on("draw", function() {
    var player = findGlobalPlayerIndex();
    var roomKey = players[player].roomKey;
    var room = findActiveRoomIndex(roomKey);
    player = findRoomPlayerIndex(room);

    if (player === activeRooms[room].playerTurn) {
      var card = Math.floor(Math.random() * activeRooms[room].deck.length);

      activeRooms[room].players[player].hand.push(activeRooms[room].deck[card]);

      console.log(
        activeRooms[room].players[player].userName,
        "drew:",
        activeRooms[room].deck[card],
        "\n"
      );

      activeRooms[room].deck.splice(card, 1);

      io.in(activeRooms[room].players[player].roomKey).emit(
        "updatePlayers",
        activeRooms[room]
      );
      io.in(activeRooms[room].players[player].roomKey).emit(
        "updateDeck",
        activeRooms[room]
      );

      io.in(roomKey).emit("updateRoom", activeRooms[room]);

      socket.emit("hand", activeRooms[room].players[player].hand);
    }
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

    io.in(activeRooms[room].players[player].roomKey).emit(
      "updatePlayers",
      activeRooms[room]
    );
    io.in(activeRooms[room].players[player].roomKey).emit(
      "updateDeck",
      activeRooms[room]
    );

    io.in(roomKey).emit("updateRoom", activeRooms[room]);

    socket.emit("hand", activeRooms[room].players[player].hand);
    log();
  });

  function nextTurn() {
    var player = findGlobalPlayerIndex();
    var roomKey = players[player].roomKey;
    var room = findActiveRoomIndex(roomKey);
    player = findRoomPlayerIndex(room);

    if (activeRooms[room].firstTurn === true) {
      activeRooms[room].playerTurn = Math.floor(
        Math.random() * activeRooms[room].players.length
      );
      activeRooms[room].firstTurn = false;

      console.log(
        "randomly choose " +
          activeRooms[room].players[activeRooms[room].playerTurn].userName +
          " to start game"
      );
    } else if (activeRooms[room].firstTurn === false) {
      if (activeRooms[room].reverseOrder === false) {
        activeRooms[room].playerTurn++;
        if (
          activeRooms[room].playerTurn >
          activeRooms[room].players.length - 1
        ) {
          activeRooms[room].playerTurn = 0;
        }

        console.log(
          "next turn, " +
            activeRooms[room].players[activeRooms[room].playerTurn].userName +
            "'s turn\n"
        );
      } else if (activeRooms[room].reverseOrder === true) {
        activeRooms[room].playerTurn--;
        if (activeRooms[room].playerTurn < 0) {
          activeRooms[room].playerTurn = activeRooms[room].players.length - 1;
        }

        console.log(
          "next turn, " +
            activeRooms[room].players[activeRooms[room].playerTurn].userName +
            "'s turn\n"
        );
      }
    }

    var playerTurn = activeRooms[room].playerTurn;

    io.in(roomKey).emit("updateRoom", activeRooms[room]);

    io.in(roomKey).emit("newTurn", activeRooms[room].players[playerTurn]);

    io.in(roomKey).emit("yourTurn", activeRooms[room]);
  }

  socket.on("handleTurn", function(playedCard) {
    var player = findGlobalPlayerIndex();
    var roomKey = players[player].roomKey;
    var room = findActiveRoomIndex(roomKey);
    player = findRoomPlayerIndex(room);

    if (player === activeRooms[room].playerTurn) {
      console.log(activeRooms[room].players[player].userName, "is in");

      console.log(
        activeRooms[room].players[player].userName +
          " played card: " +
          playedCard
      );

      if (activeRooms[room].currentCard.length === 2) {
        activeRooms[room].discarded.push(activeRooms[room].currentCard);
      }

      activeRooms[room].players[player].hand.splice(
        activeRooms[room].players[player].hand.findIndex(i => i === playedCard),
        1
      );

      console.log(
        activeRooms[room].players[player].userName,
        "has",
        activeRooms[room].players[player].hand.length,
        "cards left"
      );

      activeRooms[room].currentCard = playedCard;

      if (
        playedCard.substr(1, 2) === "r" &&
        activeRooms[room].reverseOrder === false
      ) {
        activeRooms[room].reverseOrder = true;
      } else if (
        playedCard.substr(1, 2) === "r" &&
        activeRooms[room].reverseOrder === true
      ) {
        activeRooms[room].reverseOrder = false;
      }

      io.in(roomKey).emit("updateRoom", activeRooms[room]);
      io.in(roomKey).emit("updatePlayers", activeRooms[room]);
      io.in(roomKey).emit("currentCard", activeRooms[room]);
      socket.emit("hand", activeRooms[room].players[player].hand);

      if (activeRooms[room].players[player].hand.length === 0) {
        io.in(roomKey).emit("win", activeRooms[room].players[player]);
      } else {
        nextTurn();
        log();
      }
    }
  });

  socket.on("skip", function(playedCard) {
    var player = findGlobalPlayerIndex();
    var roomKey = players[player].roomKey;
    var room = findActiveRoomIndex(roomKey);
    player = findRoomPlayerIndex(room);

    console.log(activeRooms[room].players[player].userName, "is skipping");

    console.log(
      activeRooms[room].players[player].userName + " played card: " + playedCard
    );

    var foundCard = activeRooms[room].players[player].hand.findIndex(
      i => i === playedCard
    );

    console.log("skip found at", foundCard);
    if (foundCard != -1) {
      if (activeRooms[room].currentCard.length === 2) {
        activeRooms[room].discarded.push(activeRooms[room].currentCard);
      }
      activeRooms[room].players[player].hand.splice(
        activeRooms[room].players[player].hand.findIndex(i => i === playedCard),
        1
      );
    }

    activeRooms[room].currentCard = playedCard;

    io.in(roomKey).emit("updateRoom", activeRooms[room]);
    io.in(roomKey).emit("updatePlayers", activeRooms[room]);
    io.in(roomKey).emit("currentCard", activeRooms[room]);
    socket.emit("hand", activeRooms[room].players[player].hand);

    nextTurn();
    nextTurn();

    log();
  });

  socket.on("wild", function(wildInfo) {
    var player = findGlobalPlayerIndex();
    var roomKey = players[player].roomKey;
    var room = findActiveRoomIndex(roomKey);
    player = findRoomPlayerIndex(room);

    if (player === activeRooms[room].playerTurn) {
      var color = wildInfo.color;
      var playedCard = wildInfo.playedCard;

      console.log("wild type:", playedCard);
      activeRooms[room].currentCard = playedCard;

      var foundCard = activeRooms[room].players[player].hand.findIndex(
        i => i === playedCard
      );

      console.log(playedCard, "found at", foundCard);
      if (foundCard != -1) {
        activeRooms[room].discarded.push(activeRooms[room].currentCard);

        activeRooms[room].players[player].hand.splice(
          activeRooms[room].players[player].hand.findIndex(
            i => i === playedCard
          ),
          1
        );
      }
      console.log("wild color chosen:", color);
      activeRooms[room].currentCard = color;

      io.in(activeRooms[room].players[player].roomKey).emit(
        "updatePlayers",
        activeRooms[room]
      );

      io.in(activeRooms[room].players[player].roomKey).emit(
        "currentCard",
        activeRooms[room]
      );

      io.in(roomKey).emit("updateRoom", activeRooms[room]);

      socket.emit("hand", activeRooms[room].players[player].hand);
      nextTurn();
      log();
    }
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

    socket.broadcast.emit("availableRooms", joinableRooms);

    log();
  });
});
