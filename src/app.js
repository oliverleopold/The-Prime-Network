
//config
var port = 4013;
var max_peers = 100;
var min_blocks = 300;
var maximum_blocks = 1000;
var minimumBlockSize = 200;
var maxBlockSize = 5000;
var startingBalance = 0;
var blockLifespan = (24 * 60 * 60 * 1000);

var consoleUrgency = 3;

var fileStorageSystem = {

  "activeBlocks": "storage/activeBlocks.prime",
  "archivedBlocks": "storage/archivedBlocks.prime",
  "users": "storage/users.prime",
  "storageFolder": "storage/"

};

//define variables
var SOCKETS = {};
var ACTIVE_BLOCKS = {};
var USERS = {};
var ARCHIVED_BLOCKS  = {};

var allocateBlocks = 0;

var express = require('express');
var app = express();
var serv = require('http').Server(app);

var colors = require('colors');

var md5 = require('md5');

var currentBlockNumber = -1;

allocateBlocks = calculateBlockAllocation(0);

//import data
var fs = require('fs');

if (!fs.existsSync(fileStorageSystem['storageFolder'])){
    fs.mkdirSync(fileStorageSystem['storageFolder']);
    consoleOutput("[FS] ".red + "( OK ) Created storage folder.", 1);
}

fs.readFile(fileStorageSystem.users, function(err, data) {
    if (data) {
      USERS = JSON.parse(data);
    } else {
      consoleOutput("[FS] ".red + "( ! ) Users not imported.", 1);
    }
});

fs.readFile(fileStorageSystem.activeBlocks, function(err, data) {
    if (data) {
      ACTIVE_BLOCKS = JSON.parse(data);
    } else {
      consoleOutput("[FS] ".red + "( ! ) Active Blocks not imported.", 1);
    }
});

fs.readFile(fileStorageSystem.archivedBlocks, function(err, data) {
    if (data) {
      ARCHIVED_BLOCKS = JSON.parse(data);
    } else {
      consoleOutput("[FS] ".red + "( ! ) Archived Blocks not imported.", 1);
    }
});




//start server
app.get('/',function(req, res) {
	res.sendFile(__dirname + '/client/index.html');
});
app.use('/',express.static(__dirname + '/client'));

serv.listen(port);

var io = require('socket.io')(serv,{});

consoleOutput("[Server] ".red + "Started on port " + port, 1);

//socket handling

