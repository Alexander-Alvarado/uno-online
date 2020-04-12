//var socket = io.connect("http://localhost:5000/");
var socket = io.connect("https://online-uno.herokuapp.com/");

$(function () {
  $("main").hide();
  $("#lobbySelect").hide();
  $("#lobby").hide();
  $("#roomSelect").hide();
  $(".gameOver").hide();

  var userName;
  var ID;
  var gameRoom;

  $("#nameSubmit").click(function () {
    if ($("#name").val() != "") {
      userName = $("#name").val();
      newPlayer(userName);
    }
  });

  $("#name").on({
    keydown: function (event) {
      if (event.which == 13 && $("#name").val() != "") {
        userName = $("#name").val();
        newPlayer(userName);
      }
    },
  });

  $("#roomKeySubmit").click(function () {
    if ($("#roomKey").val() != "") {
      roomKey = $("#roomKey").val();
      joinGame(roomKey.toLowerCase());
    }
  });

  $("#roomKey").on({
    keydown: function (event) {
      if (event.which == 13 && $("#roomKey").val() != "") {
        roomKey = $("#roomKey").val();
        joinGame(roomKey.toLowerCase());
      }
    },
  });

  $("#backToLobbySelect").click(function () {
    $("#roomSelect").hide();
    $("#lobbySelect").show();
  });

  $("#joinGame").click(function () {
    socket.emit("searching");
    $("#lobbySelect").hide();
    $("#roomSelect").show();
  });

  $("#newGame").click(function () {
    socket.emit("newGame", userName);
    $("#lobbySelect").hide();
    $("#lobby").show();
  });

  $("#startGame").click(function () {
    socket.emit("gameStart");
  });

  function newPlayer(userName) {
    if (userName != null || "") {
      $("#nameEnter").hide();
      $("#lobbySelect").show();
    }
  }

  function joinGame(roomKey) {
    var data = { userName: userName, roomKey: roomKey };

    socket.emit("joinGame", data);

    $("#roomSelect").hide();
    $("#lobby").show();
    $("#startGame").hide();
  }

  socket.on("userID", function (socketID) {
    ID = socketID;
  });

  socket.on("roomFull", function () {
    console.log("Room Closed");

    $("#lobby").hide();
    $("#roomSelect").show();
  });

  socket.on("roomInfo", function (room) {
    $("#roomKeyDisplayValue").html("<h2> " + room.room + " </h2>");
    $("#count").html("<h2> " + room.players.length + " </h2>");
    $("#players").text("");
    for (var i = 0; i < room.players.length; i++) {
      $("#players").append("<h2>" + room.players[i].userName + "</h2>");
    }
  });

  socket.on("updatePlayers", function (room) {
    $("#playersDisplay").html("");
    for (var i = 0; i < room.players.length; i++) {
      if (room.players[i].hand.length <= 9) {
        $("#playersDisplay").append(
          "<ul class='side'>  <li class='playerList'><p id='player" +
            (i + 1) +
            "Count'class='text text-cardCountSingle'>" +
            room.players[i].hand.length +
            "</p></li><li class='text text-playerName' >" +
            room.players[i].userName +
            "</li>"
        );
      } else if (room.players[i].hand.length > 9) {
        $("#playersDisplay").append(
          "<ul class='side'>  <li class='playerList'><p id='player" +
            (i + 1) +
            "Count'class='text text-cardCountDouble'>" +
            room.players[i].hand.length +
            "</p></li><li class='text text-playerName' >" +
            room.players[i].userName +
            "</li>"
        );
      }
    }
  });

  socket.on("availableRooms", function (joinableRooms) {
    $("#joinableRooms").text("");
    if (joinableRooms.length === 0) {
      $("#joinableRooms").append("<h2>No open rooms </h2>");
    }
    for (var i = 0; i < joinableRooms.length; i++) {
      var roomKey = joinableRooms[i].room;
      $("#joinableRooms").append(
        "<li><h2>Room: " +
          roomKey +
          ", Players: " +
          joinableRooms[i].players.length +
          "<button class='lobbyJoin' value='" +
          roomKey +
          "'>Join</button></h2></li>"
      );
    }
  });

  $("#joinableRooms").on("click", "button", function () {
    joinGame($(this).attr("value"));
  });

  socket.on("host", function () {
    console.log("you are the new host");
    $("#startGame").show();
  });

  socket.on("gameStart", function (room) {
    $("#lobby").hide();
    $("main").show();
    $("#wildSelect").hide();
    $(".gameOver").hide();
    $("#playAgain").hide();

    for (var i = 0; i < room.players.length; i++) {
      $("#playersDisplay").append(
        "<ul class='side'>  <li class='playerList'><p id='player" +
          (i + 1) +
          "Count'class='text text-cardCountSingle'>7</p></li><li class='text text-playerName' >" +
          room.players[i].userName +
          "</li>"
      );
    }

    var card = "./cards/" + room.currentCard + ".svg";

    $("#currentCard").attr("src", card).attr("alt", room.currentCard);

    socket.emit("deal");
  });

  socket.on("currentCard", function (room) {
    var card = "./cards/" + room.currentCard + ".svg";

    $("#currentCard").attr("src", card).attr("alt", room.currentCard);
  });

  socket.on("hand", function (hand) {
    $("#playerHand").html("");
    for (var i = 0; i < hand.length; i++) {
      $("#playerHand").append(
        "<img src=./cards/" +
          hand[i] +
          ".svg alt=" +
          hand[i] +
          " class=card></img>"
      );
    }
  });

  socket.on("updateDeck", function (room) {
    $("#deckCount").text(room.deck.length);
  });

  socket.on("newTurn", function (player) {
    $("#currentPlayer").text(player.userName + "'s turn");
  });

  socket.on("updateRoom", function (room) {
    gameRoom = room;
  });

  $("#deck").on("click", function () {
    if (ID === gameRoom.players[gameRoom.playerTurn].id) {
      console.log("clicked draw");
      socket.emit("draw");
    }
  });

  socket.on("yourTurn", function (gameRoom) {
    if (ID === gameRoom.players[gameRoom.playerTurn].id) {
      $("#currentPlayer").text("Your turn");

      if (gameRoom.currentCard.substring(1, 2) === "d") {
        for (var i = 0; i < 2; i++) {
          socket.emit("draw");
        }
      }

      if (
        gameRoom.currentCard.length === 1 &&
        gameRoom.discarded[gameRoom.discarded.length - 1] === "wd"
      ) {
        for (var i = 0; i < 4; i++) {
          socket.emit("draw");
        }
      }

      $("#playerHand").on("click", "img", function () {
        var playedCard = $(this).attr("alt");

        if (
          playedCard.substring(0, 1) === "w" &&
          ID === gameRoom.players[gameRoom.playerTurn].id
        ) {
          console.log("wild");
          socket.emit("handleTurn", playedCard);
          wild(playedCard);
        }

        if (
          playedCard.substring(0, 1) != "w" &&
          (playedCard.substring(0, 1) ===
            $("#currentCard").attr("alt").substring(0, 1) ||
            playedCard.substring(1, 2) ===
              $("#currentCard").attr("alt").substring(1, 2)) &&
          ID === gameRoom.players[gameRoom.playerTurn].id
        ) {
          if (playedCard.substring(1, 2) === "s") {
            console.log("skip");
            socket.emit("skip", playedCard);
          } else {
            console.log("normal card");
            socket.emit("handleTurn", playedCard);
          }
        }
      });
    }
  });

  function wild() {
    if (ID === gameRoom.players[gameRoom.playerTurn].id) {
      $("#wildSelect").show();

      $("#wildSelect").on("click", "img", function () {
        var color = $(this).attr("alt");

        socket.emit("wild", color);
        $("#wildSelect").hide();
      });
    }
  }

  socket.on("win", function (player) {
    $("main").hide();
    $(".gameOver").show();
    $("#playAgain").hide();
    $(".emoji").show();
    if (userName != player.userName) {
      $("#winner").text(player.userName + " Wins!");
      $("#confetti").hide();
    } else if (userName === player.userName) {
      $("#winner").text("You Win!");
      $("#loser").hide();
      $("#playAgain").show();
    }

    /* if (ID === gameRoom.host.id) {
      $("#playAgain").show();
    } */
  });

  $("#playAgain").on("click", function () {
    socket.emit("restart");
  });

  socket.on("restart", function () {
    var restart = true;

    socket.emit("gameStart", restart);
  });

  socket.on("invalidRoom", function () {
    console.log("room not found");
    $("#lobby").hide();
    $("#roomSelect").show();
  });
});
