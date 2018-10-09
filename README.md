# ⭐ The Prime Network

The Prime Network is a game where participants use their computer to find prime numbers, and are awarded points based on how many primes they find.

## Use
You can play easily at https://oliverleopold.com/prime. No programming knowledge neccessary OR you can download the "client" folder and edit away.

### Request New Block
`socket.emit("requestNewBlock", {account: user});`
Then, catch the incoming block:
```
socket.on('incomingBlock', function(block) {
  
  //handle and process the "block" object

});
```

### Submit a Completed Block
```
socket.emit("completedBlock", {

  account: user,
  block: block

});
```
Then, catch the result:
```
socket.on('feedback', function(data) {

  //make sure that the data.blockId is what you just submitted
  //data.status should come back as "recieved"

});
```



## Blocks
A block is a range of 1,000 numbers. At any time, a client can request a block from the server and start working. Once the client has found all of the prime numbers inside the block, they will return it to the server. After a block is first submitted, it stays open for 24-hours. Once it closes, a correct answer will be determined based on the majority answer.

The first person to have submitted the correct answer will recieve 85% of the primes as points. The second will recieve 5%, the third will recieve 2%, and all other correct answers will share the remaining 8%.

The server generates blocks, and tries to have at least 300 open blocks at any given time, but will open up to 1,000 blocks at a time based on the current amount of traffic.
