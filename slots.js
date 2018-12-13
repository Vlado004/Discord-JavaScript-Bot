console.log("Slots - loaded.");

bot.on('message', function(user, userID, channelID, message, event) {
    var msg_split = message.split(" ");



    if (msg_split[0].toLowerCase() == prefix + "slots") {


        /**Checking if enough points**/
        pool.getConnection(function(err, connection) {
            connection.query("select * from users where user_id = ? ", [userID], function(err, rows, fields) {

                /**Enough points, we move on**/
                if (parseInt(rows[0].points) >= 100) {
                    functions.Update("update users set points = points-100 where user_id =  '" + userID + "' ", pool);


                    var signPossible = [":spades:", ":spades:", ":spades:", ":spades:",
                        ":clubs:", ":clubs:", ":clubs:", ":clubs:",
                        ":hearts:", ":hearts:", ":hearts:", ":hearts:",
                        ":diamonds:", ":diamonds:", ":diamonds:", ":diamonds:",
                        ":large_orange_diamond:", ":large_orange_diamond:",
                        ":large_blue_diamond:", ":large_blue_diamond:",
                        ":100:"
                    ];

                    var leftSign = signPossible[Math.floor(Math.random() * signPossible.length)];
                    var middleSign = signPossible[Math.floor(Math.random() * signPossible.length)];
                    var rightSign = signPossible[Math.floor(Math.random() * signPossible.length)];
                    var outcome = "";


                    if (leftSign == middleSign && middleSign == rightSign) {

                        if (middleSign == ":spades:") {
                             functions.Update("update users set points = points + 250 where user_id = '" + userID + "' ", pool);
                            outcome = "You got 250 points.";

                        }

                        if (middleSign == ":clubs:") {
                             functions.Update("update users set points = points + 250 where user_id = '" + userID + "' ", pool);
                            outcome = "You got 250 points.";

                        }

                        if (middleSign == ":hearts:") {
                             functions.Update("update users set points = points + 250 where user_id = '" + userID + "' ", pool);
                            outcome = "You got 250 points.";

                        }

                        if (middleSign == ":diamonds:") {
                             functions.Update("update users set points = points + 250 where user_id = '" + userID + "' ", pool);
                            outcome = "You got 250 points.";

                        }

                        if (middleSign == ":large_orange_diamond:") {
                             functions.Update("update users set points = points + 500 where user_id = '" + userID + "' ", pool);
                            outcome = "You got 500 points.";

                        }

                        if (middleSign == ":large_blue_diamond:") {
                             functions.Update("update users set points = points + 500 where user_id = '" + userID + "' ", pool);
                            outcome = "You got 500 points.";

                        }

                        if (middleSign == ":100:") {
                             functions.Update("update users set points = points + 1000 where user_id = '" + userID + "' ", pool);
                            outcome = "You got 1000 points.";

                        }

                    } else if ((middleSign == leftSign) || (middleSign == rightSign)) {

                        if (middleSign == ":spades:") {
                             functions.Update("update users set points = points + 50 where user_id = '" + userID + "' ", pool);
                            outcome = "You got 50 points.";

                        }

                        if (middleSign == ":clubs:") {
                             functions.Update("update users set points = points + 50 where user_id = '" + userID + "' ", pool);
                            outcome = "You got 50 points.";

                        }

                        if (middleSign == ":hearts:") {
                             functions.Update("update users set points = points + 50 where user_id = '" + userID + "' ", pool);
                            outcome = "You got 50 points.";

                        }

                        if (middleSign == ":diamonds:") {
                             functions.Update("update users set points = points + 50 where user_id = '" + userID + "' ", pool);
                            outcome = "You got 50 points.";

                        }

                        if (middleSign == ":large_orange_diamond:") {
                             functions.Update("update users set points = points + 150 where user_id = '" + userID + "' ", pool);
                            outcome = "You got 150 points.";

                        }

                        if (middleSign == ":large_blue_diamond:") {
                             functions.Update("update users set points = points + 150 where user_id = '" + userID + "' ", pool);
                            outcome = "You got 150 points.";

                        }

                        if (middleSign == ":100:") {
                             functions.Update("update users set points = points + 250 where user_id = '" + userID + "' ", pool);
                            outcome = "You got 250 points.";

                        }

                    } else {

                        outcome = "You won nothing, more luck next time.";

                    }


                    functions.sendMessage(channelID, "<@" + userID + ">, you span the slots machine\n" +
                        leftSign + " " + middleSign + " " + rightSign + "\n" +
                        outcome, bot);



                    /**Not enough points**/
                } else {
                    functions.sendMessage(channelID, "<@" + userID + ">, you don't have enough points for this.", bot);

                }
            });
            connection.release();
        });

    }

});
