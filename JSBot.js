var Discord = require('discord.io');
var functions = require("./functions.js");
var info = require('./info.js');
var fs = require('fs');
var mysql = require('mysql');
var accounting = require('accounting');
var CronJob = require('cron').CronJob;

var bot = new Discord.Client({
  token: info.Discord_Token,
  autorun: true
});


console.log("Launching bot...".yellow);

var pool = mysql.createPool({
  host: '127.0.0.1',
  user: 'root',
  password: '',
  database: 'test'
});

bot.on('ready', function(event) {
  console.log("Logged " + bot.username + " - (" + bot.id + ") in.");

  bot.setPresence({
    game: {
      name: "JavaScript",
    }
  })

  bot.editUserInfo({
    username: "JavaScript Bot",
  })

});


function sendMessage(channelID, message, bot) {
  bot.sendMessage({
    to: channelID,
    message: message
  });
  console.log("Sent message to " + channelID);

};


bot.on('presence', function(user, userID, status, game, event) {
  /*Adding into SQL db*/
  pool.getConnection(function(err, connection) {
    connection.query("select * from users where user_id = ? ", [userID], function(err, rows, fields) {

      if (rows[0] == undefined) {
        functions.Update("insert into users (user_id, tag, status) values ('" + userID + "', '" + user + "' , '" + status + "')", pool);

      } else {
        functions.Update("update users set tag = '" + user + "', status = '" + status + "' where user_id = '" + userID + "'", pool);
      }

    });
    connection.release();
  });
  /*Done*/
});


/*Reconnect*/
bot.on('disconnect', function() { bot.connect(); });


/*Adding points (every minute)*/
var points = new CronJob('1 * * * * *', function() {
  var add_points = 10;
  functions.Update("update users set points = points+'" + add_points + "' where status = 'online' ", pool);
  var add_points = 3;
  functions.Update("update users set points = points+'" + add_points + "' where status = 'idle' ", pool);
  var add_points = 5;
  functions.Update("update users set points = points+'" + add_points + "' where status = 'dnd' ", pool);
}, null, true, 'America/Los_Angeles');

points.start();
eval(require('fs').readFileSync("slots.js") + '');
eval(require('fs').readFileSync("blackjack.js") + '');
var prefix = "+";

