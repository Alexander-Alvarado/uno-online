//var socket = io.connect("http://localhost:5000/");
var socket = io.connect("https://online-uno.herokuapp.com/");

$(function() {
  $("main").hide();
  $("#lobbySelect").hide();
  $("#lobby").hide();
  $("#roomSelect").hide();

  var userName;

  $("#nameSubmit").click(function() {
    if ($("#name").val() != "") {
      userName = $("#name").val();
      newPlayer(userName);
    }
  });

  $("#name").on({
    keydown: function(event) {
      if (event.which == 13 && $("#name").val() != "") {
        userName = $("#name").val();
        newPlayer(userName);
      }
    }
  });

  $("#backToLobbySelect").click(function() {
    $("#roomSelect").hide();
    $("#lobbySelect").show();
  });

  $("#joinGame").click(function() {
    socket.emit("searching");
    $("#lobbySelect").hide();
    $("#roomSelect").show();
  });

  $("#newGame").click(function() {
    socket.emit("newGame", userName);
    $("#lobbySelect").hide();
    $("#lobby").show();
  });

  $("#startGame").click(function() {
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

  socket.on("roomFull", function() {
    console.log("Room Closed");

    $("#lobby").hide();
    $("#roomSelect").show();
  });

  socket.on("roomInfo", function(room) {
    //console.clear();
    console.log("room info:", room);
    $("#roomKeyDisplayValue").html("<h2> " + room.room + " </h2>");
    $("#count").html("<h2> " + room.players.length + " </h2>");
    $("#players").text("");
    for (var i = 0; i < room.players.length; i++) {
      $("#players").append("<h2>" + room.players[i].userName + "</h2>");
    }
  });

  socket.on("availableRooms", function(joinableRooms) {
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

  $("#joinableRooms").on("click", "button", function() {
    joinGame($(this).attr("value"));
  });

  socket.on("host", function() {
    console.log("you are the new host");
    $("#startGame").show();
  });

  socket.on("gameStart", function(room) {
    console.log("game starting", room);
    $("#lobby").hide();
    $("main").show();
    for (var i = 0; i < room.players.length; i++) {
      $("#playersDisplay").append(
        "<ul class='side'><li><img src='./cards/back.svg' id='player" +
          (i + 1) +
          "Count' alt='card back' class='card' /></li><li>" +
          room.players[i].userName +
          "</li>"
      );
    }
  });

  socket.on("invalidRoom", function() {
    console.log("room not found");
    $("#lobby").hide();
    $("#roomSelect").show();
  });
});
