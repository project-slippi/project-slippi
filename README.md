# Project Slippi
## Mission
The focus of this project is around the sport of Super Smash Bros Melee. There are a variety of actors involved in the sport, these include the competitor, streamer, caster, fan, spectator, and more. We are trying to create features for these people to enhance their experience when doing anything Melee related.

The primary means of doing this introduced by this project is by creating a data-rich replay infrastructure. Replay files have the potential to expand the competitive Melee experience in many ways including:
1. Generating complex stats far beyond what is currently possible with video analysis tools
1. Archiving a much larger percentage of tournament matches (all setups can be recording setups)
1. Enabling new methods of streaming
1. Enhancing streams and commentary discussion with detailed information about the games

## More Information
Support Development: https://www.patreon.com/fizzi36

Release Blog Post: https://medium.com/project-slippi/project-public-release-4080c81d7205

Release Demo Video: https://www.youtube.com/watch?v=1OYS5JSZepQ

Discord Server: https://discord.gg/XpHZex6

## .slp Parsing Libraries
### Javascript [Official]
slp-parser-js: https://github.com/project-slippi/slp-parser-js

### Python [Community]
py-slippi: https://github.com/hohav/py-slippi

## How to Contribute
If you're interested in making Melee better than it already is, you should consider contributing!

Follow these steps to contribute:
1. Fork the repository you're interested in contributing to (see Project Structure section below for the breakdown of the project)
2. Checkout your fork
3. Make changes
4. Commit and push your changes
5. Submit a pull request into the upstream project
6. I will review the pull request and decide if it's worth merging. Please note that there's no guarantee what you work on will get merged into the main branch. That said, you can increase your chances by talking about it in the discord!

## Project Structure
The project is composed of many different parts and projects that work together. This section will detail what those parts are, where they are, and how they can be contributed to.

### ASM Gecko Codes (Assembly)
There are two main distributed codes: Slippi Recording and Slippi Playback.

The recording code will write data out of the game through Port B of the console. In order to do anything with this data, something must receive it. In the current case, the system receiving it is Dolphin, this will be addressed later.

The playback code requests and reads data from Port B of the console. It will request data it needs in order to play back a replay. Once again something must respond to these requests with the correct data and Dolphin currently serves that purpose.

The codes can be found at https://github.com/project-slippi/slippi-ssbm-asm. They can be compiled using the gecko tool in this project: https://github.com/JLaferri/gecko. See project readme for more info.

### Faster Melee (C++)
All the code to make Dolphin support the assembly codes were built on top of Faster Melee. This code can be found at https://github.com/project-slippi/Ishiiruka/tree/slippi. Make sure to use the `slippi` branch. For info about how to build Dolphin, look here: https://github.com/dolphin-emu/dolphin/wiki.

To find the Slippi-specific stuff in the codebase, search for "Slippi".

### Replay File
Dolphin currently serves the purpose of receiving data from the game and writting a replay file. To understand the structure and format of the replay file, please read the spec here: https://github.com/project-slippi/project-slippi/wiki/Replay-File-Spec

### Slippi Desktop App (Javascript/React)
The desktop application is maintained in the repo found here: https://github.com/project-slippi/slippi-desktop-app.

This application is used to browse and launch replay files. It also has a screen for viewing the detailed stats of a single game. For building instructions, see the readme in the repo.

### .slp Tools Library (Javascript)
Replay files are read and stats are computed by a separate library that can be found here: https://github.com/project-slippi/slp-parser-js. This was split out from the desktop app in order to allow people to read replays and display stats in their own applications.

### Nintendont (C)
We have also created a custom build of Nintendont which emulates a Slippi hardware device in a similar way to Dolphin. It is still currently a WIP but it can be found here: https://github.com/project-slippi/Nintendont/tree/slippi

## Credits
* Launcher icon made by [Twitter](https://www.flaticon.com/authors/twitter) from www.flaticon.com
