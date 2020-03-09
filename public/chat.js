var socket = io.connect("https://aa-websocket-chat.herokuapp.com/");

$(function() {
  $("#send").click(function() {
    if ($("#name").val() != "") {
      nameCheck();
      sendMessage();
    }
  });

  $("#message").on({
    keypress: function(event) {
      if ($("#name").val() != "" && event.which != 13) {
        nameCheck();
        socket.emit("typing", $("#name").val());
      }
    },
    keydown: function(event) {
      if (event.which == 13 && $("#name").val() != "") {
        nameCheck();
        sendMessage();
      }
    }
  });

  var nameSet = false;

  function nameCheck() {
    if (nameSet === false) {
      $("#name").hide(); //attr("disabled", "disabled");
      $("#active").after("<h2>" + $("#name").val() + "'s chat</h2>");
      nameSet = true;
    }
  }
  function sendMessage() {
    if ($("#name").val() != "" && $("#message").val() != "") {
      socket.emit("chat", {
        name: $("#name").val(),
        message: $("#message").val()
      });
      $("#message").val("");
    }
  }

  socket.on("chat", function(data) {
    $("#typing").hide();
    $("#output").append(
      "<p><strong>" + data.name + ": </strong>" + data.message + "</p>"
    );
  });

  socket.on("clientCount", function(activeClients) {
    $("#count").text(activeClients);
    console.log("new client count:", activeClients);
  });

  socket.on("typing", function(data) {
    $("#typing")
      .text(data + " is typing a message...")
      .show();
  });
});
