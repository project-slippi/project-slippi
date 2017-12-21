# Project Slippi
Until I have time to write a proper readme for the project, the contents of the readme will be equivalent to the **slp file spec** found in the wiki.

# Intro
This document will outline the details of the Slippi replay file (.slp). This file is in many ways the heart of Project Slippi and hopefully after reading this document you will be excited to contribute to the future of Melee.

Likely the first important thing to discuss about the file is "why?". Here are a few reasons:
1. **Bootstrapping Development** - Many people are interested in working on Melee related projects. Unfortunately right now the barrier to entry is quite high. A prospective Melee hacker would likely have to learn assembly and figure out how to get the information they need out of the game. Being able to describe the contents of a Melee game in an easy to understand file can help to kick-start future Melee software infrastructure.
2. **Common Language** - Having one file structure for games that are played on Dolphin or on console makes it possible for a vibrant ecosystem to grow around it. It doesn't matter how the file is created or generated as long as the data exists in the same form any software designed to deal with that file will work.
3. **Archiving** - It's amazing how much data about Melee games we've lost over the years. Data that has not been collected is non-recoverable. There will never be complex game stats calculated from Mango vs Armada at Genesis 1. Taking the game and converting it to file means that that game can always be replayed, regenerated, or reprocessed. As more software is developed, we can rest easy knowing that any game that has been stored can take advantage of the new advancements.
4. **Sharing** - Capturing and uploading small replay files is much easier than doing the same with large files.

