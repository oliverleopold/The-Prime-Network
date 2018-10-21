# ⭐ The Prime Network: Server

**To be a part of the official game, there is no need for this directory. If you would like to create your own game, clone this directory.**

## Installation
I recommend that you are using NodeJS v9.8.0 and NPM v5.6.0. Other versions might work but have not been tested.

To install the required dependencies, run `npm install`

Edit the configuration options at the top of `app.js` to manage your port and settings. (View below for recommended settings)

Run `node app.js` to start the server.

## Recommended Settings
```
var port = 4013; // what port to run the web server on
var max_peers = 100; // 0 = unlimited, will kick people off after this number
var min_blocks = 300; // the least amount of active blocks at a given time
var maximum_blocks = 1000; // the most amount of active blocks at a given time
var minimumBlockSize = 200; // increasing this will increase the overall difficulty
var maxBlockSize = 5000; // increasing this will increase the overall difficulty
var startingBalance = 0; // anything above 0 would not make logical sense
var blockLifespan = (24 * 60 * 60 * 1000); // the amount of time people can submit a block before it expires in MS

var consoleUrgency = 2; // 1-4, where 4 shows you all console output, and 1 only shows important events

var fileStorageSystem = {

  "activeBlocks": "storage/activeBlocks.prime",
  "archivedBlocks": "storage/archivedBlocks.prime",
  "users": "storage/users.prime",
  "storageFolder": "storage/"

};
```

## Making a Client Page
You can copy the `/client` directory, but keep in mind that you may need to change the IP / Port in `backend.js`, as it's set by default to `localhost:4013`.
