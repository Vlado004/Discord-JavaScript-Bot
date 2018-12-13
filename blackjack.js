console.log("Blackjack - loaded");

bot.on('message', function(user, userID, channelID, message, event) {
    var msg_split = message.split(" ");


    /** Start of blackJack**/
    if (msg_split[0].toLowerCase() == '+bj') {

        if (msg_split[1] == undefined) {
            functions.sendMessage(channelID, 'Command list for **BlackJack** :\n' +
                '**+bj create <Value of points you want to gamble>** - Create a table.\n' +
                '**+bj hit** - Get another card.\n' +
                '**+bj stand** - Stop on your curret card.', bot);
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
                            if (!functions.isDecimal(wager)) {
                                allow_continue = false;
                                outcome = "you cannot wage a decimal value.";
                            }

                            /**Checking if wage is negative**/
                            if (functions.isNegative(wager)) {
                                allow_continue = false;
                                outcome = "you cannot wage a negative value.";
                            }

                            /**Checking if wage is bigger than min wage**/
                            if (wager < 20) {
                                allow_continue = false;
                                outcome = "minimum buy in is 20 points.";
                            }

                            /**Checking if wage specified**/
                            if (wager == undefined) {
                                allow_continue = false;
                                outcome = "you need to specify a wage."
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

                var DealerHand = Math.floor((Math.random() * 13) + 1);
                var DealerNewhand = 0;
                var DealerStand = 0;
                var cardNames = ["", "Ace", "", "", "", "", "", "", "", "", "", "Joker", "Queen", "King"];
                var outcomemessage = "<@" + userID + ">, you **stood**.\n";
                var winstate = 0;

                pool.getConnection(function(err, connection) {
                    connection.query("select * from bj_table where user_id = ? ", [userID], function(err, rows, fields) {

                        if (rows[0] == undefined) {
                            //user hasnt entered a table - show a nein
                            functions.sendMessage(channelID, "<@" + userID + ">, you haven't joined a table yet.", bot);

                        } else {
                            var CurrentUserHand = rows[0].hand;
                            var CurrentDealerHand = rows[0].dealers_hand;
                            var winning_pot = Math.floor(parseInt(rows[0].current_pot) * 1.3);


                            if (CurrentDealerHand > 18) {
                                var DealerStand = Math.floor((Math.random() * 2) + 1);
                                if (DealerStand == 1) {

                                    outcomemessage += "<@" + userID + ">, your Dealer **stood** ";

                                    if (CurrentDealerHand > CurrentUserHand) {
                                        outcomemessage += "and your dealer has a greater value than you (**" + CurrentDealerHand + "** > **" + CurrentUserHand + "**). You **lose**.";
                                        winstate = 1;
                                    } else if (CurrentDealerHand < CurrentUserHand) {
                                        /** your hand is bigger **/
                                        outcomemessage += "and you have a greater value than your dealer (**" + CurrentUserHand + "** > **" + CurrentDealerHand + "**). You **win**.";
                                        winstate = 2;
                                    } else {
                                        /* it's a draw*/
                                        outcomemessage += "and you have the same value as your dealer (**" + CurrentUserHand + "**). It's a **tie**.";
                                        winstate = 3;
                                    }

                                } else {

                                    if (DealerHand == 1) {

                                        if (CurrentDealerHand < 10) {
                                            DealerNewhand = CurrentDealerHand + 11;
                                            outcomemessage += 'Your dealer got an Ace! He took the value of 11. His new value is **' + DealerNewhand + '**';
                                            functions.Update("update bj_table set dealers_hand = dealers_hand+11 where user_id =  '" + userID + "' ", pool);
                                        }

                                        if (CurrentDealerHand > 10) {
                                            DealerNewhand = CurrentDealerHand + 1;
                                            outcomemessage += 'Your dealer got an Ace! He took the value of 1. His new value is **' + DealerNewhand + '**';
                                            functions.Update("update bj_table set dealers_hand = dealers_hand+1 where user_id = '" + userID + "' ", pool);
                                        }

                                        if (CurrentDealerHand == 10) {
                                            outcomemessage += 'Your dealer got an Ace! He took the value of 11 and won with a BlackJack, you **lose**';
                                            winstate = 1;
                                        }

                                        if (CurrentDealerHand == 20) {
                                            outcomemessage += 'Your dealer got an Ace! He took the value of 1 and won with a BlackJack, you **lose**';
                                            winstate = 1;
                                        }

                                    } else {

                                        var new_value = (DealerHand > 10) ? 10 : DealerHand;
                                        var valid_name = (cardNames[DealerHand].length > 1) ? cardNames[DealerHand] : DealerHand;
                                        DealerNewhand = CurrentDealerHand + new_value;
                                        if (DealerNewhand <= 21) {
                                            if (DealerNewhand > CurrentUserHand) {
                                                outcomemessage += "Your Dealer got a **" + valid_name + "** and he has a greater value than you (**" + DealerNewhand + "** > **" + CurrentUserHand + "**). You **lose**.";
                                                winstate = 1;
                                            }
                                            if (DealerNewhand < CurrentUserHand) {
                                                outcomemessage += "Your Dealer got a **" + valid_name + "** and you have a greater value than him (**" + CurrentUserHand + "** > **" + DealerNewhand + "**). You **win**.";
                                                winstate = 2;
                                            }

                                        } else {
                                            /** dealer is bust **/
                                            outcomemessage += "Your Dealer Busted with a value of **" + DealerNewhand + "**. You **win**. ";
                                            winstate = 2;
                                        }

                                    }

                                }

                            } else {


                                if (DealerHand == 1) {

                                    if (CurrentDealerHand < 10) {
                                        DealerNewhand = CurrentDealerHand + 11;
                                        outcomemessage += 'Your dealer got an Ace! He took the value of 11. His new value is **' + DealerNewhand + '**';
                                        functions.Update("update bj_table set dealers_hand = dealers_hand+11 where user_id =  '" + userID + "' ", pool);
                                    }

                                    if (CurrentDealerHand > 10) {
                                        DealerNewhand = CurrentDealerHand + 1;
                                        outcomemessage += 'Your dealer got an Ace! He took the value of 1. His new value is **' + DealerNewhand + '**';
                                        functions.Update("update bj_table set dealers_hand = dealers_hand+1 where user_id = '" + userID + "' ", pool);
                                    }

                                    if (CurrentDealerHand == 10) {
                                        outcomemessage += 'Your dealer got an Ace! He took the value of 11 and won with a BlackJack, you **lose**';
                                        winstate = 1;
                                    }

                                    if (CurrentDealerHand == 20) {
                                        outcomemessage += 'Your dealer got an Ace! He took the value of 1 and won with a BlackJack, you **lose**';
                                        winstate = 1;
                                    }

                                } else {

                                    var new_value = (DealerHand > 10) ? 10 : DealerHand;
                                    var valid_name = (cardNames[DealerHand].length > 1) ? cardNames[DealerHand] : DealerHand;
                                    DealerNewhand = CurrentDealerHand + new_value;
                                    if (DealerNewhand <= 21) {
                                        if (DealerNewhand > CurrentUserHand) {
                                            outcomemessage += "Your Dealer got a **" + valid_name + "** and he has a greater value than you (**" + DealerNewhand + "** > **" + CurrentUserHand + "**). You **lose**.";
                                            winstate = 1;
                                        }
                                        if (DealerNewhand < CurrentUserHand) {
                                            outcomemessage += "Your Dealer got a **" + valid_name + "** and you have a greater value than him (**" + CurrentUserHand + "** > **" + DealerNewhand + "**). You **win**.";
                                            winstate = 2;
                                        }

                                    } else {
                                        /** dealer is bust **/
                                        outcomemessage += "Your Dealer Busted with a value of **" + DealerNewhand + "**. You **win**. ";
                                        winstate = 2;
                                    }

                                }

                            }

                        }

                        functions.sendMessage(channelID, outcomemessage, bot);

                        console.log(("Your winstate is: " + winstate));

                        if (winstate == 1) {
                            /*Lose*/
                            functions.Update("delete from bj_table where user_id = '" + userID + "'", pool);
                        } else if (winstate == 2) {
                            /*Win*/
                            functions.Update("update users set points = points +'" + winning_pot + "' where user_id = '" + userID + "' ", pool);
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
                var cardNames = ["", "Ace", "", "", "", "", "", "", "", "", "", "Joker", "Queen", "King"];
                var DealerNewhand = 0;
                var UserNewhand = 0;
                var outcomemessage = '';
                var DealerStandChance = 0;
                var winstate = 0;

                pool.getConnection(function(err, connection) {
                    connection.query("select * from bj_table where user_id = ? ", [userID], function(err, rows, fields) {

                        if (rows[0] == undefined) {
                            //user hasnt entered a table - show a nein
                            functions.sendMessage(channelID, "<@" + userID + "> , you haven't joined a table yet.", bot);
                        } else {

                            var CurrentUserHand = rows[0].hand;
                            var CurrentDealerHand = rows[0].dealers_hand;
                            var winning_pot = Math.floor(parseInt(rows[0].current_pot) * 1.3);


                            if (DealerHand == 1) {
                                DealerNewhand = DealerHand + CurrentDealerHand;

                                if (CurrentDealerHand < 10) {
                                    DealerNewhand = CurrentDealerHand + 11;
                                    outcomemessage += '<@' + userID + '>, your dealer got an **Ace**! He took the value of 11. His new value is **' + DealerNewhand + '**';
                                    functions.Update("update bj_table set dealers_hand = dealers_hand+11 where user_id =  '" + userID + "' ", pool);

                                } else if (CurrentDealerHand == 10) {
                                    outcomemessage += '<@' + userID + '>, your dealer got an **Ace**! He took the value of 11 and won with a BlackJack, you **lose**.';
                                    winstate = 1;

                                } else if (CurrentDealerHand > 10 && CurrentDealerHand < 20) {
                                    DealerNewhand = CurrentDealerHand + 1;
                                    outcomemessage += '<@' + userID + '>, your dealer got an **Ace**! He took the value of 1. His new value is **' + DealerNewhand + '**';
                                    functions.Update("update bj_table set dealers_hand = dealers_hand+1 where user_id =  '" + userID + "' ", pool);

                                } else if (CurrentDealerHand == 20) {
                                    outcomemessage += "<@" + userID + ">, your dealer got an **Ace**! He took the value of 1 and won with a BlackJack, you **lose**.";
                                    winstate = 1;

                                }

                            } else {

                                if (DealerHand >= 19 && winstate == 0) {
                                    DealerStandChance = 1;

                                } else if (DealerHand >= 17 && winstate == 0) {

                                    if (CurrentUserHand <= 8) {
                                        DealerStandChance = 1;

                                    } else {
                                        DealerStandChance = Math.floor((Math.random() * 2) + 1);

                                    }

                                }

                                if (winstate == 0) {

                                    if (DealerStandChance == 1) {

                                        outcomemessage += "Your Dealer stood with a value of **" + DealerHand + "**.";

                                    } else {

                                        var new_value = (DealerHand > 10) ? 10 : DealerHand;
                                        var valid_name = (cardNames[DealerHand].length > 1) ? cardNames[DealerHand] : DealerHand;
                                        DealerNewhand = CurrentDealerHand + new_value;

                                        if (DealerNewhand < 21) {
                                            /**You continue**/
                                            outcomemessage += "<@" + userID + ">, your Dealer got a **" + valid_name + "**. His new value is **" + DealerNewhand + "**";
                                            functions.Update("update bj_table set dealers_hand = '" + DealerNewhand + "' where user_id =  '" + userID + "' ", pool);
                                        } else if (DealerNewhand == 21) {
                                            /**Dealer BlackJack**/
                                            outcomemessage += "<@" + userID + ">, your Dealer got a **" + valid_name + "** and won with a BlackJack, you **lose**";
                                            winstate = 1
                                        } else if (DealerNewhand > 21) {
                                            //* dealer are bust **/
                                            outcomemessage += "<@" + userID + ">, your Dealer Busted with a value of **" + DealerNewhand + "**, you **win**. ";
                                            winstate = 2
                                        }

                                    }

                                }

                            }

                            if (winstate != 0) {

                            } else {
                                outcomemessage += "\n";

                                if (UserCard == 1) {

                                    if (CurrentUserHand <= 9) {
                                        outcomemessage += 'You got an **' + cardNames[1] + '**! Choose whether you want the gained value to be **1** or **11** with **"+bj 1"** or **"+bj 11"**.';
                                        functions.Update("update bj_table set ace_pending = 1 where user_id =  '" + userID + "' ", pool);

                                    } else if (CurrentUserHand == 10) {
                                        outcomemessage += 'You got an **' + cardNames[1] + '**! You gained the value of 11 and **won** with a BlackJack.';
                                        winstate = 2

                                    } else if (CurrentUserHand > 10 && CurrentUserHand < 20) {
                                        newhand = CurrentUserHand + 1;
                                        outcomemessage += "You got an **" + cardNames[1] + "**! You gained the value of 1. Your new value is **" + newhand + "**";
                                        functions.Update("update bj_table set hand = hand+1 where user_id =  '" + userID + "' ", pool);

                                    } else if (CurrentUserHand == 20) {
                                        outcomemessage += 'You got an **' + cardNames[1] + '**! You gained the value of 1 and **won** with a BlackJack.';
                                        winstate = 2
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
                                        outcomemessage += "You got a **" + valid_name + "** and you **won** with a BlackJack";
                                        winstate = 2
                                    } else if (UserNewhand > 21) {
                                        /**Busted**/
                                        outcomemessage += "You Busted with a value of **" + UserNewhand + "**, you **lose**. ";
                                        winstate = 1
                                    }

                                }

                                if (winstate != 0) {

                                } else {

                                    if (DealerStandChance == 1) {

                                        if (DealerNewhand > UserNewhand) {
                                            outcomemessage += " and your dealer has a greater value than you (**" + DealerNewhand + "** > **" + UserNewhand + "**). You **lose**.";
                                            winstate = 1;
                                        } else if (DealerNewhand < UserNewhand) {
                                            /** your hand is bigger **/
                                            outcomemessage += " and you have a greater value than your dealer (**" + UserNewhand + "** > **" + DealerNewhand + "**). You **win**.";
                                            winstate = 2;
                                        } else {
                                            /* it's a draw*/
                                            outcomemessage += " and you have the same value as your dealer (**" + UserNewhand + "**). It's a **tie**.";
                                            winstate = 3;
                                        }

                                    }

                                }

                            }

                            functions.sendMessage(channelID, outcomemessage, bot);

                            console.log(("Your winstate is: " + winstate));

                            if (winstate == 1) {
                                /*Lose*/
                                functions.Update("delete from bj_table where user_id = '" + userID + "'", pool);
                            } else if (winstate == 2) {
                                /*Win*/
                                functions.Update("update users set points = points +'" + winning_pot + "' where user_id = '" + userID + "' ", pool);
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

    }

});