io.sockets.on('connection', function(socket){

  if (getObjectsInList(SOCKETS) >= max_peers)
  {
    socket.emit('busyServer');
    socket.disconnect();
    consoleOutput("[Server] ".red + "Turned a socket away", 3);

  } else {

    socket.id = Math.random();
    SOCKETS[socket.id] = socket;

    allocateBlocks = calculateBlockAllocation(getObjectsInList(SOCKETS));
    consoleOutput("[Server] ".red + "New connection!", 3);

    socket.on('createNewUser', function(data) {
//FIX INDENTATION HERE
      var newUser = {

        id: Math.random(),
        balance: startingBalance,
        name: data.username,
        checkedOutBlock: null,
        temporary: data.temp

      }

      newUser.loginHash = md5(newUser.id + Math.random()) + md5(Math.random());
      newUser.authentication = md5(newUser.loginHash + data.auth);

      var usersList = Object.keys(USERS);
      var counterOfSameNickname = 0;
      for(var x = 0; x<usersList.length; x++) {

        var user = USERS[usersList[x]];
        if (user.name == data.username) {
          counterOfSameNickname++;
        }

      }

      var address = data.username + "@" + counterOfSameNickname + "." + newUser.loginHash.substr(0, 3);
      newUser.address = address;

      USERS[newUser.id] = newUser;
      socket.emit('userCreated', newUser);
      SOCKETS[socket.id].authUser = newUser;
      consoleOutput("[Server] ".red + "Created a new user.", 3);


    });

    socket.on('authenticateUser', function(data) {

      var usersList = Object.keys(USERS);
      for (var x = 0; x < usersList.length; x++) {

        var user = USERS[usersList[x]];

        if (user.loginHash == data.loginHash && user.authentication == data.authentication)
        {

          socket.emit('userAuthenticated', user);
          SOCKETS[socket.id].authUser = user;

        }

      }

    });

    socket.on('requestNewBlock', function() {

      var serverUser = USERS[SOCKETS[socket.id].authUser.id];
      consoleOutput("[Server] ".red + serverUser.id +" requested a new block", 3);


      var newBlock = ACTIVE_BLOCKS[Math.floor(Math.random()*getObjectsInList(ACTIVE_BLOCKS))];
      while (newBlock.submitted.hasOwnProperty(serverUser.id))
      {
        newBlock = ACTIVE_BLOCKS[Math.floor(Math.random()*getObjectsInList(ACTIVE_BLOCKS))].number;
      }
      serverUser.checkedOutBlock = ACTIVE_BLOCKS[Math.floor(Math.random()*getObjectsInList(ACTIVE_BLOCKS))].number;

      var publicBlock = {

        number: ACTIVE_BLOCKS[serverUser.checkedOutBlock].number,
        startRange: ACTIVE_BLOCKS[serverUser.checkedOutBlock].startRange,
        stopRange: ACTIVE_BLOCKS[serverUser.checkedOutBlock].stopRange

      }


      socket.emit('incomingBlock', publicBlock);
      consoleOutput("[Server] ".red + "Assigned block " + publicBlock.number, 3);




    });

    socket.on('completedBlock', function(data) {

      var serverUser = USERS[SOCKETS[socket.id].authUser.id];
      if (serverUser.checkedOutBlock == data.block.number)
      {

        var hashedResult = md5(JSON.stringify(data.block.result));

        var result = {

          hash: hashedResult,
          userId: data.account.id,
          time: getCurrentMSTime(),
          list: data.block.result

        };

        if (getObjectsInList(ACTIVE_BLOCKS[data.block.number].submitted) == 0)
        {
            ACTIVE_BLOCKS[data.block.number].expiration = getCurrentMSTime() + blockLifespan;

        }

        ACTIVE_BLOCKS[data.block.number].submitted.push(result);

        consoleOutput("[Server] ".red + "Turned in block " + data.block.number, 3);

        socket.emit('feedback', {

          status: "recieved",
          blockId: data.block.number

        });


      } else {

        consoleOutput("[Block Submission] ".red + serverUser.name.green + " turned in a block that wasn't checked out", 2);

        socket.emit('feedback', {

          status: "ERR_NOT_CHECKED_OUT",
          blockId: data.block.number

        });

      }

    });

    socket.on('disconnect', function() {

      if (SOCKETS[socket.id].hasOwnProperty("authUser") && SOCKETS[socket.id].authUser.hasOwnProperty("temporary")) {
        if (!SOCKETS[socket.id].authUser.temporary) {
          delete(USERS[SOCKETS[socket.id].authUser.id]);
        } else {
          SOCKETS[socket.id].authUser.checkedOutBlock = null;
        }
          consoleOutput("[Server] ".red + "disconnect & destoryed temp. user", 3);
      } else {
        consoleOutput("[Server] ".red + "disconnect.", 3);
      }

      delete(SOCKETS[socket.id]);
      allocateBlocks = calculateBlockAllocation(getObjectsInList(SOCKETS));

    });
  }


});

//runs every hour to check if any blocks have expired
setInterval(function(){

  consoleOutput("[Hourly Task] ".red + "Checking for block expiration.".red, 3);

  var ABKeys = Object.keys(ACTIVE_BLOCKS);
  for (var i = 0; i < ABKeys.length; i++)
  {
    //FIX THE FORMATTING HERE!!!
    if (ACTIVE_BLOCKS[ABKeys[i]].hasOwnProperty('expiration')) {

    if (ACTIVE_BLOCKS[ABKeys[i]].expiration < getCurrentMSTime())
    {
      consoleOutput("[Hourly Task] ".red + ("Block #" + i).green + " has expired", 2);
      var allBlockResultHashes = {};

      for (var x = 0; x < getObjectsInList(ACTIVE_BLOCKS[ABKeys[i]].submitted); x++)
      {
        var submittedObj = ACTIVE_BLOCKS[ABKeys[i]].submitted[x];
        if (!allBlockResultHashes.hasOwnProperty(submittedObj.hash))
        {
          var resultHolder = {};
          resultHolder.hash = submittedObj.hash;
          resultHolder.votes = 1;
          allBlockResultHashes[submittedObj.hash]  = resultHolder;
        } else {
          allBlockResultHashes[submittedObj.hash].votes++;
        }
      }

      var largestVotedResult;
      var LVRVoteCount = 0;

      var aBRHKeys = Object.keys(allBlockResultHashes);

      for (var x = 0; x < aBRHKeys.length; x++)
      {
        if (allBlockResultHashes[aBRHKeys[x]].votes > LVRVoteCount)
        {
          largestVotedResult = allBlockResultHashes[aBRHKeys[x]];
          LVRVoteCount = allBlockResultHashes[aBRHKeys[x]].votes;
        }
      }


      var winnerId;
      var winnerTime = 1E22;

      var numberOfPrimes = 0;
      var finalList;

      for (var x = 0; x < getObjectsInList(ACTIVE_BLOCKS[ABKeys[i]].submitted); x++)
      {
        var submittedObj = ACTIVE_BLOCKS[ABKeys[i]].submitted[x];
        if (submittedObj.hash == largestVotedResult.hash)
        {
          if (winnerTime > submittedObj.time)
          {
            winnerId = submittedObj.userId;
          }

          finalList = submittedObj.list;

        }


      }


      USERS[winnerId].balance += getObjectsInList(finalList);
      consoleOutput("[Hourly Task] ".red + ("User '" + USERS[winnerId].name + "'").green + " has new balance: " + USERS[winnerId].balance, 2);


      ARCHIVED_BLOCKS[ABKeys[i]] = {
        number: i,
        startRange: ACTIVE_BLOCKS[ABKeys[i]].startRange,
        stopRange: ACTIVE_BLOCKS[ABKeys[i]].stopRange,
        finalHash: largestVotedResult,
        list: finalList,
        numberOfPrimes: getObjectsInList(finalList),
        completed: getCurrentMSTime()
      };

      delete(ACTIVE_BLOCKS[ABKeys[i]]);



    }
  }

  }

}, (60 * 60 * 1000));


