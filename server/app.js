
//config
var port = 4013;
var max_peers = 100; //0 = unlimited
var min_blocks = 300;
var maximum_blocks = 1000;
var minimumBlockSize = 200;
var maxBlockSize = 5000;
var startingBalance = 0;

var consoleUrgency = 4; //1 = only urgent messages, 2 = urgent and some non-urgent, 3 = all, 4 = debugging only

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

var currentBlockNumber = 0;

allocateBlocks = calculateBlockAllocation(0);



//import data

//start server
app.get('/',function(req, res) {
	res.sendFile(__dirname + '/index.html');
});
app.use('/',express.static(__dirname + '/'));

serv.listen(port);

var io = require('socket.io')(serv,{});

consoleOutput("[Server] ".red + "Started on port " + port, 3);

//socket handling

io.sockets.on('connection', function(socket){

  if (SOCKETS.length >= max_peers)
  {
    socket.emit('busyServer');
    socket.disconnect();
    consoleOutput("[Server] ".red + "Turned a socket away", 3);

  }

  socket.id = Math.random();
  SOCKETS[socket.id] = socket;

  allocateBlocks = calculateBlockAllocation(SOCKETS.length);
console.log(SOCKETS.length);
  consoleOutput("[Server] ".red + "New connection!", 1);

  socket.on('createNewUser', function(data) {

    var newUser = {
      id: Math.random(),
      balance: startingBalance,
      name: data.username,
      checkedOutBlock: null
    }

    USERS[newUser.id] = newUser;
    socket.emit('userCreated', newUser);
    consoleOutput("[Server] ".red + "Created a new user.", 3);


  });

  socket.on('requestNewBlock', function(data) {

    var serverUser = USERS[data.id];

    var newBlock = ACTIVE_BLOCKS[Math.floor(Math.random()*ACTIVE_BLOCKS.length)];
    while (newBlock.submitted[serverUser.id])
    {
      newBlock = ACTIVE_BLOCKS[Math.floor(Math.random()*ACTIVE_BLOCKS.length)].number;
    }
    serverUser.checkedOutBlock = ACTIVE_BLOCKS[Math.floor(Math.random()*ACTIVE_BLOCKS.length)].number;
    socket.emit('incomingBlock', ACTIVE_BLOCKS[serverUser.checkedOutBlock]);
    consoleOutput("[Server] ".red + "Assigned a new block", 3);




  });

  socket.on('completedBlock', function(data) {

    var serverUser = USERS[data.user.id];
    if (serverUser.checkedOutBlock == data.block.number)
    {

      var hashedResult = md5(JSON.stringify(data.block.result));
      var result = {

        numbers: data.block.result,
        hash: hashedResult,
        userId: data.user.id,
        time: getCurrentMSTime(),
        list: data.block.result

      };

      if (ACTIVE_BLOCKS[data.block.number].submitted.length == 0)
      {
        ACTIVE_BLOCKS[data.block.number].expiration = getCurrentMSTime() + (24 * 60 * 60 * 1000);
      }

      ACTIVE_BLOCKS[data.block.number].submitted[data.user.id] = result;

      consoleOutput("[Server] ".red + "Turned in a block", 3);


    } else {

      consoleOutput("[Block Submission] ".red + serverUser.name.green + " turned in a block that wasn't checked out", 2);

    }

  });

  socket.on('disconnect', function() {

    delete(SOCKETS[socket.id]);
    allocateBlocks = calculateBlockAllocation(SOCKETS.length);
    consoleOutput("[Server] ".red + "disconnect.", 1);


  });


});

//runs every hour to check if any blocks have expired
setInterval(function(){

  consoleOutput("[Hourly Task] ".red + "Checking for block expiration.".red, 3);

  for (var i; i < ACTIVE_BLOCKS.length; i++)
  {
    if (ACTIVE_BLOCKS[i].expiration < getCurrentMSTime())
    {
      consoleOutput("[Hourly Task] ".red + ("Block #" + i).green + " has expired", 2);
      var allBlockResultHashes = {};

      for (var x; x < ACTIVE_BLOCKS[i].submitted.length; x++)
      {
        var submittedObj = ACTIVE_BLOCKS[i].submitted[x];
        if (!allBlockResultHashes[submittedObj.hash])
        {
          var resultHolder;
          resultHolder.hash = submittedObj.hash;
          resultHolder.votes = 1;
          allBlockResultHashes[submittedObj.hash]  = resultHolder;
        } else {
          allBlockResultHashes[submittedObj.hash].votes++;
        }
      }

      var largestVotedResult;
      var LVRVoteCount = 0;

      for (var x; x < allBlockResultHashes.length; x++)
      {
        if (allBlockResultHashes[x].votes > LVRVoteCount)
        {
          largestVotedResult = allBlockResultHashes[x];
          LVRVoteCount = allBlockResultHashes[x].votes;
        }
      }


      var winnerId;
      var winnerTime = 1E22;

      var numberOfPrimes = 0;
      var finalList;

      for (var x; x < ACTIVE_BLOCKS[i].submitted.length; x++)
      {
        var submittedObj = ACTIVE_BLOCKS[i].submitted[x];
        if (submittedObj.hash == largestVotedResult)
        {
          if (winnerTime > submittedObj.time)
          {
            winnerId = submittedObj.userId;
          }

          finalList = submittedObj.result.list;

        }


      }


      USERS[winnerId].balance += finalList.length;

      ARCHIVED_BLOCKS[i] = {
        number: i,
        startRange: ACTIVE_BLOCKS[i].startRange,
        stopRange: ACTIVE_BLOCKS[i].stopRange,
        finalHash: largestVotedResult,
        list: finalList,
        numberOfPrimes: finalList.length,
        completed: getCurrentMSTime()
      };

      delete(ACTIVE_BLOCKS[i]);



    }

  }

}, (60 * 60 * 1000));


setInterval(function() {

  maintainBlocks();

}, (1000));

function maintainBlocks() {

  consoleOutput("[Server] ".red + "Maintaining blocks (ABL: " + ACTIVE_BLOCKS.length + ", Allocate: "+allocateBlocks+")", 4);


  if (allocateBlocks > ACTIVE_BLOCKS.length) {

    var createNBlocks = allocateBlocks - ACTIVE_BLOCKS.length;
    for (var x; x < createNBlocks; x++) {

      var block;
      var blockSize = Math.ceil(maxBlockSize-(0.0001*(currentBlockNumber^2)));

      if (blockSize < minimumBlockSize)
      {
        blockSize = minimumBlockSize;
      }

      block = {
        number: (currentBlockNumber + 1),
        startRange: (ACTIVE_BLOCKS[currentBlockNumber].stopRange + 1),
        stopRange: ((ACTIVE_BLOCKS[currentBlockNumber].stopRange + 1) + blockSize)

      };

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
    consoleOutput("[Server] ".red + "Calculated block allocation: " + Math.ceil(block_allocation) + " w/ input " + onlinePeers, 3);

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
