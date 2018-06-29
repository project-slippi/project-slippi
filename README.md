# Project Slippi
## Mission
The focus of this project is around the sport of Super Smash Bros Melee. There are a variety of actors involved in the sport, these include the competitor, streamer, caster, fan, spectator, and more. We are trying to create features for these people to enhance their experience when doing anything Melee related.

## More Information
Release Blog Post: https://medium.com/project-slippi/project-public-release-4080c81d7205

Release Demo Video: https://www.youtube.com/watch?v=1OYS5JSZepQ

Discord Server: https://discord.gg/XpHZex6

## .slp Parsing Libraries
### Javascript
slp-parser-js: https://github.com/JLaferri/slp-parser-js

### Python
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

### ASM Gecko Codes
There are two main distributed codes: Slippi Recording and Slippi Playback. 

The recording code will write data out of the game through Port B of the console. In order to do anything with this data, something must receive it. In the current case, the system receiving it is Dolphin, this will be addressed later.

The playback code requests and reads data from Port B of the console. It will request data it needs in order to play back a replay. Once again something must respond to these requests with the correct data and Dolphin currently serves that purpose.

The codes can be found at https://github.com/JLaferri/project-slippi/tree/master/Gecko%20Codes. They can be compiled using the gecko tool in this project: https://github.com/JLaferri/gecko

### Faster Melee
I built all the code to make Dolphin support the assembly codes on top of Faster Melee. This code can be found at https://github.com/JLaferri/Ishiiruka/tree/feature/slippi-extraction. Make sure to use the `feature/slippi-extraction` branch. For info about how to build Dolphin, look here: https://github.com/dolphin-emu/dolphin/wiki.

To find the Slippi-specific stuff in the codebase, search for "Slippi".

### Replay File
Dolphin currently serves the purpose of receiving data from the game and writting a replay file. To understand the structure and format of the replay file, please read the spec here: https://github.com/JLaferri/project-slippi/wiki/Replay-File-Spec

### Slippi Replay Launcher
The Launcher application is maintained in the Launcher folder of this project: https://github.com/JLaferri/project-slippi/tree/master/Launcher.

In order to build the Launcher application, consider forking this project and checking it out onto your computer.

From there, browse to the Launcher directory and run the following commands:
`npm install`
`npm run dev`

Note that in order to get the replays to launch correctly when running in dev, you will need to put the latest FM Slippi build into the `app/dolphin-dev/osx` or `app/dolphin-dev/windows` depending on the OS you are using.

### .slp Tools Library
Replay files are read and stats are computed by a separate library that can be found here: https://github.com/JLaferri/slp-parser-js. This was split out from the Launcher in order to allow people to read replays and display stats in their own applications.

I currently don't have any great advice for how to make changes to this project and see the changes in the Slippi Replay Launcher. I believe npm-workspace might be an option. Barring that though you could point the package.json for the Launcher to your local copy of this library.

## Credits
* Launcher icon made by [Twitter](https://www.flaticon.com/authors/twitter) from www.flaticon.com
