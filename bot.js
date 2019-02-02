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
// For each tournament, change tournamentName, teamSize, and (maybe) admins
// Magikarp: 122099645919789056, Axxxx: 482996996203085855, Ninja: 412703274165207041, Shadow: 267757061201199104, Alley: 461702728926625832
// var admins = [122099645919789056, 482996996203085855, 412703274165207041, 267757061201199104, 461702728926625832];
var admins = [122099645919789056];
var tournamentName = "Rocket League Switch Showdown!";
var teamSize = 3;
var playerUsername = [];
var playerPoints = [];
var tstatus = "Open Registration";
var teams = [];
var noTeams = [];
var teamMatchUp = [];

bot.on("message", function (user, userID, channelID, message, evt) {
    // Bot will listen for messages that will start with "!"
    if (message.substring(0, 1) == "!") {
        var args = message.substring(1).split(" ");
        var cmd = args[0];
        var input1 = args[1];
        var input2 = args[2];

        switch(cmd) {
            case "add":
                  for(i = 0; i < 16; i++){
                    playerUsername[i] = "Player " + i;
                    playerPoints[playerUsername[i]] = 0;
                  }

                  break;
            // Display all commands
            case "commands":
                bot.sendMessage({
                    to: channelID,
                    message: "To open this help menu: !commands\nTo participate in the tournament, please create a user using: !user-create _yourUsername_\nTo check your own status: !user\nTo check the status of the tournament: !tournament-status\nTo check the current teams: !team-status\nTo self-record a team win: !team-win\n\nAdmin Commands:\nSet a players point: !set _username_ _integer_\nTo start a tournament: !tournament-start\nTo create new match-ups: !new-games\nTo delete a participant: !delete _username_\nTo disband a team: !disband _teamRow_ _teamColumn_"
                });
                break;
            // Create a new user for the tournament
            case "user-create":
                if(playerUsername[userID] != null){
                    bot.sendMessage({
                        to: channelID,
                        message: "You are already a participant of this tournament. Please use \"!user\" to display your current status."
                    });
                } else if(input1 in playerUsername){
                    bot.sendMessage({
                        to: channelID,
                        message: "Username already taken. Please create a user with a different username."
                    });
                } else if(input1 == null || input1 == "" || input1 == undefined){
                    bot.sendMessage({
                        to: channelID,
                        message: "Not a valid username. Please use !user-create _username_ to create a new user."
                    });
                }else{
                    playerUsername[userID] = input1;
                    playerPoints[playerUsername[userID]] = 0;
                    bot.sendMessage({
                        to: channelID,
                        message: "New Participant has joined the tournament!" + "\nYou are: " + playerUsername[userID] + "\nYou currently have " + playerPoints[playerUsername[userID]] + " point(s)"
                    });
                }

                break;
            // Display current user status
            case "user":
                if(playerUsername[userID] != null){
                    bot.sendMessage({
                        to: channelID,
                        message: "You are: " + playerUsername[userID] + "\nYou currently have " + playerPoints[playerUsername[userID]] + " point(s)"
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
                    statusStr += "\n" + Object.values(playerUsername)[i] + ": " + playerPoints[Object.values(playerUsername)[i]];
                }

                bot.sendMessage({
                    to: channelID,
                    message: tournamentName + "\nStatus: " + tstatus + "\nTotal Players in Tournament: " + Object.size(playerUsername) + "\n\nStandings:" + statusStr
                });
                break;

            // // Add point to current user
            // case "plus":
            //     playerPoints[userID] += 1;
            //     bot.sendMessage({
            //         to: channelID,
            //         message: "You have gained a point! Your current point(s): " + playerPoints[userID]
            //     });
            //     break;
            // // Subtrack point to current user
            // case "minus":
            //     playerPoints[userID] -= 1;
            //     if(playerPoints[userID] < 0){
            //         playerPoints[userID] = 0;
            //     }
            //
            //     bot.sendMessage({
            //         to: channelID,
            //         message: "You lost a point (wut). Your current point(s): " + playerPoints[userID]
            //     });
            //     break;

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
                            playerPoints[Object.values(playerUsername)[i]] = input2;
                            bot.sendMessage({
                                to: channelID,
                                message: Object.values(playerUsername)[i] + "'s points have been set to " + playerPoints[Object.values(playerUsername)[i]]
                            });
                        }
                    }
                }
                break;

            // Display User-ID: mainly used for adding new admins.
            case "user-id":
                bot.sendMessage({
                    to: channelID,
                    message: userID
                });
                break;

            // Start tournament: craetes teams into array teams;
            case "tournament-start":
                if(!isAdmin(userID)){
                    bot.sendMessage({
                        to: channelID,
                        message: "You do not have permission to use this command."
                    });
                } else if (tstatus == "Active"){
                    bot.sendMessage({
                        to: channelID,
                        message: "Tournament is already active."
                    });
                } else{
                    tstatus = "Active";
                    noTeams = Object.values(playerUsername);
                    createMatchUp();
                    bot.sendMessage({
                        to: channelID,
                        message: "Tournament has started!!\n\nHere are your teams (use \"!team-status\" to see up-to-date teams):\n" + displayTeams()
                    });
                }
                break;
            case "team-status":
                bot.sendMessage({
                    to: channelID,
                    message: "Current Teams:\n" + displayTeams()
                });
                break;
            case "team-win":
                for(i = 0; i < teamMatchUp.length; i++){
                    for(j = 0; j < teamSize; j++){
                        if(teamMatchUp[i][0][j] == playerUsername[userID]){
                            var str = "";
                            for(k = 0; k < teamSize; k++){
                              str += teamMatchUp[i][0][k] + ", ";
                              playerPoints[teamMatchUp[i][0][k]] += 1;
                            }
                            bot.sendMessage({
                                to: channelID,
                                message: "Players: " + str + "received 1 point.\nPlease wait for new match-ups to be assigned."
                            });
                            var index = teams.indexOf(teamMatchUp[i][1]);
                            if (index > -1) {
                                teams.splice(index, 1);
                            }
                            console.log("\nTeams after win");
                            console.log(teams)
                            for(k = 0; k < teamSize; k++){
                              noTeams.push(teamMatchUp[i][1][k]);
                            }
                            teamMatchUp[i][1] = [];
                        }
                        if(teamMatchUp[i][1][j] == playerUsername[userID]){
                            var str = "";
                            for(k = 0; k < teamSize; k++){
                              str += teamMatchUp[i][1][k] + ", ";
                              playerPoints[teamMatchUp[i][1][k]] += 1;
                            }
                            bot.sendMessage({
                                to: channelID,
                                message: "Players " + str + "received 1 point.\nPlease wait for new match-ups to be assigned."
                            });

                            var index = teams.indexOf(teamMatchUp[i][0]);
                            if (index > -1) {
                                teams.splice(index, 1);
                            }
                            console.log("\nTeams after win");
                            console.log(teams)
                            for(k = 0; k < teamSize; k++){
                              noTeams.push(teamMatchUp[i][0][k]);
                            }
                            teamMatchUp[i][0] = [];
                        }
                    }
                }
                break;

            case "new-games":
                if(!isAdmin(userID)){
                    bot.sendMessage({
                        to: channelID,
                        message: "You do not have permission to use this command."
                    });
                } else{
                  console.log("----new games are created----")
                  createMatchUp();
                  bot.sendMessage({
                      to: channelID,
                      message: "New Match-Ups have been created:\n" + displayTeams()
                  });
                }
                break;

            case "delete":
                var isPlaying = false;
                var doesExist = false;
                if(teamMatchUp[0][0] != null){
                    for(i = 0; i < teamMatchUp.length; i++){
                        for(j = 0; j < teamSize; j++){
                            if(teamMatchUp[i][0][j] == input1 || teamMatchUp[i][1][j] == input1){
                                isPlaying = true;
                            }
                        }
                    }
                }

                if(playerUsername[input1] == null){
                    doesExist = true;
                }

                if(!isAdmin(userID)){
                    bot.sendMessage({
                        to: channelID,
                        message: "You do not have permission to use this command."
                    });
                } else if(input1 == null){
                    bot.sendMessage({
                        to: channelID,
                        message: "Incorrect input. Please use !delete _userName_"
                    });
                } else if(!doesExist){
                    bot.sendMessage({
                        to: channelID,
                        message: "Unable to delete: " + input1 + " user does not exist in this tournament."
                    });
                } else if(isPlaying){
                    bot.sendMessage({
                        to: channelID,
                        message: "Cannot delete a user while in a match."
                    });
                } else{
                    var playerKey;
                    for(i = 0; i < Object.size(playerUsername); i++){
                      if(input1 == Object.values(playerUsername)[i]){
                        playerKey = Object.keys(playerUsername)[i];
                      }
                    }
                    delete playerUsername[playerKey];
                    delete playerPoints[input1];
                    if(input1 in noTeams){
                        var index = noTeams.indexOf(input1);
                        if (index > -1){
                          noTeams.splice(index, 1);
                        }
                    }
                    bot.sendMessage({
                        to: channelID,
                        message: input1 + " has been deleted."
                    });
                }
                break;
            case "disband":
                if(!isAdmin(userID)){
                    bot.sendMessage({
                        to: channelID,
                        message: "You do not have permission to use this command."
                    });
                } else if(input1 == null || input1 == undefined || input1 == "" || input2 == null || input2 == undefined || input2 == "" || input1 > teamMatchUp.length || input1 < 0 || input2 > 1 || input2 < 0){
                    bot.sendMessage({
                        to: channelID,
                        message: "Please use the correct format: !disband _teamRow_ _teamColumn_"
                    });
                } else if(teamMatchUp[input1][input2] == null || teamMatchUp[input1][input2] == undefined || teamMatchUp[input1][input2] == [] || teamMatchUp[input1][input2][0] == null || teamMatchUp[input1][input2][0] == undefined || teamMatchUp[input1][input2][0] == [] || teamMatchUp[input1][input2][1] == null || teamMatchUp[input1][input2][1] == undefined || teamMatchUp[input1][input2][1] == []){
                    bot.sendMessage({
                        to: channelID,
                        message: "Team does not exist at location. Please use the correct format: !disband _teamRow_ _teamColumn_"
                    });
                } else{
                    var index = teams.indexOf(teamMatchUp[input1][input2]);
                    if (index > -1) {
                        teams.splice(index, 1);
                    }
                    console.log("\nTeams after disband");
                    console.log(teams)

                    for(i = 0; i < teamSize; i++){
                        noTeams.push(teamMatchUp[input1][input2][i]);
                    }
                    teamMatchUp[input1][input2] = [];
                    bot.sendMessage({
                        to: channelID,
                        message: "Team has been disbanded and added to the player pool."
                    });
                }
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

function displayTeams(){
  var str = "";
  for(i = 0; i < teamMatchUp.length; i++){
    str += "[" + teamMatchUp[i][0] + "]" + "  vs  " + "[" + teamMatchUp[i][1] + "]\n"
  }

  str += "\nBye-Round Players: "
  for(i = 0; i < noTeams.length; i++){
    str += "\n" + noTeams[i];
  }
  return str;
}

function createMatchUp(){
  teamMatchUp = [];

  createTeams();

  for(i = 0; i < teams.length/2; i++){
      teamMatchUp.push([0, 0]);
      teamMatchUp[i][0] = teams[i*2];
      teamMatchUp[i][1] = teams[i*2 + 1];
      console.log("...");
      console.log(teamMatchUp);
  }
}

function createTeams(){
  console.log("Creating Teams....")
  shuffTeams = shuffle(noTeams);

  while(noTeams.length >= teamSize){
    var team = noTeams.splice(-teamSize);
    teams.push(team);
  }

  if(teams.length % 2 != 0){
    var leftOvers = teams.pop();
    for(i = 0; i < leftOvers.length; i++){
      noTeams.push(leftOvers[i]);
    }
  }
  console.log("\nTeams\n");
  console.log(teams);
  console.log("\nLeftOvers\n");
  console.log(noTeams);
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