/*check messages*/
bot.on('message', function(user, userID, channelID, message, event) {
  var msg_split = message.split(" ");

  /*changing current game*/
  if (msg_split[0].toLowerCase() == prefix + "play" && msg_split[1] != undefined && userID == '128941571155427339') {
    var msg = message.replace(prefix + "play ", "");

    bot.setPresence({
      game: {
        name: msg,
      }
    })

    functions.sendMessage(channelID, 'The game was set to ' + msg + '.', bot);
  }


  if (msg_split[0].toLowerCase() == prefix + "help") {
    functions.sendMessage(channelID, 'Command list:\n' +
      '**' + prefix + 'Points** - Check your points.\n' +
      '**' + prefix + 'Tip <amount> <tag>** - Tip somebody some points.\n' +
      '**' + prefix + 'Ping** - A nice and calm round of ping pong.\n' +
      '**' + prefix + 'Rock|' + prefix + 'Scissors|' + prefix + 'Paper** - Play a round of Rock, Scissors or Paper\n' +
      '**' + prefix + 'Bj** - For more info about BlackJack\n' +
      '**' + prefix + 'Slots** - Minimum buy-in is 100 points\n' +
      '**' + prefix + 'Guess** - Guess the number.\n'
      , bot);
  }


  /*Tips*/
  if (msg_split[0].toLowerCase() == prefix + 'tip') {
    var points = parseInt(msg_split[1], 10);

    var allow = true;
    var outcome = '';


    if (event['d']['mentions'].length == 0) {
      outcome = 'You need to tag a user.';
      allow = false;
    }

    if (event['d']['mentions'].length > 1) {
      outcome = 'You cannot tip multiple users.';
      allow = false;
    }

    if (!functions.isDecimal(points)) {
      outcome = "You cannot tip a decimal value.";
      allow = false;

    }

    if (functions.isNegative(points)) {
      outcome = "You cannot tip a negative value.";
      allow = false;

    }

    if (event['d']['mentions'][0] != undefined) {
      if (functions.UserCheck(event['d']['mentions'][0]['id'] == userID)) {
        outcome = "You cannot tip to yourself.";
        allow = false;
      }
    }

    if (allow == true) {
      pool.getConnection(function(err, connection) {
        connection.query("select * from  users where user_id = ? ", [userID], function(err, rows, fields) {


          if (rows[0].points >= points) {
            bot.sendMessage({
              to: channelID,
              message: "<@" + userID + "> You tipped **" + accounting.formatNumber(points, 0) + "** to <@" + event['d']['mentions'][0]['id'] + ">"
            })
            functions.Update("update users set points = points - '" + points + "' where user_id = '" + userID + "'", pool);
            functions.Update("update users set points = points + '" + points + "' where user_id = '" + event['d']['mentions'][0]['id'] + "' ", pool);

          } else {
            bot.sendMessage({
              to: channelID,
              message: "<@" + userID + "> You don't have enough points to tip this amount."
            })
          }

        });
        connection.release();
      });
    } else {
      bot.sendMessage({
        to: channelID,
        message: "<@" + userID + "> " + outcome
      })
    }
  }


  /*Point check*/
  if (msg_split[0].toLowerCase() == prefix + "points") {

    pool.getConnection(function(err, connection) {
      connection.query("select * from users where user_id = ? ", [userID], function(err, rows, fields) {

        var points = rows[0].points;

        sendMessage(channelID, "You have **" + accounting.formatNumber(points, 0) + "** points.", bot);
      });
      connection.release();
    });
  }


  /*Rock-Scissors-Paper*/
  if (msg_split[0].toLowerCase() == prefix + "rock" && msg_split[1] == undefined) {
    var rspChance = Math.floor((Math.random() * 9) + 1);

    if (rspChance <= 3) {
      functions.sendMessage(channelID, "Rock vs Rock, it's a tie!", bot);
    } else if (rspChance > 3 && rspChance <= 6) {
      functions.sendMessage(channelID, "Rock vs Paper, you lost!", bot);
    } else {
      functions.sendMessage(channelID, "Rock vs Scissors, you won!", bot);
    }
  }

  if (msg_split[0].toLowerCase() == prefix + "scissors" && msg_split[1] == undefined) {
    var rspChance = Math.floor((Math.random() * 9) + 1);

    if (rspChance <= 3) {
      functions.sendMessage(channelID, "Scissors vs Rock, you lost!", bot);
    } else if (rspChance > 3 && rspChance <= 6) {
      functions.sendMessage(channelID, "Scissors vs Paper, you won!", bot);
    } else {
      functions.sendMessage(channelID, "Scissors vs Scissors, it's a tie!", bot);
    }
  }

  if (msg_split[0].toLowerCase() == prefix + "paper" && msg_split[1] == undefined) {
    var rspChance = Math.floor((Math.random() * 9) + 1);

    if (rspChance <= 3) {
      functions.sendMessage(channelID, "Paper vs Rock, you won!", bot);
    } else if (rspChance > 3 && rspChance <= 6) {
      functions.sendMessage(channelID, "Paper vs Paper, it's a tie!", bot);
    } else {
      functions.sendMessage(channelID, "Paper vs Scissors, you lost!", bot);
    }
  }




  /*A calming round of Ping Pong*/
  if (msg_split[0].toLowerCase() == prefix + "ping" && msg_split[1] == undefined) {
    var pingscore = Math.floor((Math.random() * 100) + 1);
        if (pingscore > 0 && pingscore <= 20) {
          var pongReturnPoss = ["Get #NoScoped",
            "GG-ez",
            "Fucking easy.",
            "Again",
            "What a shame.",
            "Is this easy mode?",
            "Fucking #NerfThis",
            "*domination*",
            "*unstoppable*",
            "Just like expected",
            "Just as I calculated",
            "Fuck yeah",
            "Better luck next time",
            "RIP",
            "You could have done better",
          ];
          var pongReturn = pongReturnPoss[Math.floor(Math.random() * pongReturnPoss.length)];
          var pongReturnFin = "You lost. " + pongReturn;
        } else if (pingscore > 20 && pingscore <= 40) {
          var pongReturnPoss = ["#Rigged",
            "Wat",
            "CHEATER",
            "What. How dafuq...",
            "Impossible...",
            "Nice one.",
            "You deserved this win",
            "Hax",
            "Fucking hell.",
            "For fucks sake",
            "and I thought ***I*** went easy on ***you***",
            "REMATCH! NOW!",
            "Fucking pussy strats",
            "*turns around* Sorry Master, You trusted me, and I have failed you...",
            "Eih, I was letting you win",
          ];
          var pongReturn = pongReturnPoss[Math.floor(Math.random() * pongReturnPoss.length)];
          var pongReturnFin = "You won. " + pongReturn;
        } else {
          var pongReturnFin = "Pong";
        }

    functions.sendMessage(channelID, pongReturnFin, bot);
  }


  /*Guess the number minigame*/
  if (msg_split[0].toLowerCase() == prefix + "guess") {

    if (msg_split[1] == undefined || msg_split[2] == undefined) {
      /*No bet so explanation*/

      functions.sendMessage(channelID, "<@" + userID + ">, this is a game of guess where you have to guess a number from 1 to 100. \n" +
        "Depending on how close you come, the number of points you get will increase.\n" +
        "The minimum amout you can bet is 10 points.\n" +
        "You bet with **" + prefix + "guess <bet> <guess>**", bot);

      /*Bet and guess, here we go*/
    } else {

      /**bet specified, checking it**/
      var bet = msg_split[1];
      var guess = msg_split[2];
      var allow_continue = true;
      var outcome = '';

      /**Checking if bet is decimal**/
      if (!functions.isDecimal(bet)) {
        allow_continue = false;
        outcome = "you cannot bet a decimal value.";
      }

      /**Checking if bet is negative**/
      if (functions.isNegative(bet)) {
        allow_continue = false;
        outcome = "you cannot bet a negative value.";
      }

      /**Checking if bet is bigger than min bet**/
      if (bet < 10) {
        allow_continue = false;
        outcome = "minimum buy in is 10 points.";
      }

      /**Checking if guess is decimal**/
      if (!functions.isDecimal(guess)) {
        allow_continue = false;
        outcome = "you cannot guess a decimal value.";
      }

      /**Checking if guess is negative**/
      if (functions.isNegative(guess)) {
        allow_continue = false;
        outcome = "you cannot guess a negative value.";
      }

      /**Checking if guess is bigger than max guess**/
      if (guess > 100) {
        allow_continue = false;
        outcome = "you cannot guess a number higher than 100.";
      }


      /**Everything gucchi, we move on**/
      if (allow_continue == true) {

        /**Checking if enough points**/
        pool.getConnection(function(err, connection) {
          connection.query("select * from users where user_id = ? ", [userID], function(err, rows, fields) {

            /**Enough points, we move on**/
            if (parseInt(rows[0].points) >= parseInt(bet)) {
              functions.Update("update users set points = points-'" + bet + "' where user_id =  '" + userID + "' ", pool);
              var prevMess = "<@" + userID + "> , you placed your bet.\n";


              /*The random number people have to guess*/
              var randNum = Math.floor((Math.random() * 100) + 1)


              /*Guessed right*/
              if (guess == randNum) {

                functions.sendMessage(channelID, prevMess + "You guessed spot on, enjoy your doubled bet money.", bot);
                functions.Update("update users set points = points+'" + bet * 2 + "' where user_id =  '" + userID + "' ", pool);

                /*Guessed +-2*/
              } else if (guess <= randNum + 2 && guess >= randNum - 2) {

                functions.sendMessage(channelID, prevMess + "You guessed fairly close within a 2 points difference, enjoy your 1.75 points multiplier.", bot);
                functions.Update("update users set points = points+'" + bet * 1.75 + "' where user_id =  '" + userID + "' ", pool);

                /*Guessed +-5*/
              } else if (guess <= randNum + 5 && guess >= randNum - 5) {

                functions.sendMessage(channelID, prevMess + "You guessed close within a 5 points difference, have a 1.5 points multiplier.", bot);
                functions.Update("update users set points = points+'" + bet * 1.5 + "' where user_id =  '" + userID + "' ", pool);

                /*Guessed +-10*/
              } else if (guess <= randNum + 10 && guess >= randNum - 10) {

                functions.sendMessage(channelID, prevMess + "You guessed kind of close within a 10 points difference, have your points back.", bot);
                functions.Update("update users set points = points+'" + bet + "' where user_id =  '" + userID + "' ", pool);

                /*Not even close*/
              } else {

                functions.sendMessage(channelID, prevMess + "You weren't even close, wave goodbye to your points.", bot);
              }


              /**Not enough points**/
            } else {
              functions.sendMessage(channelID, "<@" + userID + "> , you don't have enough points for this.", bot);

            }

          });
          connection.release();
        });


        /**You failed the check**/
      } else {
        functions.sendMessage(channelID, "<@" + userID + ">, " + outcome, bot);
      }
    }
  }
  /*End of whole guess*/


});
