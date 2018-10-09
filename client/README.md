# ⭐ The Prime Network: Client


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

  // make sure that the data.blockId is what you just submitted
  // data.status should come back as "recieved"

});
```

### Busy Server
```
socket.on('busyServer', function() {

  // notify the user that the server is at capacity
  // the socket will be automatically disconnected

});
```

### The "User" Object
```
user.id: 0.9937238372864,
user.balance: 4182,
user.name: "foobar",
user.checkedOutBlock: 1431
```

To create a user:
`socket.emit('createUser', "foobar1");`

And watch out for:
```
socket.on('userCreated', function(data) {


});
