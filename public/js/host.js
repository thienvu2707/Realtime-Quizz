var socket = io();
var params = jQuery.deparam(window.location.search);

//Connect to server
socket.on("connect", function(){

  document.getElementById("players").value = "";

  socket.emit("host-join", params);
});

socket.on("showGamePin", function(data){
  document.getElementById("gamePinText").innerHTML = data.pin;
});

// Add student to screen
socket.on("updatePlayerLobby", function(data){

  document.getElementById("players").value = "";

  for(var i = 0; i < data.length; i++){
    document.getElementById("players").value += data[i].name + "\n";
  }
});

//start Quiz game

function startGame(){
  socket.emit("startGame");
}

function endGame(){
  window.location.href = "/";
}

socket.on("gameStarted", function(id){
  console.log("Quiz started");
  window.location.href = "/host/game" + "?id=" + id;
});

socket.on("noGameFound", function(){
  window.location.href = '../../';
});
