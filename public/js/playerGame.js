var socket         = io()
var playerAnswered = false;
var correct        = false;
var score          = 0;
var name;


var params = jQuery.deparam(window.location.search);

socket.on("connect", function() {
  socket.emit("player-join-game", params);

  document.getElementById('answer1').style.visibility = "visible";
  document.getElementById('answer2').style.visibility = "visible";
  document.getElementById('answer3').style.visibility = "visible";
  document.getElementById('answer4').style.visibility = "visible";
});

socket.on("noGameFound", function(){
  window.location.href = "../../";
});

function answerSubmitted(num) {
  if (playerAnswered == false) {
    playerAnswered   = true;

    socket.emit("playerAnswer", num);

    document.getElementById('answer1').style.visibility = "hidden";
    document.getElementById('answer2').style.visibility = "hidden";
    document.getElementById('answer3').style.visibility = "hidden";
    document.getElementById('answer4').style.visibility = "hidden";
    document.getElementById('message').style.display    = "block";
    document.getElementById('message').innerHTML        = "Answer Submitted";
    if (num == 1) {
      document.body.style.backgroundColor = "#1d8c17";
      document.getElementById('message').style.display    = "block";
      document.getElementById('message').innerHTML        = "Answer: A has been Submitted";
      document.getElementById('message').style.color="white";
    } else if (num == 2) {
      document.body.style.backgroundColor = "#e5221b";
      document.getElementById('message').style.display    = "block";
      document.getElementById('message').innerHTML        = "Answer: B has been Submitted";
      document.getElementById('message').style.color="white";
    } else if (num == 3) {
      document.body.style.backgroundColor = "#2a84dd";
      document.getElementById('message').style.display    = "block";
      document.getElementById('message').innerHTML        = "Answer: C has been Submitted";
      document.getElementById('message').style.color="white";
    } else {
      document.body.style.backgroundColor = "#ea8f33";
      document.getElementById('message').style.display    = "block";
      document.getElementById('message').innerHTML        = "Answer: D has been Submitted";
      document.getElementById('message').style.color="white";
    }
  }
}

socket.on("answerResult", function(data){
  if(data == true) {
    correct = true;
  }
});

socket.on("newScore", function(data){
  document.getElementById("scoreText").innerHTML = "Score: " + data;
});

socket.on("nextQuestionPlayer", function(){
  correct = false;
  playerAnswered = false;

  document.getElementById('answer1').style.visibility = "visible";
  document.getElementById('answer2').style.visibility = "visible";
  document.getElementById('answer3').style.visibility = "visible";
  document.getElementById('answer4').style.visibility = "visible";
  document.getElementById('message').style.display = "none";
  document.body.style.backgroundColor = "white";
});

socket.on("hostDisconnect", function(){
  window.location.href = "../../";
});

socket.on("playerGameData", function(data){
  for(var i = 0; i < data.length; i++) {
    if(data[i].playerId == socket.id) {
      document.getElementById("nameText").innerHTML  = "Name: " + data[i].name;
      document.getElementById("scoreText").innerHTML = "Score: " + data[i].gameData.score;
    }
  }
});

socket.on("questionOver", function(data){
    if(correct == true){
        document.body.style.backgroundColor = "#4CAF50";
        document.getElementById('message').style.display = "block";
        document.getElementById('message').innerHTML = "Correct!";
        document.getElementById('message').style.color="white";
    }else{
        document.body.style.backgroundColor = "#f94a1e";
        document.getElementById('message').style.display = "block";
        document.getElementById('message').innerHTML = "Incorrect!";
        document.getElementById('message').style.color="white";
    }
    document.getElementById('answer1').style.visibility = "hidden";
    document.getElementById('answer2').style.visibility = "hidden";
    document.getElementById('answer3').style.visibility = "hidden";
    document.getElementById('answer4').style.visibility = "hidden";
    socket.emit('getScore');
});

socket.on("GameOver", function(){
  document.body.style.backgroundColor = "#FFFFFF";
  document.getElementById('answer1').style.visibility = "hidden";
  document.getElementById('answer2').style.visibility = "hidden";
  document.getElementById('answer3').style.visibility = "hidden";
  document.getElementById('answer4').style.visibility = "hidden";
  document.getElementById('message').style.display = "block";
  document.getElementById('message').innerHTML = "GAME OVER";
});
