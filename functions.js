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

  sendMessage: function(channelID, message, bot) {
    bot.sendMessage({
      to: channelID,
      message: message
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
    if (int % 1 == 0) {
      return false;
    }
    return true;

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


  hasPerms: function(roles) {
    var permRoles = ['' /*owner*/, '' /*Enforcer*/, '' /*Minions*/];
    for (var i = 0; i < roles.length; i++) {
      for (var j = 0; j < permRoles.length; j++) {
        if (roles[i] == permRoles[j]) {
          return true;
        }
      }
    }
    return false;
  },




}
