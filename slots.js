var functions = require("./functions.js");
console.log("Slots - loaded.");
module.exports = {

          /**Checking if enough points**/
        main: function(userID, pool, bot, channelID) {
          pool.getConnection(function(err, connection) {
            connection.query("select * from users where user_id = ? ", [userID], function(err, rows, fields) {

                /**Enough points, we move on**/
                if (parseInt(rows[0].points) >= 250) {
                    functions.Update("update users set points = points-250 where user_id =  '" + userID + "' ", pool);


                    var signPossible = [":spades:", ":spades:", ":spades:", ":spades:",
                        ":clubs:", ":clubs:", ":clubs:", ":clubs:",
                        ":hearts:", ":hearts:", ":hearts:", ":hearts:",
                        ":diamonds:", ":diamonds:", ":diamonds:", ":diamonds:",
                        ":white_circle:", ":white_circle:", ":white_circle:", ":white_circle:",
                        ":black_circle:", ":black_circle:", ":black_circle:", ":black_circle:",
                        ":red_circle:", ":red_circle:", ":red_circle:", ":red_circle:",
                        ":large_blue_circle:", ":large_blue_circle:", ":large_blue_circle:", ":large_blue_circle:",
                        ":o:", ":o:",
                        ":x:", ":x:",
                        ":white_square_button:", ":white_square_button:",
                        ":black_square_button:", ":black_square_button:",
                        ":100:"
                    ];

                    var leftSign = signPossible[Math.floor(Math.random() * signPossible.length)];
                    var middleSign = signPossible[Math.floor(Math.random() * signPossible.length)];
                    var rightSign = signPossible[Math.floor(Math.random() * signPossible.length)];
                    var outcome = "";


                    if (leftSign == middleSign && middleSign == rightSign) {

                        if (middleSign == ":spades:" || middleSign == ":clubs:" || middleSign == ":hearts:" || middleSign == ":diamonds:") {
                             functions.Update("update users set points = points + 10000 where user_id = '" + userID + "' ", pool);
                            outcome = "You got **10.000** points.";
                        }

                        if (middleSign == ":white_circle:" || middleSign == ":black_circle:" || middleSign == ":red_circle:" || middleSign == ":large_blue_circle:") {
                             functions.Update("update users set points = points + 10000 where user_id = '" + userID + "' ", pool);
                            outcome = "You got **10.000** points.";
                        }

                        if (middleSign == ":white_square_button:" || middleSign == ":x:" || middleSign == ":o:" || middleSign == ":black_square_button:") {
                             functions.Update("update users set points = points + 100000 where user_id = '" + userID + "' ", pool);
                            outcome = "You got **100.000** points.";

                        }

                        if (middleSign == ":100:") {
                             functions.Update("update users set points = points + 1000000 where user_id = '" + userID + "' ", pool);
                            outcome = "**POG** You got **1.000.000** points!";

                        }

                    } else if ((middleSign == leftSign) || (middleSign == rightSign)) {

                        if (middleSign == ":spades:" || middleSign == ":clubs:" || middleSign == ":hearts:" || middleSign == ":diamonds:") {
                             functions.Update("update users set points = points + 500 where user_id = '" + userID + "' ", pool);
                            outcome = "You got **500** points.";

                        }

                        if (middleSign == ":white_circle:" || middleSign == ":black_circle:" || middleSign == ":red_circle:" || middleSign == ":large_blue_circle:") {
                             functions.Update("update users set points = points + 500 where user_id = '" + userID + "' ", pool);
                            outcome = "You got **500** points.";

                        }

                        if (middleSign == ":white_square_button:" || middleSign == ":x:" || middleSign == ":o:" || middleSign == ":black_square_button:") {
                             functions.Update("update users set points = points + 5000 where user_id = '" + userID + "' ", pool);
                            outcome = "You got **5.000** points.";

                        }

                        if (middleSign == ":100:") {
                             functions.Update("update users set points = points + 50000 where user_id = '" + userID + "' ", pool);
                            outcome = "You got **50.000** points.";

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
    }
