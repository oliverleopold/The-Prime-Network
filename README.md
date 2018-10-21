# ⭐ The Prime Network

The Prime Network is a game where participants use their computer to find prime numbers, and are awarded points based on how many primes they find.

## Use
You can play easily at https://prime.oliverleopold.com/. No programming knowledge necessary OR you can run your own game by downloading this repository and running `src/app.js`.

## Blocks
A block is simply a range of numbers that has a lifespan of 24 hours from first submission to expiration. Upon creation, a block is given a number and a range. The size of this range decreases over time to account for difficulty. Clients can start randomly requesting blocks from the server. 24 hours after it's first submission of answers, the server will determine a correct answer based on the most popular result. The first person that submitted that correct answer is awarded as many points as primes found in that block.

The server maintains a certain amount of blocks at any given time, trying to adjust for traffic. Once a block expires, the server may create a new one.

## To-Do
Support unlimited PEERS
