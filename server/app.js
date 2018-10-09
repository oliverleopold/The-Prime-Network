
//config
var port = 4013;
var max_peers = 100; //0 = unlimited
var mininmum_blocks = 300;
var maximum_blocks = 1000;
var minimumBlockSize = 200;
var maxBlockSize = 5000;

//define variables
var SOCKETS = {};
var BLOCKS = {};
var USERS = {};

var allocateBlocks = 0;
allocateBlocks = calculateBlockAllocation(0);

var express = require('express');
var app = express();
var serv = require('http').Server(app);

var colors = require('colors');

var currentBlockNumber = 0;


//import data

//start server
app.get('/',function(req, res) {
	res.sendFile(__dirname + '/client/index.html');
});
app.use('/client',express.static(__dirname + '/client'));

serv.listen(port);

var io = require('socket.io')(serv,{});

console.log(colors.red("[Server] ") + colors.black("Started on port " + port));

//socket handling

io.sockets.on('connection', function(socket){

  if (SOCKETS.length >= max_peers)
  {
    socket.emit('busyServer');
    socket.disconnect();
  }

  socket.id = Math.random();
  SOCKETS[socket.id] = socket;

  allocateBlocks = calculateBlockAllocation(SOCKETS.length);

  socket.on('requestNewBlock', function(data) {

    var serverUser = USERS[data.id];


  });

  socket.on('disconnect', function() {

    delete(SOCKETS[socket.id]);
    allocateBlocks = calculateBlockAllocation(SOCKETS.length);

  });


});


function maintainBlocks() {

  if (allocateBlocks < BLOCKS.length) {

    var createNBlocks = BLOCKS.length - allocateBlocks;
    for (var x; x < createNBlocks; x++) {

      var block;
      var blockSize = Math.ceil(maxBlockSize-(0.0001*(currentBlockNumber^2)));

      if (blockSize < minimumBlockSize)
      {
        blockSize = minimumBlockSize;
      }

      block = {
        number: (currentBlockNumber + 1),
        startRange: (BLOCKS[currentBlockNumber].stopRange + 1),
        stopRange: ((BLOCKS[currentBlockNumber].stopRange + 1) + blockSize)

      };

      BLOCKS[block.number] = block;

      currentBlockNumber++;

    }

  }

}


function calculateBlockAllocation(onlinePeers) {

  if (max_peers) {

    var block_allocation = ((onlinePeers / max_peers) * maximum_blocks);
    if (block_allocation < minimum_blocks) {

     block_allocation = minimum_blocks;

    }
    return ceil(block_allocation);

  } else {


  }


}
