var socket = io();
var params = jQuery.deparam(window.location.search);
var timer;
var time = 20;

//host connect to server
socket.on("connect", function(){
  socket.emit("host-join-game", params);
});

socket.on("noGameFound", function(){
  window.location.href = "../../";
});

socket.on("gameQuestions", function(data){
  document.getElementById("question").innerHTML = data.q1;
  document.getElementById("answer1").innerHTML = data.a1;
  document.getElementById("answer2").innerHTML = data.a2;
  document.getElementById("answer3").innerHTML = data.a3;
  document.getElementById("answer4").innerHTML = data.a4;
  var correctAnswer = data.correct;
  document.getElementById("playersAnswered").innerHTML = "Players Answered / " + data.playersInGame;
  updateTimer();
});

function updateTimer(){
  time = 20;
  timer = setInterval(function(){
    time -= 1;
    document.getElementById("num").textContent = " " + time;
    if(time == 0){
      socket.emit("timeUp");
    }
  }, 1000);
}

socket.on("updatePlayersAnswered", function(data){
  document.getElementById('playersAnswered').innerHTML = "Players Answered " + data.playersAnswered + " / " + data.playersInGame;
});

socket.on("questionOver", function(playerData, correct){
  clearInterval(timer);
  var answer1 = 0;
  var answer2 = 0;
  var answer3 = 0;
  var answer4 = 0;
  var total   = 0;

  //Hide elements on page
  document.getElementById('playersAnswered').style.display = "none";
  document.getElementById('timerText').style.display = "none";

  //show correct answer
  if(correct == 1) {
    document.getElementById('answer2').style.filter = "grayscale(100%)";
    document.getElementById('answer3').style.filter = "grayscale(100%)";
    document.getElementById('answer4').style.filter = "grayscale(100%)";
    var current = document.getElementById('answer1').innerHTML;
    document.getElementById('answer1').innerHTML = "&#10004" + " " + current;
  } else if (correct == 2) {
    document.getElementById('answer1').style.filter = "grayscale(100%)";
    document.getElementById('answer3').style.filter = "grayscale(100%)";
    document.getElementById('answer4').style.filter = "grayscale(100%)";
    var current = document.getElementById('answer2').innerHTML;
    document.getElementById('answer2').innerHTML = "&#10004" + " " + current;
  } else if(correct == 3) {
    document.getElementById('answer1').style.filter = "grayscale(100%)";
    document.getElementById('answer2').style.filter = "grayscale(100%)";
    document.getElementById('answer4').style.filter = "grayscale(100%)";
    var current = document.getElementById('answer3').innerHTML;
    document.getElementById('answer3').innerHTML = "&#10004" + " " + current;
  } else if(correct == 4) {
    document.getElementById('answer1').style.filter = "grayscale(100%)";
    document.getElementById('answer2').style.filter = "grayscale(100%)";
    document.getElementById('answer3').style.filter = "grayscale(100%)";
    var current = document.getElementById('answer4').innerHTML;
    document.getElementById('answer4').innerHTML = "&#10004" + " " + current;
  }

  for ( var i = 0; i < playerData.length; i++) {
    if(playerData[i].gameData.answer == 1){
      answer1 += 1;
    }else if(playerData[i].gameData.answer == 2){
      answer2 += 1;
    }else if(playerData[i].gameData.answer == 3){
      answer3 += 1;
    }else if(playerData[i].gameData.answer == 4){
      answer4 += 1;
    }
    total += 1;
  }

  if(correct == 1) {

    document.getElementById('square2').style.filter = "grayscale(100%)";
    document.getElementById('square3').style.filter = "grayscale(100%)";
    document.getElementById('square4').style.filter = "grayscale(100%)";
    document.getElementById('square1').innerHTML = answer1;
    document.getElementById('square2').innerHTML = answer2;
    document.getElementById('square3').innerHTML = answer3;
    document.getElementById('square4').innerHTML = answer4;
  } else if (correct == 2) {

    document.getElementById('square1').style.filter = "grayscale(100%)";
    document.getElementById('square3').style.filter = "grayscale(100%)";
    document.getElementById('square4').style.filter = "grayscale(100%)";
    document.getElementById('square1').innerHTML = answer1;
    document.getElementById('square2').innerHTML = answer2;
    document.getElementById('square3').innerHTML = answer3;
    document.getElementById('square4').innerHTML = answer4;

  } else if(correct == 3) {

    document.getElementById('square2').style.filter = "grayscale(100%)";
    document.getElementById('square1').style.filter = "grayscale(100%)";
    document.getElementById('square4').style.filter = "grayscale(100%)";
    document.getElementById('square1').innerHTML = answer1;
    document.getElementById('square2').innerHTML = answer2;
    document.getElementById('square3').innerHTML = answer3;
    document.getElementById('square4').innerHTML = answer4;

  } else if(correct == 4) {

    document.getElementById('square2').style.filter = "grayscale(100%)";
    document.getElementById('square3').style.filter = "grayscale(100%)";
    document.getElementById('square1').style.filter = "grayscale(100%)";
    document.getElementById('square1').innerHTML = answer1;
    document.getElementById('square2').innerHTML = answer2;
    document.getElementById('square3').innerHTML = answer3;
    document.getElementById('square4').innerHTML = answer4;
  }

  //get value for graph
  answer1 = answer1 / total * 150;
  answer2 = answer2 / total * 150;
  answer3 = answer3 / total * 150;
  answer4 = answer4 / total * 150;

  document.getElementById('square1').style.display = "inline-block";
  document.getElementById('square2').style.display = "inline-block";
  document.getElementById('square3').style.display = "inline-block";
  document.getElementById('square4').style.display = "inline-block";

  document.getElementById('square1').style.height = answer1 + "px";
  document.getElementById('square2').style.height = answer2 + "px";
  document.getElementById('square3').style.height = answer3 + "px";
  document.getElementById('square4').style.height = answer4 + "px";

  document.getElementById('nextQButton').style.display = "block";
});

