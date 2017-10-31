# Botsy
A simple discord bot that plays your favorite songs and annoys your friends.

## Commands
`$play [song name]` - plays a song by searching Youtube, grabbing the top result and streaming the audio through Discord.
`$stop` - stops the currently playing song
`$pause` - pause the currently playing song
`$resume` - resume the currently playing song
`$help`  - lists all valid commands

## Installation
Node.js is required to run `botsy`. Install that first if you don't have it.

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


