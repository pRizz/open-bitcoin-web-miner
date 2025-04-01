
General TODO before first public release:
-[x] lock the mining fields if mining
-[x] lock the miner address field and custom message field after mining starts
-[x] determine payout structure and rules for leaderboard; user wins 1 btc
-[x] connect to degen server backend
-[x] save the miner address and blockchain message to localStorage if they are valid
-[] create terms and conditions and privacy policy
-[] create dumb cookie consent popup
-[] implement leaderboard
-[] ensure React Compiler is enabled
-[] implement global hash rate display and graph and gauge and update live; about every second
-[] have a feed of the hash rate that the bright builds website can listen to; maybe zmq or make this a separate project?
-[] link to lightning network node in AWS
-[] show a bitcoin block header details view when mining
-[] host over tor; show onion link
-[] cache the user's best hashes found to localStorage or indexDB; load on app start; allow clearing
-[] personal best hashes found seems to not add when a better leading binary hash is found
-[] add leaderboard username and blockchain message to startMining websocket message and remove job id from response message
-[] add versioning
-[] add a settings page; allow enabling of saving to sessionStorage
-[] have an achievements page; keep track of notable findings, like a difficulty that beats satoshi's first block, second block, all orders of magnitude of difficulty, all increments of LBZs
-[] there is a bug where rejected solution hashes are not found on the front end, so their status cant be updated

Future features:
-[] add captcha's maybe
-[] create login system
-[] manage devices
-[] see device hash rate
