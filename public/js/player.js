var socket = io();

//Players connect to server
socket.on("connect", function(){
  var params = jQuery.deparam(window.location.search);

  socket.emit("player-join", params);
});

socket.on("noGameFound", function(){
  window.location.href = "../";
});

socket.on("hostDisconnect", function(){
  window.location.href = "../";
});

socket.on("gameStartedPlayer", function(){
  window.location.href="/player/game/" + "?id=" + socket.id;
});
