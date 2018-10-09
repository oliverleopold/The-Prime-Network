
//config
var port = 4013;
var max_peers = 0; //0 = unlimited
var mininmum_blocks = 300;
var maximum_blocks = 1000;

//define variables
var SOCKETS = {};
var BLOCKS = {};
var allocateBlocks = 0;
allocateBlocks = calculateBlockAllocation(0);

//import data

//start server

//socket handling

io.sockets.on('connection', function(socket){
  
  socket.id = Math.random();
  SOCKETS[socket.id] = socket;
  
  allocateBlocks = calculateBlockAllocation(SOCKETS.length);
 
  socket.on('disconnect', function() {
    
    delete(SOCKETS[socket.id]);
    allocateBlocks = calculateBlockAllocation(SOCKETS.length);
    
  });
  
  
}

              
function maintainBlocks() {
  
  if (allocateBlocks < BLOCKS.length) {
   
    var createNBlocks = BLOCKS.length - allocateBlocks;
    for (var x; x < createNBlocks; x++) {
      
      var block;
      block = {
        number:
        start_range:
        stop_range:
        
        
      };
      
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