setInterval(function() {

  maintainBlocks();

}, (1000));

setInterval(function() {

  //save active blocks
  fs.writeFile(fileStorageSystem.activeBlocks, JSON.stringify(ACTIVE_BLOCKS), function() {});

  //save archived blocks
  fs.writeFile(fileStorageSystem.archivedBlocks, JSON.stringify(ARCHIVED_BLOCKS), function() {});

  //save users
  fs.writeFile(fileStorageSystem.users, JSON.stringify(USERS), function() {});

  consoleOutput("[FS] ".red + "Saving data to files", 4);



}, (1000 * 10));

function maintainBlocks() {

  consoleOutput("[Server] ".red + "Maintaining blocks (ABL: " + getObjectsInList(ACTIVE_BLOCKS) + ", Allocate: "+allocateBlocks+")", 4);


  if (allocateBlocks > getObjectsInList(ACTIVE_BLOCKS)) {

    var createNBlocks = allocateBlocks - getObjectsInList(ACTIVE_BLOCKS);
    for (var i = 0; i < createNBlocks; i++) {

      var block;
      var blockSize = Math.ceil(maxBlockSize-(0.0001*(currentBlockNumber^2)));

      if (blockSize < minimumBlockSize)
      {
        blockSize = minimumBlockSize;
      }

      if (!ACTIVE_BLOCKS[currentBlockNumber])
      {
        block = {
          number: (currentBlockNumber + 1),
          startRange: 1,
          stopRange: blockSize,
          submitted: []

        };
      } else {
        block = {
          number: (currentBlockNumber + 1),
          startRange: (ACTIVE_BLOCKS[currentBlockNumber].stopRange + 1),
          stopRange: ((ACTIVE_BLOCKS[currentBlockNumber].stopRange + 1) + blockSize),
          submitted: []

        };
      }



      ACTIVE_BLOCKS[block.number] = block;
      consoleOutput("[Server] ".red + "Created new block, number " + block.number, 3);


      currentBlockNumber++;

    }

  }

}


function calculateBlockAllocation(onlinePeers) {


  if (max_peers) {

    var block_allocation = ((onlinePeers / max_peers) * maximum_blocks);
    if (block_allocation < min_blocks) {

     block_allocation = min_blocks;

    }
    consoleOutput("[Server] ".red + "Calculated block allocation: " + Math.ceil(block_allocation) + " w/ input " + onlinePeers, 4);

    return Math.ceil(block_allocation);

  } else {

    consoleOutput("[FATAL ERROR] WE DO NOT YET SUPPORT UNLIMITED PEERS.".red);
    throw "1";

  }


}

function getCurrentMSTime() {
  return new Date().getTime();
}

function consoleOutput(note, urgency)
{
  if (urgency <= consoleUrgency)
  {
    console.log(note);
  }
}

function getObjectsInList(list)
{
  var count = 0;
  for (var k in list) {
    if (list.hasOwnProperty(k)) count++;
  }
  return count;
}
