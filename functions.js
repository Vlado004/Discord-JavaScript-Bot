module.exports = {


  Update: function(sql, pool) {
    //  console.log("Q:"+sql);
    pool.getConnection(function(err, connection) {
      connection.query(sql, function(err, rows, fields) {


        if (err != null) {
          console.log(err);
        }


      });
      connection.release();
    });
  },


  rpcForFood: function(food, rpc, startTimestamp) {

    var date = new Date;
    var hour = date.getHours();

    if (hour < 5 || hour >= 21) {
      var key = "Midnight Snack";
    }
    else if (hour < 10) {
      var key = "Breakfast";
    }
    else if (hour < 14) {
      var key = "Lunch";
    }
    else if (hour < 19) {
      var key = "Snacks/Sweets";
    }
    else if (hour < 21) {
      var key = "Dinner";
    }
    var foodReturn = food[key][Math.floor(Math.random() * food[key].length)];
    largeImageKey = foodReturn.toLowerCase().split(" ").join("");
    console.log("The hour is: " + hour + " and food is: " + foodReturn);


    rpc.setActivity({
      details: foodReturn,
      state: key,
      startTimestamp,
      largeImageKey,
      smallImageKey: 'general',
      instance: false
    });

  },

  objToString: function(obj) {
    var str = '';
    for (var p in obj) {
      if (obj.hasOwnProperty(p)) {
        str += "'" + obj[p] + "',";



      }
    }
    return str.replace(/,\s*$/, "");
  },

  UpdateFix: function(sql, input_vars, pool) {

    pool.getConnection(function(err, connection) {


      var post = input_vars;
      var query = connection.query(sql, post, function(error, results, fields) {
        if (error) throw error;
        // Neat!
      });
      console.log(query.sql);

      connection.release();
    });
  },




  UserCheck: function(needle, haystack) {

    if (needle === haystack) {
      return true;
    } else {
      return false;
    }

  },

  isDecimal: function(int) {
    if (int % 1 != 0) {
      return false;
    } else {
      return true;
    }

  },

  isNegative: function(int) {
    if (int < 0) {
      return true;
    } else {
      return false;
    }
  },


  sendMessage: function(channelID, message, bot) {
    // console.log("M"+message);
    bot.sendMessage({
      to: channelID,
      message: message
    });
  },

  hasPerms: function(role, perm, client) {



    try {



      if (!role) {
        role = '289347895789345997893457893';
      }


      if (role == undefined) {
        return false;
      } else {

        var perm_ladder = {


          '238950238373543936': {
            permissions: ['ship_admin']
          },

          '237867854094008320': {
            permissions: ['ship_admin']
          },

          '237867854094008320': {
            permissions: ['ship_admin']
          }



        }


        if (perm_ladder[role] != undefined) {

          if (perm_ladder[role]['permission'].indexOf(perm) > -1) {
            return true;
          } else {
            return false;
          }


        } else {
          return false;
        }

      }

    } catch (e) {
      console.log("error caught");
      console.log(e);


    }

  },




}
