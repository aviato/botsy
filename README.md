# Botsy
A simple discord bot that plays your favorite songs and annoys your friends.

## Commands
```
$play <song name> - Play a song or video on Youtube (audio only)
$stop - Stop playback
$pause - Pause playback
$resume - Resume playback
$join <channel name> - Join the specified channel (be sure to check your spelling and punctuation)
$volume <volume level> - Set volume (ex: 1 [max], .5 [half])
$add <song name> - Add a song to the song queue
$autoplay - Automatically plays the songs in the song queue.
$skip - Skip the current playing song in the queue
$showqueue - Show all of the songs in queue
$shuffle - Enable shuffle play - songs in the queue will play in a random order
$mostplayed <show url> - Lists the most played songs. Add the "true" flag to show urls. (ex: $mostplayed true)
```

## Contributing
Just email me if you have any questions :-)

## Installation
Node.js is required to run `botsy`. Install that first if you don't have it. If you want to track stats on songs you'll need mongodb.

Mac OSX
* `git clone` this repo
* `brew install ffmpeg`
* `npm install`
* Create a `.env` file and fill in the details
* `forever start app.js`

Linux
* `git clone` this repo
* sudo apt-get install ffmpeg
* `npm install`
* install `mongodb` (if you want to track stats on songs)
* Create a `.env` file and fill in the details
* `forever start app.js`

Windows
* `git clone` this repo
* Find a way to install `ffmpeg` and add it to your path
* `npm install`
* Create a `.env` file and fill in the details
* `forever start app.js`

## Setup
You'll need to create a `.env` file and fill out all the fields you see in the `.example_env` file
* Create a bot and token that Discord will recognize (try [here](https://github.com/reactiflux/discord-irc/wiki/Creating-a-discord-bot-&-getting-a-token) if you don't know how to do this)
* Get yourself a Youtube API key so that you can use the google search API (try [here](https://developers.google.com/youtube/v3/getting-started) if you're stuck)
* In the Discord client, go to Server Settings>Roles and create a role called `Conductor` (it doesn't have to be called conductor, but that's how it's referred to in the source). Note: you'll want enable the option "Allow anyone to @mention this role" to be able to quickly grab your role ID
* In some chat channel type "\@Conductor". This will display your role ID (looks like "<@&101010101010101010>"), grab the numeric digits only and paste those into your `.env` file for the `CONDUCTOR_ID` section
* Next Go to Server Settings>Widget, copy the server id, and paste it into the `GUILD_ID` section of your `.env` file


