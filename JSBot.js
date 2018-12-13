var Discord = require('discord.io');
var functions = require("./functions.js");
var info = require('./info.js');
var colors = require('colours');
var fs = require('fs');
var mysql = require('mysql');
var accounting = require('accounting');
var CronJob = require('cron').CronJob;
// var oneLinerJoke = require('one-liner-joke');
// var accounting = require('accounting');

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
  console.log(("Logged " + bot.username + " - (" + bot.id + ") in.").magenta);

  bot.setPresence({
    game: {
      name: "JavaScript",
    }
  })

  bot.editUserInfo({
    username: "JavaScript Bot",
    //avatar: require('fs').readFileSync('R:/Downloads/Slike/lirik.png', 'base64')
  })

});


eval(require('fs').readFileSync("slots.js") + '');
eval(require('fs').readFileSync("blackjack.js") + '');
// eval(require('fs').readFileSync("HiLo.js") + '');


function sendMessage(channelID, message, bot) {
  bot.sendMessage({
    to: channelID,
    message: message
  });
  console.log("Sent message to " + channelID);

};


bot.on('presence', function(user, userID, status, game, event) {
  /*Dodavanje u SQL*/
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
  /*Gotovo dodavanje*/
});


/*Reconnect*/
bot.on('disconnect', function() { bot.connect(); });


/*Dodavanje bodova*/
var points = new CronJob('1 * * * * *', function() {
  var add_points = 10;
  functions.Update("update users set points = points+'" + add_points + "' where status = 'online' ", pool);
  var add_points = 3;
  functions.Update("update users set points = points+'" + add_points + "' where status = 'idle' ", pool);
  var add_points = 1;
  functions.Update("update users set points = points+'" + add_points + "' where status = 'dnd' ", pool);
}, null, true, 'America/Los_Angeles');

points.start();


/*Poruke*/
bot.on('message', function(user, userID, channelID, message, event) {
  var msg_split = message.split(" ");

  /*Mjenjanje igre*/
  if (msg_split[0].toLowerCase() == "+play" && msg_split[1] != undefined && userID == '128941571155427339') {
    var msg = message.replace("+play ", "");

    bot.setPresence({
      game: {
        name: msg,
      }
    })

    functions.sendMessage(channelID, 'The game was set to ' + msg + '.', bot);
  }


  if (msg_split[0].toLowerCase() == "+help") {
    functions.sendMessage(channelID, 'Command list:\n' +
      '**+Points** - Check your points.\n' +
      '**+Tip <amount> <tag>** - Tip somebody some points.\n' +
      '**+Ping** - A nice and calm round of ping pong.\n' +
      '**+Rock|+Scissors|+Paper** - Play a round of Rock, Scissors or Paper\n' +
      '**+Bj** - For more info about BlackJack\n' +
      //'**+HoL** - For more info about High or Low\n' +
      '**+Slots** - Minimum buy-in is 100 points\n' +
      '**+Guess** - Guess the number.\n' //+
      //'**+Poke <somebody> (optional message)** - poke someone\n' +
      //'**+Guesspoke <somebody>** - if guessed right, you get points, if not, the poker gets. Easy\n' +
      //'**+Mug <somebody>** - Mug some pleb.\n' +
      //'**+BuyTicket** - To join the lottery, each ticket costs 5000 points, winners drawn every Monday, Wednesday and Saturday.\n' +
      //'**+Uptime** - Check the bots Uptime.\n' +
      //'**+Sing** - Some random songs.\n' +
      //'**+Slap <somebody>** - self explainatory\n' +
      //'**+Hug <somebody>** - be nice and share love\n' +
      //'**+Dare <somebody>** - dare somebody\n' +
      // '**+Ship** - Random couples. Random couples everywhere\n' +
      //'**+Rate <somebody>** - make their day...or not. Depends\n' +
      //'**+Pure <somebody>** - determine their pureness.\n' +
      //'**+Use <somebody>** - Check somebodies usefulness\n' +
      //'**+Worth <somebody>** - Check somebodies worth\n' +
      //'**+Joke** - Crack some bad jokes.'
      , bot);
  }


  /*Tips*/
  if (msg_split[0].toLowerCase() == '+tip') {
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


  /*Logs of somebody
  if (userID == "userid of the person") {
      msg = event['d']['content'];
      chan = event['d']['channel_id'];

      functions.sendMessage("userid of the person", "Vlad said in <#" + chan + ">: " + msg, bot);
  }*/


  /*Point check*/
  if (msg_split[0].toLowerCase() == "+points") {

    pool.getConnection(function(err, connection) {
      connection.query("select * from users where user_id = ? ", [userID], function(err, rows, fields) {

        var points = rows[0].points;

        sendMessage(channelID, "You have **" + accounting.formatNumber(points, 0) + "** points.", bot);
      });
      connection.release();
    });
    //functions.sendMessage('246232029195141120', '<@' + userID + '> did **+points**', bot);
  }


  /*Rock-Scissors-Paper*/
  if (msg_split[0].toLowerCase() == "+rock" && msg_split[1] == undefined) {
    var rspChance = Math.floor((Math.random() * 9) + 1);

    if (rspChance <= 3) {
      functions.sendMessage(channelID, "Rock vs Rock, it's a tie!", bot);
    } else if (rspChance > 3 && rspChance <= 6) {
      functions.sendMessage(channelID, "Rock vs Paper, you lost!", bot);
    } else {
      functions.sendMessage(channelID, "Rock vs Scissors, you won!", bot);
    }
  }

  if (msg_split[0].toLowerCase() == "+scissors" && msg_split[1] == undefined) {
    var rspChance = Math.floor((Math.random() * 9) + 1);

    if (rspChance <= 3) {
      functions.sendMessage(channelID, "Scissors vs Rock, you lost!", bot);
    } else if (rspChance > 3 && rspChance <= 6) {
      functions.sendMessage(channelID, "Scissors vs Paper, you won!", bot);
    } else {
      functions.sendMessage(channelID, "Scissors vs Scissors, it's a tie!", bot);
    }
  }

  if (msg_split[0].toLowerCase() == "+paper" && msg_split[1] == undefined) {
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
  if (msg_split[0].toLowerCase() == "+ping" && msg_split[1] == undefined) {
    var pingscore = Math.floor((Math.random() * 100) + 1);
        if (pingscore > 0 && pingscore <= 20) {
          //Jos pogledat kako ovo napravit
          //pool.getConnection(function(err, connection) {
            //connection.query("select * from  pingpongphrases where Condition = ? ", [0], function(err, rows, fields) {
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
            //});
            //connection.release();
          //});
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




  /*Dunno*/
  var message = message.toLowerCase();
  var message_sent = user + " -> " + message;


  /*Picture change*/
  if (msg_split[0].toLowerCase() == "!changepic" && msg_split[1] != undefined && userID == "128941571155427339") {
    var pic = message.replace("!changepic ", "")

    // bot.editUserInfo({
    //   avatar: require('fs').readFileSync('./' + pic + '.png', 'base64')
    // })

    functions.sendMessage('128941571155427339', "The picture was changed to " + pic + ".", bot);
  }




  /*Guess the number minigame*/
  if (msg_split[0].toLowerCase() == "+guess") {

    if (msg_split[1] == undefined || msg_split[2] == undefined) {
      /*No bet so explanation*/

      functions.sendMessage(channelID, "<@" + userID + ">, this is a game of guess where you have to guess a number from 1 to 100. \n" +
        "Depending on how close you come, the number of points you get will increase.\n" +
        "The minimum amout you can bet is 10 points.\n" +
        "You bet with **+guess <bet> <guess>**", bot);

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
