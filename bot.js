var Discord = require("discord.io");
var logger = require("winston");
var auth = require("./auth.json");
// Configure logger settings
logger.remove(logger.transports.Console);
logger.add(new logger.transports.Console, {
    colorize: true
});
logger.level = "debug";
// Initialize Discord Bot
var bot = new Discord.Client({
   token: auth.token,
   autorun: true
});
bot.on("ready", function (evt) {
    logger.info("Connected");
    logger.info("Logged in as: ");
    logger.info(bot.username + " - (" + bot.id + ")");
});

// Initialize variables: admins, playerUsername, playerPoints
// Change tournamentName and admins for each tournament
// Magikarp: 122099645919789056
var admins = [122099645919789056];
var tournamentName = "Rocket League Switch Showdown!";
var playerUsername = [];
var playerPoints = [];

bot.on("message", function (user, userID, channelID, message, evt) {
    // Bot will listen for messages that will start with "!"
    if (message.substring(0, 1) == "!") {
        var args = message.substring(1).split(" ");
        var cmd = args[0];
        var input1 = args[1];
        var input2 = args[2];

        switch(cmd) {
            // Display all commands
            case "commands":
                bot.sendMessage({
                    to: channelID,
                    message: "To open this help menu: !commands\nTo participate in the tournament, please create a user using: !user-create _yourUsername_\nTo check your own status: !user\nTo check the status of the tournament: !tournament-status\nTo add a point for yourself: !plus\nTo subtract a point from yourself (in case of a mistake): !minus\n\nAdmin Commands:\nSet a players point: !set _userName_ _Integer_"
                });
                break;
            // Create a new user for the tournament
            case "user-create":
                if(playerUsername[userID] == null){
                    playerUsername[userID] = input1;
                    playerPoints[userID] = 0;
                    bot.sendMessage({
                        to: channelID,
                        message: "New Participant has joined the tournament!" + "\nYou are: " + playerUsername[userID] + "\nYou currently have " + playerPoints[userID] + " point(s)"
                    });
                } else{
                    bot.sendMessage({
                        to: channelID,
                        message: "You are already a participant of this tournament. Please use \"!user\" to display your current status."
                    });
                }

                break;
            // Display current user status
            case "user":
                if(playerUsername[userID] != null){
                    bot.sendMessage({
                        to: channelID,
                        message: "You are: " + playerUsername[userID] + "\nYou currently have " + playerPoints[userID] + " point(s)"
                    });
                } else{
                    bot.sendMessage({
                        to: channelID,
                        message: "You are not a participant of this tournament yet. Please use \"!user-create _yourUsername_\" to become a participant of this tournament!"
                    });
                }

                break;
            // Check tournament status
            case "tournament-status":
                var statusStr = "";
                for(i = 0; i < Object.size(playerUsername); i++){
                    statusStr += "\n" + Object.values(playerUsername)[i] + ": " + playerPoints[Object.keys(playerUsername)[i]];
                }

                bot.sendMessage({
                    to: channelID,
                    message: tournamentName + "\nTotal Players in Tournament " + Object.size(playerUsername) + "\n\nStandings:" + statusStr
                });
                break;
            // Add point to current user
            case "plus":
                playerPoints[userID] += 1;
                bot.sendMessage({
                    to: channelID,
                    message: "You have gained a point! Your current point(s): " + playerPoints[userID]
                });
                break;
            // Subtrack point to current user
            case "minus":
                playerPoints[userID] -= 1;
                if(playerPoints[userID] < 0){
                    playerPoints[userID] = 0;
                }

                bot.sendMessage({
                    to: channelID,
                    message: "You lost a point (wut). Your current point(s): " + playerPoints[userID]
                });
                break;
            // Admin Command: set a users point to value
            case "set":
                if(!isAdmin(userID)){
                    bot.sendMessage({
                        to: channelID,
                        message: "You do not have permission to use this command."
                    });
                } else if(input1 == null || input2 == null){
                    bot.sendMessage({
                        to: channelID,
                        message: "Inputs must be: !set _Username_ _Integer_"
                    });
                } else{
                    for(i = 0; i < Object.size(playerUsername); i++){
                        if(Object.values(playerUsername)[i] == input1){
                            playerPoints[Object.keys(playerUsername)[i]] = input2;
                            bot.sendMessage({
                                to: channelID,
                                message: Object.values(playerUsername)[i] + "'s points have been set to " + playerPoints[Object.keys(playerUsername)[i]]
                            });
                        }
                    }
                }
                break;
            case "user-id":
                bot.sendMessage({
                    to: channelID,
                    message: userID
                });
                break;
         }
     }
});

function isAdmin(userID){
  for(i = 0; i < admins.length; i++){
    if(admins[i] == userID){
      return true;
    }
  }
  return false;
}

// Fisher-Yates Shuffle Method
function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

Object.size = function(obj) {
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};