# UBJSON
The overall structure of the file conforms to the [UBJSON spec](http://ubjson.org/).

UBJSON was chosen for a few reasons:
1. It should be very easy to understand as it greatly resembles JSON
2. It allows binary data to be stored without increasing file size much by taking advantage of the optimized container formats
3. Arbitrary metadata of various types can be easily added and quickly parsed

The .slp file has two core elements: raw and metadata.

# The raw element
The value for this element is an array of bytes that describe discrete events that were sent by the game to be written. These specific events will be broken down later. The data for the raw element is the largest part of the file and is truly what defines what happened during the game.

The element is defined in optimized format, this is done such that the metadata element can be found and parsed much more easily irrespective of what size it is. The optimized format also enables the type definition to be dropped for each array value which greatly conserves space. You can find more information about optimized container formats in the UBJSON spec.

The lead up to the data will look like the following: `[U][3][r][a][w][[][$][U][#][l][X][X][X][X]`

Each value in brackets is one byte. The first 5 bytes describe the length and name of the key - in this case "raw". The remaining bytes describe the form and length of the value. In this case the value is an array ([) of type uint8 ($U) of length XXXX (lXXXX). The l specifies that the length of the array is described by a long (32-bit number).

It is important to note that while the game is in progress and the data is being actively written, the length will be set to 0. This was done to make overwriting the size easier once all the data has been received.

## Events
As mentioned above, the data contained within the raw element describes specific events that describe what is going on in a Melee game. These events were added in via modding the game and this section will describe what those events are and how to parse the enormous byte array. I will refer to all the bytes in this byte array as the *byte stream*.

Every event is defined by a one byte code followed by a payload. The following table lists all of the existing event types.

| Event Type | Event Code | Description |
| --- | :---: | --- |
| Event Payloads | 0x35 | This event will be the very first event in the byte stream. It enumerates all possible events and their respective payload sizes that may be encountered in the byte stream. |
| Game Start | 0x36 | Contains any information relevant to how the game is set up. Also includes the version of the extraction code. |
| Pre-Frame Update | 0x37 | One event per frame per character (Ice Climbers are 2 characters). Contains information required to **reconstruct a replay**. Information is collected right before controller inputs are used to figure out the character's next action. |
| Post-Frame Update | 0x38 | One event per frame per character (Ice Climbers are 2 characters). Contains information for **making decisions about game states**, such as computing stats. Information is collected at the end of the Collision detection which is the last consideration of the game engine. |
| Game End | 0x39 | Indicates the end of the game. |

### Endianness
As per the UBJSON spec, all integer types are written in **big-endian** format. And by a happy coincidence, all integers in the game data byte stream are also written in big-endian format.

This means that whether you are looking at the length of the byte stream as described in the previous section or if you are looking at what stage was selected for the game, the byte order is consistent.

### Backwards Compatibility
In order to maintain backwards compatibility it is important that if any new fields are added to a payload that they be **added to the end**. Because the payload sizes are provided up-front, a new parser reading an old replay file will still be able to parse the file correctly under the condition that fields have not changed position. The new parser must be able to handle the case where "new" fields are not present in the "old" file.

Adding new events should work similarly. An old parser reading a new file will simply ignore new fields and new events. A new parser reading an old file will understand that new events and fields are not present and continue without them.

### Melee IDs
Some of the values in the event payloads are IDs internal to the game. Luckily for us Dan Salvato and other contributors have documented these pretty extensively in a Google sheet.

* [Character IDs](https://docs.google.com/spreadsheets/d/1JX2w-r2fuvWuNgGb6D3Cs4wHQKLFegZe2jhbBuIhCG8/edit#gid=20)
* [Action State IDs](https://docs.google.com/spreadsheets/d/1JX2w-r2fuvWuNgGb6D3Cs4wHQKLFegZe2jhbBuIhCG8/edit#gid=13)

### Event Payloads
This event should be the very first event in the byte stream. It enumerates all possible events and their respective payload sizes that may be encountered in the byte stream.

| Offset | Name | Type | Description |
| --- | --- | --- | --- |
| 0x0 | Command Byte | uint8 | (0x35) The command byte for the event payloads event |
| 0x1 | Payload Size | uint8 | The length of the payload for the event payloads event (this payload) |
| 0x2 + 0x3*i* | Other Command Byte | uint8 | A command byte that may be encountered in the byte stream. *i* is dependent on the payload size, the rest of the payload is all command/size pairs |
| 0x3 + 0x3*i* | Other Command Payload Size | uint16 | The size of the payload for the command |

### Game Start
This is data that will be transferred as the game is starting. It includes all the information required to initialize the game such as the game mode, settings, characters selected, stage selected. The entire block that contains all of this data is written out in the `Game Info Block` but not all of it is understood/documented.

| Offset | Name | Type | Description |
| --- | --- | --- | --- |
| 0x0 | Command Byte | uint8 | (0x36) The command byte for the game start event |
| 0x1 | Version | uint8[4] | 4 bytes describing the current extraction code version. `major.minor.build.revision` |
| 0x5 | Game Info Block | uint8[312] | Full game info block that melee reads from to initialize a game |
| 0xD | Is Teams | bool | Value is 1 if teams game, 0 otherwise
| 0x13 | Stage | uint16 | Stage ID |
| 0x65 + 0x24*i* | External Character ID | uint8 | The player's character ID. *i* can be 0-3 depending on the character port |
| 0x66 + 0x24*i* | Player Type | uint8 | 0 = human, 1 = CPU, 3 = empty |
| 0x68 + 0x24*i* | Character Color | uint8 | Color of the character |
| 0x6E + 0x24*i* | Team ID | uint8 | Value only relevant if `is teams` is true. 0 = red, 1 = blue, 2 = green |
| 0x13D | Random Seed | uint32 | The random seed before the game start |

### Pre-Frame Update
This event will occur exactly once per frame per character (Ice Climbers are 2 characters). Contains information required to **reconstruct a replay**. Information is collected right before controller inputs are used to figure out the character's next action.

| Offset | Name | Type | Description |
| --- | --- | --- | --- |
| 0x0 | Command Byte | uint8 | (0x37) The command byte for the pre-frame update event |
| 0x1 | Frame Number | int32 | The number of the frame. Starts at -123. Frame 0 is when the timer starts counting down |
| 0x5 | Player Index | uint8 | Between 0 and 3. Port is index + 1 |
| 0x6 | Is Follower | bool | Value is 1 for Nana and 0 otherwise |
| 0x7 | Random Seed | uint32 | The random seed at this point |
| 0xB | Action State ID | uint16 | Indicates the state the character is in. Very useful for stats |
| 0xD | X Position | float | X position of character |
| 0x11 | Y Position | float | Y position of character |
| 0x15 | Facing Direction | float | -1 if facing left, +1 if facing right |
| 0x19 | Joystick X | float | Processed analog value of X axis of joystick |
| 0x1D | Joystick Y | float | Processed analog value of Y axis of joystick |
| 0x21 | C-Stick X | float | Processed analog value of X axis of c-stick |
| 0x25 | C-Stick Y | float | Processed analog value of Y axis of c-stick |
| 0x29 | Trigger | float | Processed analog value of trigger |
| 0x2D | Buttons | uint32 | Processed buttons. Look at bits set to see processed buttons pressed |
| 0x31 | Physical Buttons | uint16 | Use bits set to determine physical buttons pressed. Useful for APM |
| 0x33 | Physical L Trigger | float | Physical analog value of L trigger. Useful for APM |
| 0x37 | Physical R Trigger | float | Physical analog value of R trigger. Useful for APM |

### Post-Frame Update
This event will occur exactly once per frame per character (Ice Climbers are 2 characters). Contains information for **making decisions about game states**, such as computing stats. Information is collected at the end of the Collision detection which is the last consideration of the game engine.

| Offset | Name | Type | Description |
| --- | --- | --- | --- |
| 0x0 | Command Byte | uint8 | (0x38) The command byte for the post-frame update event |
| 0x1 | Frame Number | int32 | The number of the frame. Starts at -123. Frame 0 is when the timer starts counting down |
| 0x5 | Player Index | uint8 | Between 0 and 3. Port is index + 1 |
| 0x6 | Is Follower | bool | Value is 1 for Nana and 0 otherwise |
| 0x7 | Internal Character ID | uint8 | Internal character ID. Can only change throughout game for Zelda/Sheik. Check on first frame to determine if Zelda started as Sheik |
| 0x8 | Action State ID | uint16 | Indicates the state the character is in. Very useful for stats |
| 0xA | X Position | float | X position of character |
| 0xE | Y Position | float | Y position of character |
| 0x12 | Facing Direction | float | -1 if facing left, +1 if facing right |
| 0x16 | Percent | float | Current damage percent |
| 0x1A | Shield Size | float | Current size of shield |
| 0x1E | Last Attack Landed | uint8 | ID of last attack that hit enemy |
| 0x1F | Current Combo Count | uint8 | The combo count as defined by the game |
| 0x20 | Last Hit By | uint8 | The player that last hit this player |
| 0x21 | Stocks Remaining | uint8 | Number of stocks remaining |

### Game End
This event indicates the end of the game has occurred.

| Offset | Name | Type | Description |
| --- | --- | --- | --- |
| 0x0 | Command Byte | uint8 | (0x39) The command byte for the game end event |
| 0x1 | Game End Method | uint8 | 0 = inconclusive, 3 = conclusive |

# The metadata element
The metadata element contains any miscellaneous data relevant to the game but not directly provided by Melee.
