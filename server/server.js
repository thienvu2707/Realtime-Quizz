//Import dependencies
const path     = require("path");
const http     = require("http");
const express  = require("express");
const socketIO = require("socket.io");

//import classes
const {Games}    = require("./util/Games");
const {Players}  = require("./util/players");
const publicPath = path.join(__dirname, "../public");
var app          = express();
var server       = http.createServer(app);
var io           = socketIO(server);
var games        = new Games();
var players      = new Players();

//Mongodb setup
var MongoClient = require("mongodb").MongoClient;
var mongoose    = require("mongoose");
var url         = "mongodb://localhost:27017/";

app.use(express.static(publicPath));

//starting server on port 3000
server.listen(3000, function(){
  console.log("started port 3000");
});

//Request connection from client to Server
io.on("connection", function(socket) {

  //Host connection
  socket.on("host-join", function(data) {

    //check in database host id
    MongoClient.connect(url, function(err, db){
      if (err) throw err;
      var dbo = db.db("quizDB");
      var query = {id: parseInt(data.id)};
      dbo.collection("quizGames").find(query).toArray(function(err, result){
        if (err) throw err;

        //Host found if id pass throught url
        if(result[0] !== undefined){
          var gamePin = Math.floor(Math.random()*90000) + 10000;

          games.addGame(gamePin, socket.id, false, {playersAnswered: 0, questionLive: false, gameId: data.id, question: 1});

          var game = games.getGame(socket.id);

          socket.join(game.pin);

          console.log("Game created with pin number:", game.pin);

          socket.emit("showGamePin", {
            pin: game.pin
          });
        } else {
          socket.emit("noGameFound");
        }
        db.close();
      });
    });
  });

  //Host create quiz game to play
  socket.on("newQuiz", function(data){
    MongoClient.connect(url, function(err, db){
      if (err) throw err;
      var dbo    = db.db("quizDB");
      dbo.collection("quizGames").find({}).toArray(function(err, result){
        if (err) throw err;

        var num  = Object.keys(result).length;
        data.id  = typeof result[num - 1] !== "undefined" ? result[num - 1].id + 1 : 1;
        var game = data;
        dbo.collection("quizGames").insertOne(game, function(err, result){
          if (err) throw err;
          db.close();
        });
        db.close();
        socket.emit("startGameFromCreator", num);
      });
    });
  });

  //Player joining quiz games from admin
  socket.on("player-join", function(params) {

    var gameFound = false;

    for (var i = 0; i < games.games.length; i++) {

      if(params.pin == games.games[i].pin){
        console.log("Player connected to quiz");

        var hostId = games.games[i].hostId;

        //Add player to quiz game
        players.addPlayer(hostId, socket.id, params.name, {score: 0, answer: 0});

        //Player join room with Pin game
        socket.join(params.pin);

        var playersInGame = players.getPlayers(hostId);
        io.to(params.pin).emit("updatePlayerLobby", playersInGame);
        gameFound = true;
      }
    }

    if(gameFound == false){
        socket.emit('noGameFound');
      }
  });

  //host press to start quiz game
  socket.on("startGame", function(){
    var game      = games.getGame(socket.id);
    game.gameLive = true;
    socket.emit("gameStarted", game.hostId);
  });

  //show Game name for host to start room
  socket.on("requestDbNames", function(){
    MongoClient.connect(url, function(err, db){
      if (err) throw err;

      var dbo = db.db("quizDB");
      dbo.collection("quizGames").find().toArray(function(err, res){
        if (err) throw err;

        socket.emit("gameNamesData", res);
        // console.log(res);
        db.close;
      });
    });
  });

  //host start game to quiz game view
  socket.on("host-join-game", function(data){
    var oldHostId = data.id;
    var game      = games.getGame(oldHostId);
    if(game) {
      game.hostId = socket.id;
      socket.join(game.pin);
      var playerData = players.getPlayers(oldHostId);
      for (var i = 0; i < Object.keys(players.players).length; i++) {
        if (players.players[i].hostId == oldHostId){
          players.players[i].hostId = socket.id;
        }
      }
      var gameId = game.gameData["gameId"];
      MongoClient.connect(url, function(err, db){
        if (err) throw err;

        var dbo = db.db("quizDB");
        var query = {id: parseInt(gameId)};
        dbo.collection("quizGames").find(query).toArray(function(err, res){
          if (err) throw err;

          var question = res[0].questions[0].question;
          var answer1 = res[0].questions[0].answers[0];
          var answer2 = res[0].questions[0].answers[1];
          var answer3 = res[0].questions[0].answers[2];
          var answer4 = res[0].questions[0].answers[3];
          var correctAnswer = res[0].questions[0].correct;

          socket.emit("gameQuestions", {
            q1: question,
            a1: answer1,
            a2: answer2,
            a3: answer3,
            a4: answer4,
            correct: correctAnswer,
            playersInGame: playerData.length
          });
          db.close();
        });
      });

      io.to(game.pin).emit("gameStartedPlayer");
      game.gameData.questionLive = true;
    } else {
      socket.emit("noGameFound");
    }
  });

  //Player connect to gameView
  socket.on("player-join-game", function(data){
    var player = players.getPlayer(data.id);
    if(player) {
      var game = games.getGame(player.hostId);
      socket.join(game.pin);
      player.playerId = socket.id;
      var playerData = players.getPlayers(game.hostId);
      socket.emit("playerGameData", playerData);
      console.log(playerData);
    } else {
      socket.emit("noGameFound")
    }
  });

  //disconnect from quiz game
  socket.on("disconnect", function() {
    var game = games.getGame(socket.id);

    if(game) {
      if(game.gameLive == false){
        games.removeGame(socket.id)
        console.log("Quiz has ended: ", game.pin);

        var playersToRemove = players.getPlayers(game.hostId);

        for(var i = 0; i < playersToRemove.length; i++) {
          players.removePlayer(playersToRemove[i].playerId);
        }

        io.to(game.pin).emit("hostDisconnect");
        socket.leave(game.pin);
      }
    } else {
      var player = players.getPlayer(socket.id);
      if(player) {
        var hostId = player.hostId;
        var game = games.getGame(hostId);
        var pin = game.pin;

        if(game.gameLive == false) {
          players.removePlayer(socket.id);
          var playersInGame = players.getPlayers(hostId);

          io.to(pin).emit("updatePlayerLobby", playersInGame);
          socket.leave(pin);
        }
      }
    }
  });

  //Set data answer from player
  socket.on("playerAnswer", function(num){
    var player = players.getPlayer(socket.id);
    var hostId = player.hostId;
    var playerNum = players.getPlayers(hostId);
    var game = games.getGame(hostId);
    //check if question is still active
    if(game.gameData.questionLive == true) {
      player.gameData.answer = num;
      game.gameData.playersAnswered += 1;

      var gameQuestion = game.gameData.question;
      var gameId       = game.gameData.gameId;

      MongoClient.connect(url, function(err, db){
        if (err) throw err;

        var dbo   = db.db("quizDB");
        var query = {id: parseInt(gameId)};
        dbo.collection("quizGames").find(query).toArray(function(err, res){
          if (err) throw err;
          var correctAnswer = res[0].questions[gameQuestion - 1].correct;

          //Check if player answer correctly
          if (num == correctAnswer) {
            player.gameData.score += 100;
            io.to(game.pin).emit("getTime", socket.id);
            socket.emit("answerResult", true);
          }

          //check if all player already answerd
          if(game.gameData.playersAnswered == playerNum.length) {
            game.gameData.questionLive = false;
            var playerData = players.getPlayers(game.hostId);
            io.to(game.pin).emit("questionOver", playerData, correctAnswer);
          } else {
            io.to(game.pin).emit("updatePlayersAnswered", {
              playersInGame: playerNum.length,
              playersAnswered: game.gameData.playersAnswered
            });
          }
          db.close();
        });
      });
    }
  });

  socket.on("getScore", function(){
    var player = players.getPlayer(socket.id);
    socket.emit("newScore", player.gameData.score);
  });

  socket.on("time", function(data){
    var time               = data.time / 20;
    time                   = time * 1000;
    var playerid           = data.player;
    var player             = players.getPlayer(playerid);
    player.gameData.score += time;
  });

  socket.on("timeUp", function(){
    var game = games.getGame(socket.id);
    game.gameData.questionLive = false;
    var playerData = players.getPlayers(game.hostId);

    var gameQuestion = game.gameData.question;
    var gameId = game.gameData.gameId;

    MongoClient.connect(url, function(err, db){
      if (err) throw err;
      var dbo = db.db("quizDB");
      var query = { id:  parseInt(gameId)};
      dbo.collection("quizGames").find(query).toArray(function(err, res){
        if (err) throw err;
        var correctAnswer = res[0].questions[gameQuestion - 1].correct;
        io.to(game.pin).emit("questionOver", playerData, correctAnswer);

        db.close();
      });
    });
  });

  socket.on("nextQuestion", function(){
    console.log('next questions!');
    var playerData = players.getPlayers(socket.id);
    //Reset players current answer to 0
    for(var i = 0; i < Object.keys(players.players).length; i++){
      if(players.players[i].hostId == socket.id){
        players.players[i].gameData.answer = 0;
      }
    }

    var game = games.getGame(socket.id);
    game.gameData.playersAnswered = 0;
    game.gameData.questionLive    = true;
    game.gameData.question       += 1;
    var gameId = game.gameData.gameId;

    MongoClient.connect(url, function(err, db){
      if (err) throw err;

      var dbo = db.db("quizDB");
      var query = { id:  parseInt(gameId)};
      dbo.collection("quizGames").find(query).toArray(function(err, res){
        if (err) throw err;

        if(res[0].questions.length >= game.gameData.question){
          var questionNum   = game.gameData.question;
          questionNum       = questionNum - 1;
          var question      = res[0].questions[questionNum].question;
          var answer1       = res[0].questions[questionNum].answers[0];
          var answer2       = res[0].questions[questionNum].answers[1];
          var answer3       = res[0].questions[questionNum].answers[2];
          var answer4       = res[0].questions[questionNum].answers[3];
          var correctAnswer = res[0].questions[questionNum].correct;

          socket.emit("gameQuestions", {
            q1           : question,
            a1           : answer1,
            a2           : answer2,
            a3           : answer3,
            a4           : answer4,
            correct      : correctAnswer,
            playersInGame: playerData.length
          });
          db.close();
        } else {
          var playersInGame = players.getPlayers(game.hostId);
          var first         = {name: "", score: 0};
          var second        = {name: "", score: 0};
          var third         = {name: "", score: 0};
          var fourth        = {name: "", score: 0};
          var fifth         = {name: "", score: 0};

          for (var i = 0; i < playersInGame.length; i++){
            console.log(playersInGame[i].gameData.score);
            if(playersInGame[i].gameData.score > fifth.score){
              if(playersInGame[i].gameData.score > fourth.score){
                if(playersInGame[i].gameData.score > third.score){
                  if(playersInGame[i].gameData.score > second.score){
                    if(playersInGame[i].gameData.score > first.score){
                      //First place
                      fifth.name   = fourth.name;
                      fifth.score  = fourth.score;

                      fourth.name  = third.name;
                      fourth.score = third.score;

                      third.name   = second.name;
                      third.score  = second.score;

                      second.name  = first.name;
                      second.score = first.score;

                      first.name   = playersInGame[i].name;
                      first.score  = playersInGame[i].gameData.score;
                    } else {
                      //Second Place
                      fifth.name   = fourth.name;
                      fifth.score  = fourth.score;

                      fourth.name  = third.name;
                      fourth.score = third.score;

                      third.name   = second.name;
                      third.score  = second.score;

                      second.name  = playersInGame[i].name;
                      second.score = playersInGame[i].gameData.score;
                    }
                  } else {
                    //Third Place
                    fifth.name   = fourth.name;
                    fifth.score  = fourth.score;

                    fourth.name  = third.name;
                    fourth.score = third.score;

                    third.name   = playersInGame[i].name;
                    third.score  = playersInGame[i].gameData.score;
                  }
                } else {
                  //Fourth Place
                  fifth.name   = fourth.name;
                  fifth.score  = fourth.score;

                  fourth.name  = playersInGame[i].name;
                  fourth.score = playersInGame[i].gameData.score;
                }
              } else {
                //Fifth Place
                fifth.name  = playersInGame[i].name;
                fifth.score = playersInGame[i].gameData.score;
              }
            }
          }
          io.to(game.pin).emit("GameOver", {
            num1: first.name,
            num2: second.name,
            num3: third.name,
            num4: fourth.name,
            num5: fifth.name
          });
        }
      });
    });

    io.to(game.pin).emit('nextQuestionPlayer');
  });
});
