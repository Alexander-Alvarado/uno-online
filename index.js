var express = require("express");
var socket = require("socket.io");
const crypto = require("crypto");

var app = express();
var PORT = process.env.PORT || 5000;

var server = app.listen(PORT, function () {});

app.use(express.static(__dirname + "/public/"));

var io = socket(server);

var joinableRooms = [];
var activeRooms = [];
var players = [];
var key = process.env.Key || "12345678900987654321123456789001";

io.on("connection", function (socket) {
  var iv = crypto.randomBytes(16);

  socket.on("newGame", function (data) {
    var roomKey;

    do {
      roomKey = Math.random().toString(36).substr(2, 5);
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
        "wd",
      ],
      currentCard: "",
      discarded: [],
      playerTurn: 0,
      firstTurn: true,
      reverseOrder: false,
      skipPlayed: false,
      wildType: "",
      gameStarted: false,
    });

    var room = joinableRooms[joinableRooms.findIndex((i) => i.room === roomKey)];
    socket.broadcast.emit("availableRooms", joinableRooms);

    socket.join(players[player].roomKey);
    io.in(players[player].roomKey).emit("roomInfo", room);
  });

  socket.on("searching", function () {
    socket.emit("availableRooms", joinableRooms);
  });
  socket.on("joinGame", function (data) {
    var player;
    var room = findJoinableRoomIndex(data.roomKey);
    try {
      if (joinableRooms[room].players.length < 4 && joinableRooms[room].status === "open") {
        newPlayer(data.userName, data.roomKey);
        player = findGlobalPlayerIndex();
        joinableRooms[room].players.push(players[player]);
        socket.join(players[player].roomKey);
        if (joinableRooms[room].players.length === 4) {
          joinableRooms[room].status = "closed";
        }

        socket.broadcast.emit("availableRooms", joinableRooms);
        io.in(players[player].roomKey).emit("roomInfo", joinableRooms[room]);
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
      hand: [],
    });
    socket.emit("userID", socket.id);
  }

  function findGlobalPlayerIndex() {
    return players.findIndex((i) => i.id === socket.id);
  }

  function findRoomPlayerIndex(room) {
    return activeRooms[room].players.findIndex((i) => i.id === socket.id);
  }

  function findJoinableRoomIndex(roomKey) {
    return joinableRooms.findIndex((i) => i.room === roomKey);
  }

  function findActiveRoomIndex(roomKey) {
    return activeRooms.findIndex((i) => i.room === roomKey);
  }

  socket.on("gameStart", function (restart) {
    var player = findGlobalPlayerIndex();
    var roomKey = players[player].roomKey;
    var room = findJoinableRoomIndex(roomKey);

    if (restart != true) {
      joinableRooms[room].status = "closed";
      joinableRooms[room].gameStarted = true;

      activeRooms.push(joinableRooms[room]);

      joinableRooms.splice(room, 1);
    }
    room = findActiveRoomIndex(roomKey);

    var card;

    do {
      card = Math.floor(Math.random() * activeRooms[room].deck.length);
    } while (activeRooms[room].deck[card] === "ww" || activeRooms[room].deck[card].substr(1, 2) === "d" || activeRooms[room].deck[card].substr(1, 2) === "r" || activeRooms[room].deck[card].substr(1, 2) === "s");

    activeRooms[room].currentCard = activeRooms[room].deck[card];

    activeRooms[room].deck.splice(
      activeRooms[room].deck.findIndex((i) => i === activeRooms[room].deck[card]),
      1
    );

    io.in(roomKey).emit("gameStart", activeRooms[room]);

    socket.broadcast.emit("availableRooms", joinableRooms);

    io.in(roomKey).emit("updateRoom", activeRooms[room]);

    if (restart != true) {
      nextTurn(roomKey);
    }
  });

  function log() {
    console.log("-----------------------------------------------------------------------------------------");
    console.log("active players:", players);
    console.log("joinable rooms:", joinableRooms);
    console.log("active rooms:", activeRooms);
  }
  
  
    function log() {
    console.log("-----------------------------------------------------------------------------------------");
    console.log("active players:", asdsa);
    console.log("joinable rooms:", sadasfas);
    console.log("active rooms:", sfadfsadsa);
  }

    function log() {
    console.log("-----------------------------------------------------------------------------------------");
    console.log("joinable rooms:", fsdafdas);
    console.log("active rooms:", fgdfgfd);
  }

    function log() {
    console.log("-----------------------------------------------------------------------------------------");
    console.log("active players:", pldgffdaayers);
    console.log("joinable rooms:", sfg);
    console.log("active rooms:", fsdfsdgfds);
  }

    function log() {
    console.log("-----------------------------------------------------------------------------------------");
    console.log("active players:", players);
    console.log("joinable rooms:", joinableRooms);
    console.log("active rooms:", activeRooms);
  }


  socket.on("draw", function () {
    var player = findGlobalPlayerIndex();
    var roomKey = players[player].roomKey;
    var room = findActiveRoomIndex(roomKey);
    player = findRoomPlayerIndex(room);

    if (player === activeRooms[room].playerTurn) {
      var card = Math.floor(Math.random() * activeRooms[room].deck.length);

      activeRooms[room].players[player].hand.push(activeRooms[room].deck[card]);

      activeRooms[room].deck.splice(card, 1);

      if (activeRooms[room].deck.length === 0) {
        activeRooms[room].deck = activeRooms[room].discarded;
        activeRooms[room].discarded = [];
      }

      var hasUno = [];

      for (var i = 0; i < activeRooms[room].players.length; i++) {
        if (activeRooms[room].players[i].hand.length === 1) {
          hasUno.push(activeRooms[room].players[i]);
        }
      }

      io.in(roomKey).emit("uno", hasUno);

      hasUno = [];

      io.in(roomKey).emit("updatePlayers", activeRooms[room]);
      io.in(roomKey).emit("updateDeck", activeRooms[room]);
      io.in(roomKey).emit("updateRoom", activeRooms[room]);

      socket.emit("hand", activeRooms[room].players[player].hand);
    }
  });

  socket.on("deal", function () {
    var player = findGlobalPlayerIndex();
    var roomKey = players[player].roomKey;
    var room = findActiveRoomIndex(roomKey);
    player = findRoomPlayerIndex(room);

    for (var i = 0; i < 7; i++) {
      var card = Math.floor(Math.random() * activeRooms[room].deck.length);

      activeRooms[room].players[player].hand.push(activeRooms[room].deck[card]);

      activeRooms[room].deck.splice(
        activeRooms[room].deck.findIndex((i) => i === activeRooms[room].deck[card]),
        1
      );
    }

    var hasUno = [];

    for (var i = 0; i < activeRooms[room].players.length; i++) {
      if (activeRooms[room].players[i].hand.length === 1) {
        hasUno.push(activeRooms[room].players[i]);
      }
    }

    io.in(roomKey).emit("uno", hasUno);

    hasUno = [];

    io.in(roomKey).emit("updatePlayers", activeRooms[room]);
    io.in(roomKey).emit("updateDeck", activeRooms[room]);
    io.in(roomKey).emit("updateRoom", activeRooms[room]);

    socket.emit("hand", activeRooms[room].players[player].hand);
  });

  function nextTurn(roomKey) {
    var player = findGlobalPlayerIndex();
    var room = findActiveRoomIndex(roomKey);
    player = findRoomPlayerIndex(room);

    if (activeRooms[room].firstTurn === true) {
      activeRooms[room].playerTurn = Math.floor(Math.random() * activeRooms[room].players.length);
      activeRooms[room].firstTurn = false;
    } else if (activeRooms[room].firstTurn === false) {
      var turnMove = 1;

      if (activeRooms[room].skipPlayed === true) {
        turnMove = 2;
      }

      if (activeRooms[room].reverseOrder === false) {
        for (var i = 0; i < turnMove; i++) {
          activeRooms[room].playerTurn++;
          if (activeRooms[room].playerTurn > activeRooms[room].players.length - 1) {
            activeRooms[room].playerTurn = 0;
          }
        }

        turnMove = 1;
      } else if (activeRooms[room].reverseOrder === true) {
        for (var i = 0; i < turnMove; i++) {
          activeRooms[room].playerTurn--;
          if (activeRooms[room].playerTurn < 0) {
            activeRooms[room].playerTurn = activeRooms[room].players.length - 1;
          }
        }

        turnMove = 1;
      }
    }

    var playerTurn = activeRooms[room].playerTurn;

    activeRooms[room].skipPlayed = false;

    io.in(roomKey).emit("updateRoom", activeRooms[room]);
    io.in(roomKey).emit("newTurn", activeRooms[room]);
    io.in(roomKey).emit("yourTurn", activeRooms[room]);
  }

  socket.on("handleTurn", function (playedCard) {
    var player = findGlobalPlayerIndex();
    var roomKey = players[player].roomKey;
    var room = findActiveRoomIndex(roomKey);
    player = findRoomPlayerIndex(room);

    activeRooms[room].skipPlayed = false;

    var foundCard = activeRooms[room].players[player].hand.findIndex((i) => i === playedCard);

    if (playedCard.substr(0, 1) === "w") {
      activeRooms[room].wildType = playedCard;
    }

    if (playedCard.substr(1, 2) === "s" && foundCard != -1) {
      activeRooms[room].skipPlayed = true;
    }

    if (player === activeRooms[room].playerTurn && playedCard.substr(0, 1) != "w" && foundCard != -1) {
      if (activeRooms[room].currentCard.length === 2) {
        activeRooms[room].discarded.push(activeRooms[room].currentCard);
      }

      activeRooms[room].players[player].hand.splice(
        activeRooms[room].players[player].hand.findIndex((i) => i === playedCard),
        1
      );

      activeRooms[room].currentCard = playedCard;

      if (playedCard.substr(1, 2) === "r" && activeRooms[room].reverseOrder === false) {
        activeRooms[room].reverseOrder = true;
      } else if (playedCard.substr(1, 2) === "r" && activeRooms[room].reverseOrder === true) {
        activeRooms[room].reverseOrder = false;
      }

      playedCard = "";

      io.in(roomKey).emit("updatePlayers", activeRooms[room]);
      io.in(roomKey).emit("currentCard", activeRooms[room]);
      socket.emit("hand", activeRooms[room].players[player].hand);

      if (activeRooms[room].players[player].hand.length === 0) {
        io.in(roomKey).emit("updateRoom", activeRooms[room]);
        io.in(roomKey).emit("win", activeRooms[room].players[player]);
      } else {
        var hasUno = [];

        for (var i = 0; i < activeRooms[room].players.length; i++) {
          if (activeRooms[room].players[i].hand.length === 1) {
            hasUno.push(activeRooms[room].players[i]);
          }
        }

        io.in(roomKey).emit("uno", hasUno);

        hasUno = [];
        nextTurn(roomKey);
      }
    }
  });

  socket.on("wild", function (color) {
    var player = findGlobalPlayerIndex();
    var roomKey = players[player].roomKey;
    var room = findActiveRoomIndex(roomKey);
    player = findRoomPlayerIndex(room);

    if (player === activeRooms[room].playerTurn) {
      var foundCard = activeRooms[room].players[player].hand.findIndex((i) => i === activeRooms[room].wildType);

      if (foundCard != -1) {
        activeRooms[room].discarded.push(activeRooms[room].wildType);

        activeRooms[room].players[player].hand.splice(
          activeRooms[room].players[player].hand.findIndex((i) => i === activeRooms[room].wildType),
          1
        );
      }
      activeRooms[room].currentCard = color;

      io.in(roomKey).emit("updatePlayers", activeRooms[room]);
      io.in(roomKey).emit("currentCard", activeRooms[room]);
      socket.emit("hand", activeRooms[room].players[player].hand);

      if (activeRooms[room].players[player].hand.length === 0) {
        io.in(roomKey).emit("updateRoom", activeRooms[room]);
        io.in(roomKey).emit("win", activeRooms[room].players[player]);
      } else {
        var hasUno = [];

        for (var i = 0; i < activeRooms[room].players.length; i++) {
          if (activeRooms[room].players[i].hand.length === 1) {
            hasUno.push(activeRooms[room].players[i]);
          }
        }

        io.in(roomKey).emit("uno", hasUno);

        hasUno = [];
        activeRooms[room].wildType = "";

        nextTurn(roomKey);
      }
    }
  });

  socket.on("restart", function () {
    var player = findGlobalPlayerIndex();
    var roomKey = players[player].roomKey;
    var room = findActiveRoomIndex(roomKey);
    player = findRoomPlayerIndex(room);

    activeRooms[room].deck = [
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
      "wd",
    ];

    activeRooms[room].discarded = [];

    activeRooms[room].currentCard = "";
    activeRooms[room].wildType = "";
    activeRooms[room].reverseOrder = false;
    activeRooms[room].skipPlayed = false;

    for (var i = 0; i < activeRooms[room].players.length; i++) {
      activeRooms[room].players[i].hand = [];
    }

    socket.emit("restart");
  });

  socket.on("disconnect", function () {
    var player = findGlobalPlayerIndex();

    var roomKey;
    var room;

    if (player != -1) {
      roomKey = players[player].roomKey;
      room = findJoinableRoomIndex(roomKey);

      var removedPlayer = players.splice(player, 1);

      if (room != -1) {
        joinableRooms[room].players.splice(
          joinableRooms[room].players.findIndex((i) => i.id === removedPlayer.id),
          1
        );

        if (joinableRooms[room].host === removedPlayer && joinableRooms[room].players.length != 0) {
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

      if (room === -1) {
        room = findActiveRoomIndex(roomKey);
        player = findRoomPlayerIndex(room);

        if (room != -1 && player != -1) {
          if (activeRooms[room].players.length > 1) {
            if (player < activeRooms[room].playerTurn) {
              activeRooms[room].playerTurn--;
            }

            for (var i = 0; i < activeRooms[room].players[player].hand.length; i++) {
              activeRooms[room].discarded.push(activeRooms[room].players[player].hand[i]);
            }
          }

          activeRooms[room].players.splice(player, 1);

          if (activeRooms[room].host === removedPlayer && activeRooms[room].players.length != 0) {
            activeRooms[room].host = activeRooms[room].players[0];
            var hostId = ("${%s}", activeRooms[room].host.id);
            io.to(hostId).emit("host");
          }

          if (activeRooms[room].players.length === 0) {
            activeRooms.splice(room, 1);
          } else {
            io.in(roomKey).emit("updatePlayers", activeRooms[room]);
            io.in(roomKey).emit("updateRoom", activeRooms[room]);
            io.in(roomKey).emit("newTurn", activeRooms[room]);

            io.in(roomKey).emit("yourTurn", activeRooms[room]);
          }
        }
      }
    }

    socket.broadcast.emit("availableRooms", joinableRooms);
  });
});