function nextQuestion() {
  document.getElementById('nextQButton').style.display = "none";
  document.getElementById('square1').style.display = "none";
  document.getElementById('square2').style.display = "none";
  document.getElementById('square3').style.display = "none";
  document.getElementById('square4').style.display = "none";

  document.getElementById('answer1').style.filter = "none";
  document.getElementById('answer2').style.filter = "none";
  document.getElementById('answer3').style.filter = "none";
  document.getElementById('answer4').style.filter = "none";

  document.getElementById('square1').style.filter = "none";
  document.getElementById('square2').style.filter = "none";
  document.getElementById('square3').style.filter = "none";
  document.getElementById('square4').style.filter = "none";

  document.getElementById('playersAnswered').style.display = "block";
  document.getElementById('timerText').style.display = "block";
  document.getElementById('num').innerHTML = " 20";
  socket.emit('nextQuestion');
}

socket.on("GameOver", function(data){
  document.getElementById('nextQButton').style.display = "none";
  document.getElementById('square1').style.display = "none";
  document.getElementById('square2').style.display = "none";
  document.getElementById('square3').style.display = "none";
  document.getElementById('square4').style.display = "none";

  document.getElementById('answer1').style.display = "none";
  document.getElementById('answer2').style.display = "none";
  document.getElementById('answer3').style.display = "none";
  document.getElementById('answer4').style.display = "none";
  document.getElementById('timerText').innerHTML = "";
  document.getElementById('playersAnswered').innerHTML = "GAME OVER";
  document.getElementById('question').innerHTML = "TOP 5";

  document.getElementById('winner1').style.display = "block";
  document.getElementById('winner2').style.display = "block";
  document.getElementById('winner3').style.display = "block";
  document.getElementById('winner4').style.display = "block";
  document.getElementById('winner5').style.display = "block";

  document.getElementById('winner1').setAttribute('color', 'white');
  document.getElementById('winner2').setAttribute('color', 'white');
  document.getElementById('winner3').setAttribute('color', 'white');
  document.getElementById('winner4').setAttribute('color', 'white');
  document.getElementById('winner5').setAttribute('color', 'white');

  document.getElementById('winner1').setAttribute('text-align', 'center');
  document.getElementById('winner2').setAttribute('text-align', 'center');
  document.getElementById('winner3').setAttribute('text-align', 'center');
  document.getElementById('winner4').setAttribute('text-align', 'center');
  document.getElementById('winner5').setAttribute('text-align', 'center');

  document.getElementById('winner1').innerHTML = "1. " + data.num1;
  document.getElementById('winner2').innerHTML = "2. " + data.num2;
  document.getElementById('winner3').innerHTML = "3. " + data.num3;
  document.getElementById('winner4').innerHTML = "4. " + data.num4;
  document.getElementById('winner5').innerHTML = "5. " + data.num5;
});

socket.on("getTime", function(player){
  socket.emit("time", {
    player: player,
    time: time
  });
});
