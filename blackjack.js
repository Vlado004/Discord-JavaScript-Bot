var functions = require("./functions.js");
console.log("BlackJack v4.1 - loaded.");
module.exports = {

    /** Start of blackJack**/
      main: function(msg_split, userID, pool, bot, channelID, prefix) {
        if (msg_split[1] == undefined) {
          functions.sendMessage(channelID, 'Command list for **BlackJack** :\n' +
              '**' + prefix + 'bj create <Value of points you want to gamble>** - Create a table.\n' +
              '**' + prefix + 'bj hit** - Get another card.\n' +
              '**' + prefix + 'bj stand** - Stop on your curret card.', bot);
        } else {

            /** BlackJack Ace value 1**/
            if (msg_split[1] == '1') {
                pool.getConnection(function(err, connection) {
                    connection.query("select * from bj_table where user_id ='" + userID + "' and ace_pending = 1", [userID], function(err, rows, fields) {
                        if (rows[0].ace_pending == 1) {
                            var CurrentUserHand = rows[0].hand;
                            CurrentUserHand = CurrentUserHand + 1;
                            functions.sendMessage(channelID, "<@" + userID + "> chose the value of **1**. Your new value is **" + CurrentUserHand + "**", bot);
                            functions.Update("update bj_table set ace_pending = 0, hand = hand+1 where user_id ='" + userID + "'", pool);
                        } else {
                            functions.sendMessage(channelID, "<@" + userID + "> , wrong time for this.", bot);
                        }
                    });
                    connection.release();
                });
            }

            /** BlackJack Ace value 11**/
            if (msg_split[1] == '11') {
                pool.getConnection(function(err, connection) {
                    connection.query("select * from bj_table where user_id ='" + userID + "' and ace_pending = 1", [userID], function(err, rows, fields) {
                        if (rows[0].ace_pending == 1) {
                            var CurrentUserHand = rows[0].hand;
                            CurrentUserHand = CurrentUserHand + 11;
                            functions.sendMessage(channelID, "<@" + userID + "> chose the value of **11**. Your new value is **" + CurrentUserHand + "**", bot);
                            functions.Update("update bj_table set ace_pending = 0, hand = hand+11 where user_id ='" + userID + "'", pool);
                        } else {
                            functions.sendMessage(channelID, "<@" + userID + "> , wrong time for this.", bot);
                        }
                    });
                    connection.release();
                });
            }

            /** BlackJack Creating a table**/
            if (msg_split[1].toLowerCase() == "create") {

                /**Checks**/
                pool.getConnection(function(err, connection) {
                    connection.query("select * from bj_table where user_id = ? ", [userID], function(err, rows, fields) {

                        /**Checking if you already are at a table**/
                        /**On a table**/
                        if (rows[0] != undefined) {
                            functions.sendMessage(channelID, "<@" + userID + "> , you already joined a table.", bot);

                            /**Not on a table**/
                        } else {

                            /**Wage specified, checking it**/
                            var wager = msg_split[2];
                            var allow_continue = true;
                            var outcome = '';

                            /**Checking if wage is decimal**/
                            if (functions.isDecimal(wager)) {
                                allow_continue = false;
                                outcome = "you cannot wage a decimal value.";
                            } else if (functions.isNegative(wager)) {
                                allow_continue = false;
                                outcome = "you cannot wage a negative value.";
                            } else if (wager < 20) {
                                allow_continue = false;
                                outcome = "minimum buy in is 20 points.";
                            } else if (wager > 100000) {
                              allow_continue = false;
                              outcome = "maximum buy in is 100.000 points.";
                            }

                            /**Checking if wage specified**/
                            if (wager == undefined) {
                                allow_continue = false;
                                outcome = "you need to specify a wage.";
                            } else if (isNaN(wager)) {
                              allow_continue = false;
                              outcome = "that is not a number.";
                            }

                            /**Everything gucchi, we move on**/
                            if (allow_continue == true) {

                                /**Checking if enough points**/
                                pool.getConnection(function(err, connection) {
                                    connection.query("select * from users where user_id = ? ", [userID], function(err, rows, fields) {

                                        /**Enough points, we move on**/
                                        if (parseInt(rows[0].points) >= parseInt(wager)) {
                                            functions.Update("update users set points = points-'" + wager + "' where user_id =  '" + userID + "' ", pool);
                                            functions.Update("insert ignore  into bj_table (user_id,current_pot) values ('" + userID + "','" + wager + "') ", pool);
                                            functions.sendMessage(channelID, "<@" + userID + ">, you joined a table.", bot);

                                            /**Not enough points**/
                                        } else {
                                            functions.sendMessage(channelID, "<@" + userID + ">, you don't have enough points for this.", bot);

                                        }
                                    });
                                    connection.release();
                                });

                                /**You failed the check**/
                            } else {
                                functions.sendMessage(channelID, "<@" + userID + ">, " + outcome, bot);
                            }
                        }
                    });
                    connection.release();
                });
            }

            /** BlackJack stand**/
            if (msg_split[1].toLowerCase() == "stand") {

                var cardNames = ["", "Ace", "", "", "", "", "", "", "", "", "", "Jack", "Queen", "King"];
                var outcomemessage = "<@" + userID + ">, you **stood**.\n";
                var winstate = 0;

                pool.getConnection(function(err, connection) {
                    connection.query("select * from bj_table where user_id = ? ", [userID], function(err, rows, fields) {

                        if (rows[0] == undefined) {
                            //user hasnt entered a table - show a nein
                            outcomemessage = "<@" + userID + ">, you haven't joined a table yet.";
                        } else if (rows[0].ace_pending) {
                            outcomemessage = '<@' + userID + '> , you still have to decide on the value of your ace with **"' + prefix + 'bj 1"** or **" ' + prefix + 'bj 11"**.';

                        } else {
                            var CurrentUserHand = rows[0].hand;
                            var CurrentDealerHand = rows[0].dealers_hand;

                            if (CurrentDealerHand > CurrentUserHand) {
                                winstate = -1;
                            }

                            while (CurrentDealerHand <= 16 && !winstate) {

                                var DealerHand = Math.floor((Math.random() * 13) + 1);
                                if (DealerHand == 1) {

                                    if (CurrentDealerHand < 10) {
                                        CurrentDealerHand = CurrentDealerHand + 11;
                                        if (CurrentDealerHand > CurrentUserHand) {
                                          winstate = -1;
                                        }
                                        outcomemessage += 'Your dealer got an Ace! He took the value of 11. His new value is **' + CurrentDealerHand + '**\n';
                                    }

                                    if (CurrentDealerHand == 10) {
                                        outcomemessage += 'Your dealer got an Ace! He took the value of 11 and won with a BlackJack. You **lose**';
                                        winstate = 1;
                                    }

                                    if (CurrentDealerHand > 10) {
                                        CurrentDealerHand = CurrentDealerHand + 1;
                                        if (CurrentDealerHand > CurrentUserHand) {
                                          winstate = -1;
                                        }
                                        outcomemessage += 'Your dealer got an Ace! He took the value of 1. His new value is **' + CurrentDealerHand + '**\n';
                                    }

                                } else {

                                    var new_value = (DealerHand > 10) ? 10 : DealerHand;
                                    var valid_name = (cardNames[DealerHand].length > 1) ? cardNames[DealerHand] : DealerHand;
                                    CurrentDealerHand = CurrentDealerHand + new_value;
                                    if (CurrentDealerHand > 21) {
                                      outcomemessage += "Your Dealer got a **" + valid_name + "** and busted with a value of **" + CurrentDealerHand + "**. You **win**. ";
                                      winstate = 2;
                                    } else if (CurrentDealerHand == 21) {
                                      outcomemessage += "Your Dealer got a **" + valid_name + "** and wins with a **BlackJack**. You **lose**.";
                                      winstate = 1;
                                    } else {
                                      if (CurrentDealerHand > CurrentUserHand) {
                                        winstate = -1;
                                      }
                                      outcomemessage += "Your Dealer got a **" + valid_name + "**. his new value is **" + CurrentDealerHand + "**.\n";
                                    }

                                }

                            }

                            if (winstate <= 0) {
                                outcomemessage += "Your Dealer **stood**.\n";
                                if (CurrentDealerHand > CurrentUserHand) {
                                    outcomemessage += "Your dealer has a greater value than you (**" + CurrentDealerHand + "** > **" + CurrentUserHand + "**). You **lose**.";
                                    winstate = 1;
                                } else if (CurrentDealerHand < CurrentUserHand) {
                                    /** your hand is bigger **/
                                    outcomemessage += "You have a greater value than your dealer (**" + CurrentUserHand + "** > **" + CurrentDealerHand + "**). You **win**.";
                                    winstate = 2;
                                } else {
                                    /* it's a draw*/
                                    outcomemessage += "You have the same value as your dealer (**" + CurrentUserHand + "**). It's a **tie**.";
                                    winstate = 3;
                                }

                            }

                        }

                        functions.sendMessage(channelID, outcomemessage, bot);

                        if (winstate == 1) {
                            /*Lose*/
                            functions.Update("delete from bj_table where user_id = '" + userID + "'", pool);
                        } else if (winstate == 2) {
                            /*Win*/
                            functions.Update("update users set points = points +'" +  Math.floor(parseInt(rows[0].current_pot) * 2) + "' where user_id = '" + userID + "' ", pool);
                            functions.Update("delete from bj_table where user_id = '" + userID + "'", pool);
                        } else if (winstate == 3) {
                            /*Tie*/
                            functions.Update("update users set points = points +'" + rows[0].current_pot + "' where user_id = '" + userID + "' ", pool);
                            functions.Update("delete from bj_table where user_id = '" + userID + "'", pool);
                        }

                    });
                    connection.release();
                });

            }

            /** BlackJack hit**/
            if (msg_split[1].toLowerCase() == "hit") {

                var DealerHand = Math.floor((Math.random() * 13) + 1);
                var UserCard = Math.floor((Math.random() * 13) + 1);
                var cardNames = ["", "Ace", "", "", "", "", "", "", "", "", "", "Jack", "Queen", "King"];
                var DealerNewhand = 0;
                var UserNewhand = 0;
                var outcomemessage = '<@' + userID + '>, ';
                var DealerStandChance = 0;
                var winstate = 0;

                pool.getConnection(function(err, connection) {
                    connection.query("select * from bj_table where user_id = ? ", [userID], function(err, rows, fields) {

                        if (rows[0] == undefined) {
                            //user hasnt entered a table - show a nein
                            functions.sendMessage(channelID, "<@" + userID + "> , you haven't joined a table yet.", bot);
                        } else if (rows[0].ace_pending) {
                            functions.sendMessage(channelID, '<@' + userID + '> , you still have to decide on the value of your ace with **"' + prefix + 'bj 1"** or **" ' + prefix + 'bj 11"**.', bot);
                        } else {

                            var CurrentUserHand = rows[0].hand;
                            var CurrentDealerHand = rows[0].dealers_hand;

                            if (UserCard == 1) {

                                if (CurrentUserHand <= 9) {
                                    outcomemessage += 'You got an **' + cardNames[1] + '**! Choose whether you want the gained value to be **1** or **11** with **"' + prefix + 'bj 1"** or **"' + prefix + 'bj 11"**.';
                                    functions.Update("update bj_table set ace_pending = 1 where user_id =  '" + userID + "' ", pool);

                                } else if (CurrentUserHand == 10) {
                                    outcomemessage += 'You got an **' + cardNames[1] + '**! You gained the value of 11 and **won** with a BlackJack.';
                                    winstate = -1

                                } else if (CurrentUserHand > 10 && CurrentUserHand < 20) {
                                    newhand = CurrentUserHand + 1;
                                    outcomemessage += "You got an **" + cardNames[1] + "**! You gained the value of 1. Your new value is **" + newhand + "**";
                                    functions.Update("update bj_table set hand = hand+1 where user_id =  '" + userID + "' ", pool);

                                } else if (CurrentUserHand == 20) {
                                    outcomemessage += 'You got an **' + cardNames[1] + '**! You gained the value of 1 and **won** with a BlackJack.';
                                    winstate = -1
                                }

                            } else {

                                var new_value = (UserCard > 10) ? 10 : UserCard;
                                var valid_name = (cardNames[UserCard].length > 1) ? cardNames[UserCard] : UserCard;
                                UserNewhand = CurrentUserHand + new_value;


                                if (UserNewhand < 21) {
                                    /**You continue**/
                                    outcomemessage += "You got a **" + valid_name + "**. Your new value is **" + UserNewhand + "**";
                                    functions.Update("update bj_table set hand = '" + UserNewhand + "' where user_id =  '" + userID + "' ", pool);
                                } else if (UserNewhand == 21) {
                                    /**BlackJack**/
                                    outcomemessage += "You got a **" + valid_name + "**. You **won** with a BlackJack"; //TEXT
                                    winstate = -1
                                } else if (UserNewhand > 21) {
                                    /**Busted**/
                                    outcomemessage += "You Busted with a value of **" + UserNewhand + "**. You **lose**. ";
                                    winstate = 1
                                }

                            }

                            if (winstate <= 0) {
                                outcomemessage += "\n";

                                if (CurrentDealerHand > 16) {
                                      outcomemessage += "Your Dealer stood with a value of **" + CurrentDealerHand + "**.";

                                } else {

                                  if (DealerHand == 1) {
                                      DealerNewhand = DealerHand + CurrentDealerHand;

                                      if (CurrentDealerHand < 10) {
                                          DealerNewhand = CurrentDealerHand + 11;
                                          outcomemessage += 'Your dealer got an **Ace**! He took the value of 11. His new value is **' + DealerNewhand + '**';
                                          functions.Update("update bj_table set dealers_hand = dealers_hand+11 where user_id =  '" + userID + "' ", pool);

                                      } else if (CurrentDealerHand == 10) {

                                        if (winstate == -1) {
                                            outcomemessage += "Your dealer got an **Ace**! He took the value of 11 and also got a BlackJack, looks like it's a **tie**.";
                                          winstate = 3;
                                        } else {
                                            outcomemessage += 'Your dealer got an **Ace**! He took the value of 11 and won with a BlackJack. You **lose**.';
                                            winstate = 1;
                                        }

                                      } else if (CurrentDealerHand > 10) {
                                          DealerNewhand = CurrentDealerHand + 1;
                                          outcomemessage += 'Your dealer got an **Ace**! He took the value of 1. His new value is **' + DealerNewhand + '**';
                                          functions.Update("update bj_table set dealers_hand = dealers_hand+1 where user_id =  '" + userID + "' ", pool);
                                      }
                                  } else {

                                      var new_value = (DealerHand > 10) ? 10 : DealerHand;
                                      var valid_name = (cardNames[DealerHand].length > 1) ? cardNames[DealerHand] : DealerHand;
                                      DealerNewhand = CurrentDealerHand + new_value;

                                      if (DealerNewhand < 21) {
                                          /**You continue**/
                                          outcomemessage += "Your Dealer got a **" + valid_name + "**. His new value is **" + DealerNewhand + "**";
                                          functions.Update("update bj_table set dealers_hand = '" + DealerNewhand + "' where user_id =  '" + userID + "' ", pool);
                                      } else if (DealerNewhand == 21) {
                                          /**Dealer BlackJack**/

                                          if (winstate == -1) {
                                              outcomemessage += "Your dealer got a **" + valid_name + "** and also got a BlackJack, looks like it's a **tie**.";
                                              winstate = 3;
                                          } else {
                                              outcomemessage += "Your Dealer got a **" + valid_name + "** and won with a BlackJack. You **lose**";
                                              winstate = 1;
                                          }

                                      } else if (DealerNewhand > 21) {
                                          /** dealer is bust **/
                                          if (winstate == -1) {
                                              outcomemessage += "Your Dealer Busted with a value of **" + DealerNewhand + "**.";
                                          } else {
                                              outcomemessage += "Your Dealer Busted with a value of **" + DealerNewhand + "**. You **win**.";
                                              winstate = 2
                                          }
                                      }
                                    }
                                  }
                                }

                                if (winstate == 0) {

                                    if (CurrentDealerHand > 16) {

                                        if (CurrentDealerHand < UserNewhand) {
                                            /** your hand is bigger **/
                                            outcomemessage += "\nYou have a greater value than your dealer (**" + UserNewhand + "** > **" + CurrentDealerHand + "**). You **win**.";
                                            winstate = 2;
                                        }

                                    }

                                }



                            functions.sendMessage(channelID, outcomemessage, bot);

                            if (winstate == 1) {
                                /*Lose*/
                                functions.Update("delete from bj_table where user_id = '" + userID + "'", pool);
                            } else if (winstate == 2) {
                                /*Win*/
                                functions.Update("update users set points = points +'" +  Math.floor(parseInt(rows[0].current_pot) * 2) + "' where user_id = '" + userID + "' ", pool);
                                functions.Update("delete from bj_table where user_id = '" + userID + "'", pool);
                            } else if (winstate == -1) {
                                /*BJ win*/
                                functions.Update("update users set points = points +'" +  Math.floor(parseInt(rows[0].current_pot) * 2.5) + "' where user_id = '" + userID + "' ", pool);
                                functions.Update("delete from bj_table where user_id = '" + userID + "'", pool);
                            } else if (winstate == 3) {
                                /*Tie*/
                                functions.Update("update users set points = points +'" + rows[0].current_pot + "' where user_id = '" + userID + "' ", pool);
                                functions.Update("delete from bj_table where user_id = '" + userID + "'", pool);
                            }

                        }

                    });
                    connection.release();
                });

            }
        }
    },

  }
