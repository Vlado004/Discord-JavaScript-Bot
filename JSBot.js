var Discord = require('discord.io');
var functions = require("./functions.js");
var info = require('./info.js');
var slots = require('./slots.js');
var blackjack = require('./blackjack.js');
var fs = require('fs');
var mysql = require('mysql');
var accounting = require('accounting');
var CronJob = require('cron').CronJob;
var oneLinerJoke = require('one-liner-joke');

var bot = new Discord.Client({
  token: info.Discord_Token,
  autorun: true
});


console.log("Launching bot...");

var pool = mysql.createPool({
  host: info.host,
  user: info.user,
  password: info.password,
  database: info.database
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


bot.on('presence', function(user, userID, status, game, event) {
  /*Adding into SQL db*/
  pool.getConnection(function(err, connection) {
    connection.query("select * from users where user_id = ? ", [userID], function(err, rows, fields) {

      if (rows[0] == undefined) {
        functions.Update("insert ignore into users (user_id, tag, status) values ('" + userID + "', '" + user + "' , '" + status + "')", pool);

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


var reminds_check = new CronJob('1 * * * * *', function() {
  pool.getConnection(function(err, connection) {
    connection.query("select * from reminders where ready = 1 ",  function(err, rows, fields) {
      var i = 0;
      while (rows[i] != undefined) {
        functions.sendMessage(rows[i].User_ID, rows[i].Reminder, bot);
        console.log(rows[i].User_ID + "->" + rows[i].Reminder);
        i++;
      }
      functions.Update("delete from reminders where ready = 1" ,pool);
    });
    connection.release();
  });
}, null, true, 'America/Los_Angeles');
reminds_check.start();

var prefix = "+";

/*check messages*/
bot.on('message', function(user, userID, channelID, message, event) {

  if (event['d']['attachments'][0] != undefined) {
    functions.Update("insert into logs (ID, content, userID, channelID, attachments) values ('"+event['d']['id']+"','"+event['d']['content']+"','"+userID+"','"+channelID+"','"+event['d']['attachments'][0]['url']+"')", pool);
  } else {
    functions.Update("insert into logs (ID, content, userID, channelID) values ('"+event['d']['id']+"','"+event['d']['content']+"','"+userID+"','"+channelID+"')", pool);
  }

  var msg_split = message.split(" ");
  pool.getConnection(function(err, connection) {
    connection.query("select * from muted where userID = ? ", [userID], function(err, rows, fields) {
      if (rows[0] != undefined) {
        if (msg_split[0].toLowerCase() == prefix + "muteswap") {
          if (rows[0].muter != null) {
            var muter = rows[0].muter;
            var remute = rows[0].remute;
            pool.getConnection(function(err, connection) {
              connection.query("select * from users where user_id = ? ", [userID], function(err, rows, fields) {
                if (rows[0].points >= 1000 * (2**remute)) {
                  functions.Update("update users set points = points - '" + 1000 * (2**remute) + "' where user_id = '" + userID + "'", pool);
                  functions.Update("delete from muted where userID = '" + userID + "'", pool);
                  functions.Update("insert into muted (userID, muter, remute, Finish_time) values ( '" + muter + "', '" + userID + "', '" + (remute+1) + "', now() + INTERVAL 5 MINUTE)", pool);
                  functions.sendMessage(channelID, "<@" + userID + ">, Mutes - swapped.", bot);
                } else {
                  functions.sendMessage(channelID, "<@" + userID + ">, You don't have enough points for that.", bot);
                }
              });
              connection.release();
            });

          } else {
            functions.sendMessage(channelID, "<@" + userID + ">, You muted yourself you twat.", bot);
          }
        } else if (userID != bot.ID) {
          bot.deleteMessage({
            channelID: channelID,
            messageID: event['d']['id']
          });
        }
      } else {

        if (msg_split[0].toLowerCase() == prefix + "restart" && userID == info.owner) {
          functions.sendMessage(channelID, "Attempting to restart...", bot);
          bot.setPresence({
            game: {
              name: "Restarting...",
            }
          })
          setTimeout(function(){
            functions.Error("I wanna cause an Error");
          }, 3000);
        }


        if (msg_split[0].toLowerCase() == prefix + "slots") {
          slots.main(userID, pool, bot, channelID);
        }

        if (msg_split[0].toLowerCase() == prefix + "bj") {
          blackjack.main(msg_split, userID, pool, bot, channelID, prefix);
        }

        /*changing current game*/
        if (msg_split[0].toLowerCase() == prefix + "play" && msg_split[1] != undefined && userID == info.owner) {
          var msg = message.replace(prefix + "play ", "");

          bot.setPresence({
            game: {
              name: msg,
            }
          })

          functions.sendMessage(channelID, 'The game was set to ' + msg + '.', bot);
        }


        if (msg_split[0].toLowerCase() == prefix + "help") {
          var help_message = 'Command list:\n' +
            '**' + prefix + 'Points** - Check your points.\n' +
            '**' + prefix + 'Tip <Amount> <Tag>** - Tip somebody some points.\n' +
            '**' + prefix + 'Ping** - A nice and calm round of ping pong.\n' +
            '**' + prefix + 'Rock|' + prefix + 'Scissors|' + prefix + 'Paper** - Play a round of Rock, Scissors or Paper\n' +
            '**' + prefix + 'Bj** - For more info about BlackJack\n' +
            '**' + prefix + 'Slots** - Minimum buy-in is 100 points\n' +
            '**' + prefix + 'Guess** - Guess the number.\n' +
            '**' + prefix + 'Mute <Tag>** - Mute someone for 5 minutes for 1000 points.\n' +
            '**' + prefix + 'MuteSwap (when muted)** - Return the mute for a higher price (Goes up with every use).\n' +
            '**' + prefix + 'Remind <In how many hours> <What to send>** - Set reminders to message you.\n' +
            '**' + prefix + 'Roulette** - Test your luck for *money*.\n' +
            '**' + prefix + 'Own** - Shows 3 most expensive people you own.\n' +
            '**' + prefix + 'OwnAll** - Shows all people you own.\n' +
            '**' + prefix + 'Buy <Amount> <Tag>** - Buy somebody.\n' +
            '**' + prefix + 'Check <Tag>** - Check somebodies owner (for self no tag).\n' +
            '**' + prefix + 'Mug <Tag>** - Try to mug somebody for points.\n' +
            '**' + prefix + 'Queue** - Shows the priority Queue.\n' +
            '**' + prefix + 'Vote <ID Number>** - Vote for a request in the Queue.\n' +
            '**' + prefix + 'Troll <Tag>** - Troll somebody but beware of the syntax.\n' +
            '**' + prefix + 'Joke** - Crack some bad Jokes (Sometimes they are not jokes, not my fault doe).\n';
          if (functions.hasPerms(event['d']['member']['roles'])) {
            help_message += "Mod Comamnds:\n" +
              '**' + prefix + 'LastSeen <Number of Hours || Tag>** - Check Everyone who sent a message before * days || Somebodies last sent message(**HOURS ARE NOT WORKING**).\n' +
              '**' + prefix + "AddRequest <Request>** - Add something into the Queue.\n" +
              '**' + prefix + "RmRequest <Request>** - Remove something from the Queue.\n";
          }
          functions.sendMessage(userID, help_message, bot);
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

          if (functions.isNegative(points)) {
            outcome = "You cannot tip a negative value.";
              allow = false;

          }

          if (event['d']['mentions'][0] != undefined) {
            if ( event['d']['mentions'][0]['id'] == userID) {
              outcome = "You cannot tip to yourself.";
              allow = false;
            }
          }

          if (isNaN(points)) {
            outcome = 'That is not a number';
            allow = false;
          }


          if (allow) {
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

              functions.sendMessage(channelID, "You have **" + accounting.formatNumber(points, 0) + "** points.", bot);
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
            var bet = parseInt(msg_split[1], 10);;
            var guess = msg_split[2];
            var allow_continue = true;
            var outcome = '';

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
            if (functions.isDecimal(guess)) {
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

            if (isNaN(bet) || isNaN(guess)) {
              outcome = 'That is not a number';
              allow = false;
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

                      functions.sendMessage(channelID, prevMess + "You guessed spot on, enjoy your doubled bet money. **[" + randNum + "]**", bot);
                      functions.Update("update users set points = points+'" + bet * 2 + "' where user_id =  '" + userID + "' ", pool);

                      /*Guessed +-2*/
                    } else if (guess <= randNum + 2 && guess >= randNum - 2) {

                      functions.sendMessage(channelID, prevMess + "You guessed fairly close within a 2 points difference, enjoy your 1.75 points multiplier. **[" + randNum + "]**", bot);
                      functions.Update("update users set points = points+'" + bet * 1.75 + "' where user_id =  '" + userID + "' ", pool);

                      /*Guessed +-5*/
                    } else if (guess <= randNum + 5 && guess >= randNum - 5) {

                      functions.sendMessage(channelID, prevMess + "You guessed close within a 5 points difference, have a 1.5 points multiplier. **[" + randNum + "]**", bot);
                      functions.Update("update users set points = points+'" + bet * 1.5 + "' where user_id =  '" + userID + "' ", pool);

                      /*Guessed +-10*/
                    } else if (guess <= randNum + 10 && guess >= randNum - 10) {

                      functions.sendMessage(channelID, prevMess + "You guessed kind of close within a 10 points difference, have your points back. **[" + randNum + "]**", bot);
                      functions.Update("update users set points = points+'" + bet + "' where user_id =  '" + userID + "' ", pool);

                      /*Not even close*/
                    } else {

                      functions.sendMessage(channelID, prevMess + "You weren't even close, wave goodbye to your points. **[" + randNum + "]**", bot);
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

        /*Mute*/
        if (msg_split[0].toLowerCase() == prefix + "mute") {
          var allow = true;
          var self_mute = false;
          var outcome = '';


          if (event['d']['mentions'].length == 0) {
            outcome = 'Because you failed to tag a person you muted yourself.';
            self_mute = true;
          }

          if (event['d']['mentions'].length > 1) {
            outcome = 'You cannot mute multiple users.';
            allow = false;
          }

          if (event['d']['mentions'][0] != undefined) {
            if (event['d']['mentions'][0]['id'] == userID) { //functions.UserCheck(event['d']['mentions'][0]['id'] == userID)???
              outcome = "You muted yourself.";
              self_mute = true;
            }
          }

          if (allow) {
            //bodovi oduzimanje etc
                if (self_mute) {
                  pool.getConnection(function(err, connection) {
                    connection.query("select * from users where user_id = ? ", [userID], function(err, rows, fields) {
                      functions.Update("Update users set points = points-'" + ((parseInt(rows[0].points) >= 100) ? 100 : parseInt(rows[0].points)) + "' where user_id =  '" + userID + "' ", pool);
                      functions.Update("Insert ignore into muted (userID, Finish_time) values ('" + userID + "', now() + INTERVAL 5 MINUTE)", pool);
                      functions.sendMessage(channelID,"<@" + userID + ">, " + outcome, bot);
                    });
                    connection.release();
                  });
                } else {
                pool.getConnection(function(err, connection) {
                  connection.query("select * from muted where userID = ? ", [event['d']['mentions'][0]['id']], function(err, rows, fields) {
                    if (rows[0] != undefined) {
                      functions.sendMessage(channelID,"<@" + userID + ">, The tagged person is already muted", bot);
                    } else {
                      pool.getConnection(function(err, connection) {
                        connection.query("select * from users where user_id = ? ", [userID], function(err, rows, fields) {
                          if (parseInt(rows[0].points) >= 1000) {
                              functions.Update("Update users set points = points-1000 where user_id =  '" + userID + "' ", pool);
                              functions.Update("Insert ignore into muted (userID, muter, Finish_time) values ('" + event['d']['mentions'][0]['id'] + "', '" + userID + "', now() + INTERVAL 5 MINUTE)", pool);
                              outcome = "Mute - accomplished";
                          } else {
                            outcome = "You don't have enough points.";
                          }
                          functions.sendMessage(channelID,"<@" + userID + ">, " + outcome, bot);
                        });
                        connection.release();
                      });
                    }

                  });
                  connection.release();
                });
              }
          } else {
            functions.sendMessage(channelID,"<@" + userID + ">, " + outcome, bot);
          }
        }


        /*Remind*/
        if (msg_split[0].toLowerCase() == prefix + "remind") {
          var outcome = "You Borked the hours.";
          if (msg_split[1] != undefined && !functions.isDecimal(msg_split[1]) && msg_split[1] > 0) {
            var outcome = "You need to specify a message.";
            if (msg_split[2] != undefined) {
              var outcome = "Reminder added to be reminded in **" + msg_split[1] + "** hours.";
              remind_mess = "";
              for (var i = 2; i < msg_split.length; i++) {
                remind_mess = remind_mess + msg_split[i] + " ";
              }
              remind_mess = remind_mess.replace("'", "");
              functions.Update("Insert ignore into reminders (User_ID, hours, Reminder) values ('" + userID + "', '" + msg_split[1] + "', '" + remind_mess + "')", pool);
            }
          }
          functions.sendMessage(channelID, "<@" + userID + ">, " + outcome, bot);
        }


        /*Roulette*/
        if (msg_split[0].toLowerCase() == prefix + "roulette") {
          var chance =  Math.floor((Math.random() * 6) + 1);
          if (chance == 6 || chance == 1) {
            functions.Update("Insert ignore into muted (userID, Finish_time) values ('" + userID + "', now() + INTERVAL 5 MINUTE)", pool);
            pool.getConnection(function(err, connection) {
              connection.query("select * from users where user_id = ? ", [userID], function(err, rows, fields) {
                functions.Update("Update users set points = points-'" + ((parseInt(rows[0].points) >= 500) ? 500 : parseInt(rows[0].points)) + "' where user_id =  '" + userID + "' ", pool);
              });
              connection.release();
            });
            functions.sendMessage(channelID, "<@" + userID + ">, You **died**, **F**", bot);
          } else {
            functions.Update("Update users set points = points + 250 where user_id =  '" + userID + "' ", pool);
            functions.sendMessage(channelID, "<@" + userID + ">, You **survived**!", bot);
          }
        }


        /*Worth*/
        if (msg_split[0].toLowerCase() == prefix + "own") {
          pool.getConnection(function(err, connection) {
            connection.query("select * from users where owner = ? order by worth desc", [userID], function(err, rows, fields) {
              var i = 0;
              var outcome = "<@" + userID + ">, Top 3 persons you own:\n"
              while (i < rows.length && i < 3) {
                outcome = outcome + "<@" + rows[i].user_id + "> - **" + accounting.formatNumber(rows[i].worth, 0) + "**\n";
                i++;
              }
              if (rows.length == 0)  {
                var outcome = "<@" + userID + ">, You don't own anybody."
              }
              functions.sendMessage(channelID, outcome, bot);
            });
            connection.release();
          });
        }

        if (msg_split[0].toLowerCase() == prefix + "ownall") {
          pool.getConnection(function(err, connection) {
            connection.query("select * from users where owner = ? order by worth desc", [userID], function(err, rows, fields) {
              var i = 0;
              var outcome = "<@" + userID + ">, Every person under your ownership:\n"
              while (i < rows.length) {
                outcome = outcome + "<@" + rows[i].user_id + "> - **" + accounting.formatNumber(rows[i].worth, 0) + "**\n";
                i++;
              }
              if (rows.length == 0)  {
                var outcome = "<@" + userID + ">, You don't own anybody."
              }
              functions.sendMessage(channelID, outcome, bot);
            });
            connection.release();
          });
        }


        /*Buying people*/
        if (msg_split[0].toLowerCase() == prefix + "buy") {
          var allow = true;
          var outcome = '';
          var points = parseInt(msg_split[1], 10);

          if (event['d']['mentions'].length == 0) {
            outcome = 'You need to tag a user.';
            allow = false;
          }

          if (event['d']['mentions'].length > 1) {
            outcome = 'You cannot buy multiple users.';
            allow = false;
          }

          if (functions.isNegative(points)) {
            outcome = "You cannot buy with a negative value.";
            allow = false;
          }

          if (isNaN(points)) {
            outcome = 'That is not a number';
            allow = false;
          }

          if (allow) {
            pool.getConnection(function(err, connection) {
              connection.query("select * from  users where user_id = ? ", [userID], function(err, rows, fields) {


                if (rows[0].points >= points) {

                  pool.getConnection(function(err, connection) {
                    connection.query("select * from  users where user_id = ? ", [event['d']['mentions'][0]['id']], function(err, rows, fields) {

	                    if (rows[0] == undefined) {
                        functions.sendMessage(channelID, "<@" + userID + ">, that person does not exist to me.", bot);
                      } else if (rows[0].worth < points) {
                        bot.sendMessage({
                          to: channelID,
                          message: "<@" + userID + ">, You bought <@" + event['d']['mentions'][0]['id'] + "> for **" + accounting.formatNumber(points, 0) + "**."
                        });

                        functions.Update("update users set points = points - '" + points + "' where user_id = '" + userID + "'", pool);
                        functions.Update("update users set worth = '" + points + "' where user_id = '" + event['d']['mentions'][0]['id'] + "' ", pool);
                        functions.Update("update users set owner = '" + userID + "' where user_id = '" + event['d']['mentions'][0]['id'] + "'", pool);
                      } else {
                        functions.sendMessage(channelID, "<@" + userID + ">, the amount you specified isn't enough to buy the wanted person.", bot);
                      }
                    });
                    connection.release();
                  });

                } else {
                  bot.sendMessage({
                    to: channelID,
                    message: "<@" + userID + "> You don't have enough points to spend the given amount."
                  })
                }

              });
              connection.release();
            });
          } else {
            functions.sendMessage(channelID, "<@" + userID + ">, " + outcome, bot);
          }

        }

        if (msg_split[0].toLowerCase() == prefix + "check") {

          if (event['d']['mentions'].length > 1) {
            functions.sendMessage(channelID, "<@" + userID + ">, You cannot check multiple users.", bot);
          } else {
            if (event['d']['mentions'].length == 0) {
              pool.getConnection(function(err, connection) {
                connection.query("select * from  users where user_id = ? ", [userID], function(err, rows, fields) {
                  if (rows[0].owner == null) {
                    functions.sendMessage(channelID, "<@" + userID + ">, You don't have an owner.", bot);
                  } else {
                    functions.sendMessage(channelID, "<@" + userID + ">, Your owner is <@" + rows[0].owner + "> with a worth of **" + accounting.formatNumber(rows[0].worth, 0) + "**.", bot);
                  }
                });
                connection.release();
              });
            } else {
              pool.getConnection(function(err, connection) {
                connection.query("select * from  users where user_id = ? ", [event['d']['mentions'][0]['id']], function(err, rows, fields) {
                  if (rows[0].owner == null) {
                    functions.sendMessage(channelID, "<@" + event['d']['mentions'][0]['id'] + "> doesn't have an owner.", bot);
                  } else {
                    functions.sendMessage(channelID, "<@" + event['d']['mentions'][0]['id'] + ">s owner is <@" + rows[0].owner + "> with a worth of **" + accounting.formatNumber(rows[0].worth, 0) + "**.", bot);
                  }
                });
                connection.release();
              });
            }
          }
        }


        if (msg_split[0].toLowerCase() == prefix + "mug") {

          var allow = true;
          var self_mute = false;
          var outcome = '';


          if (event['d']['mentions'].length == 0) {
            outcome = 'You cannot mug air.';
            allow = false;
          }

          if (event['d']['mentions'].length > 1) {
            outcome = 'You cannot mug multiple users.';
            allow = false;
          }

          if (event['d']['mentions'][0] != undefined) {
            if (event['d']['mentions'][0]['id'] == userID) {
              outcome = "You cannot mug yourself.";
              allow = false;
            }
          }

          if (allow) {
            pool.getConnection(function(err, connection) {
              connection.query("select * from  users where user_id = ? ", [userID], function(err, rows, fields) {
                var possibility = Math.floor((1 / rows[0].chance_coef) * 100);
                var chance = Math.floor((Math.random() * 100) + 1);
                if (chance <= possibility) {
                  pool.getConnection(function(err, connection) {
                    connection.query("select * from  users where user_id = ? ", [event['d']['mentions'][0]['id']], function(err, rows, fields) {
                      var steal_money = Math.floor((Math.random() * 150) + 50);

                      functions.Update("Update users set points = points+'" + ((parseInt(rows[0].points) >= steal_money) ? steal_money : parseInt(rows[0].points)) + "' where user_id =  '" + userID + "' ", pool);
                      functions.Update("Update users set points = points-'" + ((parseInt(rows[0].points) >= steal_money) ? steal_money : parseInt(rows[0].points)) + "' where user_id =  '" + [event['d']['mentions'][0]['id']] + "' ", pool);
                      functions.Update("update users set chance_coef = chance_coef + 2 where user_id = '" + userID + "' ", pool);
                      functions.sendMessage(channelID, "<@" + userID + ">, You stole **" + steal_money + "** from <@" + [event['d']['mentions'][0]['id']] + ">.", bot);
                    });
                    connection.release();
                  });
                } else {
                  functions.Update("Update users set points = points+'" + ((parseInt(rows[0].points) >= 100) ? 100 : parseInt(rows[0].points)) + "' where user_id =  '" + userID + "' ", pool);
                  functions.Update("update users set chance_coef = chance_coef - '" + ((rows[0].chance_coef >= 4) ? 1 : 0) + "' where user_id = '" + userID + "' ", pool);
                  functions.sendMessage(channelID, "<@" + userID + ">, You got caught stealing so you paid **150** points to <@" + [event['d']['mentions'][0]['id']] + ">.", bot);
                }
              });
              connection.release();
            });
          } else {
            functions.sendMessage(channelID, "<@" + userID + ">, " + outcome, bot);
          }
        }


        if (msg_split[0].toLowerCase() == prefix + "queue") {

          pool.getConnection(function(err, connection) {
            connection.query("select * from queue", function(err, rows, fields) {
              var requests = rows;
              pool.getConnection(function(err, connection) {
                connection.query("select * from  users", function(err, rows, fields) {
                  outcome = "The requests are:\n";

                  for (var i = 0; i < requests.length; i++) {
                    var votes = 0;
                    for (var j = 0; j < rows.length; j++) {
                      if (requests[i].Request_ID == rows[j].Request_ID) {
                        votes++;
                      }
                    }
                      outcome += "**" + requests[i].request + "** (ID = **" + requests[i].Request_ID + "**) with a total of **" + votes + "** votes\n";
                  }
                  if (outcome == "The requests are:\n") {
                    outcome = "There are no requests.";
                  }
                  functions.sendMessage(channelID, outcome, bot);
                });
                connection.release();
              });


            });
            connection.release();
          });

        }


        if (msg_split[0].toLowerCase() == prefix + "vote") {
          var allow = true;
          var outcome = "";

          if (msg_split[1] == undefined) {
            functions.sendMessage(channelID, "<@" + userID + ">, You need to specify what you vote for.", bot);
            allow = false;
          } else if (isNaN(msg_split[1])) {
            functions.sendMessage(channelID, "<@" + userID + ">, You need to specify the ID of the thing you want to vote for.", bot);
            allow = false;
          }

          if (allow) {
            pool.getConnection(function(err, connection) {
              connection.query("select * from  queue where Request_ID = ?", [msg_split[1]], function(err, rows, fields) {
                if (rows[0] == undefined) {
                  outcome = "This request does not exist";
                } else {
                  outcome = "You casted your vote for **" + rows[0].request + "**.";
                  functions.Update("update users set Request_ID = '" + msg_split[1] + "' where user_id = '" + userID + "'", pool);
                }
                functions.sendMessage(channelID, "<@" + userID + ">, " + outcome, bot);
              });
              connection.release();
            });
          }
        }


        if (msg_split[0].toLowerCase() == prefix + "addrequest" && functions.hasPerms(event['d']['member']['roles'])) {
            var msg = message.replace(prefix + "addrequest ", "").toLowerCase();
            pool.getConnection(function(err, connection) {
              connection.query("select * from  queue where request = ?", [msg], function(err, rows, fields) {
                if (rows[0] == undefined) {
                  functions.Update("Insert ignore into queue (request) values ('" + msg + "')", pool);
                  functions.sendMessage(channelID, "**" + msg + "** was added as a request!", bot);
                } else {
                  functions.sendMessage(channelID, "That request already exists.", bot);
                }
              });
              connection.release();
            });
        }


        if (msg_split[0].toLowerCase() == prefix + "rmrequest" && functions.hasPerms(event['d']['member']['roles'])) {
          if (msg_split[1] == undefined) {
            functions.sendMessage(channelID, "Nothing asked to be removed.", bot);
          } else if (isNaN(msg_split[1])) {
            functions.sendMessage(channelID, "Need an ID to remove.", bot);
          } else {
            pool.getConnection(function(err, connection) {
              connection.query("select * from  queue where Request_ID = ?", [msg_split[1]], function(err, rows, fields) {
                if (rows[0] != undefined) {
                  functions.Update("delete from queue where Request_ID = '" + msg_split[1] + "'", pool);
                  functions.Update("update users set Request_ID = null where Request_ID = '" + msg_split[1] + "'", pool);
                  functions.sendMessage(channelID, "Request removed.", bot);
                } else {
                  functions.sendMessage(channelID, "There is no request with that ID.", bot);
                }
              });
              connection.release();
            });
          }
        }


        if (msg_split[0].toLowerCase() == prefix + "troll") {
          if (event['d']['mentions'].length == 0 || event['d']['mentions'].length > 1) {
            bot.deleteMessage({
              channelID: channelID,
              messageID: event['d']['id']
            });
            var max = Math.floor((Math.random() * 3) + 3);
            for (var i = 0; i < max; i++) {
              setTimeout(function(){
                functions.sendMessage(channelID, "<@" + userID + ">", bot);
              }, 1000 * i);
            }
          } else {
            bot.deleteMessage({
              channelID: channelID,
              messageID: event['d']['id']
            });
            var max = Math.floor((Math.random() * 3) + 3);
            for (var i = 0; i < max; i++) {
              setTimeout(function(){
                functions.sendMessage(channelID, "<@" + event['d']['mentions'][0]['id'] + ">", bot);
              }, 1000 * i);
            }
          }
        }


        if (msg_split.length == 1 && userID == bot.id && event['d']['mentions'].length == 1) {
          setTimeout(function(){
            bot.deleteMessage({
              channelID: channelID,
              messageID: event['d']['id']
            });
          }, 1000);
        }

        
        if (msg_split[0].toLowerCase() == prefix + "joke" && msg_split[1] == undefined) {
          var getRandomJoke = oneLinerJoke.getRandomJoke();
          functions.sendMessage(channelID, "<@" + userID + ">, " + getRandomJoke.body, bot);
        }


      }
    });
  connection.release();
  });
});
