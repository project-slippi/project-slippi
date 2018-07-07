################################################################################
# Function: SlippiRecording
# ------------------------------------------------------------------------------
# Description: This is the main entry point for a few injected codes. The
# branches to this code will be added manually via other codes. The branches
# must set the link register because that is what will be used to decide which
# function to execute. Everything is done in one code to allow for sharing the
# EXI functions
# ------------------------------------------------------------------------------
# Injection Address: 8040a540 (Aux Code Region)
# ------------------------------------------------------------------------------
# Supports branching from:
# 8016e74c (SendGameInfo)
# 8006b0dc (SendGamePreFrame)
# 8006c5d4 (SendGamePostFrame)
# 801a5b04 (SendGameEnd)
################################################################################

# Create stack frame and back up every register. For now this is just ultra
# safe partially to save space and also because the locations we are branching
# from were not originally designed to be branched from in those locations
stmw r0, -0x80(r1) # store all registers
mflr r0
stw r0, 0x4(r1)
stwu r1, -0x88(r1)

# Check if in single player mode, and ignore code if so
lis r3, 0x801a # load SinglePlayer_Check function
ori r3, r3, 0x4340
mtlr r3
lis r3, 0x8048
lbz r3, -0x62D0(r3) #load menu controller major
blrl
cmpwi r3, 1 # is this single player mode?
beq- CLEANUP # if in single player, ignore everything

# Move value of the lr to r3 for determining where we came from
lwz r3, 0x8C(r1)

# Fork to SendGameInfo if we came from 8016e74c
lis r4, 0x8016
ori r4, r4, 0xe750
cmpw r3, r4
beq SEND_GAME_INFO

# Fork to SendGamePreFrame if we came from 8006b0dc
lis r4, 0x8006
ori r4, r4, 0xb0e0
cmpw r3, r4
beq SEND_GAME_PRE_FRAME

# Fork to SendGamePostFrame if we came from 8006c5d4
lis r4, 0x8006
ori r4, r4, 0xc5d8
cmpw r3, r4
beq SEND_GAME_POST_FRAME

# Fork to SendGameEnd if we came from 801a5b04
lis r4, 0x801a
ori r4, r4, 0x5b08
cmpw r3, r4
beq SEND_GAME_END

# If we did not come from a known location, just clean up
b CLEANUP

################################################################################
# Routine: SendGameInfo
# ------------------------------------------------------------------------------
# Description: Gets the parameters that define the game such as stage,
# characters, settings, etc and write them out to Slippi device
################################################################################
SEND_GAME_INFO:
# initialize transfer with slippi device
bl StartExiTransfer

#------------- WRITE OUT COMMAND SIZES -------------
# start file sending and indicate the sizes of the output commands
li r3, 0x35
bl SendByteExi

# write out the payload size of the 0x35 command (includes this byte)
# we can write this in only a byte because I doubt it will ever be larger
# than 255. We write out the sizes of the other commands as half words for
# consistent parsing
li r3, 13
bl SendByteExi

# game info command
li r3, 0x36
bl SendByteExi
li r3, 352
bl SendHalfExi

# pre-frame update command
li r3, 0x37
bl SendByteExi
li r3, 58
bl SendHalfExi

# post-frame update command
li r3, 0x38
bl SendByteExi
li r3, 37
bl SendHalfExi

# game end command
li r3, 0x39
bl SendByteExi
li r3, 1
bl SendHalfExi

#------------- BEGIN GAME INFO COMMAND -------------
# game information message type
li r3, 0x36
bl SendByteExi

# build version number. Each byte is one digit
# any change in command data should result in a minor version change
# current version: 1.0.0.0
# Version is of the form major.minor.build.revision. A change to major
# indicates breaking changes/loss of backwards compatibility. A change
# to minor indicates a pretty major change like added fields or new
# events. Build/Revision can be incremented for smaller changes
lis r3, 0x0100
addi r3, r3, 0x0000
bl SendWordExi

#------------- GAME INFO BLOCK -------------
# this iterates through the static game info block that is used to pull data
# from to initialize the game. it writes out the whole thing (0x138 long)
li r14, 0
START_GAME_INFO_LOOP:
add r3, r31, r14
lwz r3, 0x0(r3)
bl SendWordExi

addi r14, r14, 0x4
cmpwi r14, 0x138
blt+ START_GAME_INFO_LOOP

#------------- OTHER INFO -------------
# write out random seed
lis r3, 0x804D
lwz r3, 0x5F90(r3) #load random seed
bl SendWordExi

# write UCF toggle bytes
lis r14, 0x804D
START_UCF_LOOP:
lwz r3, 0x1FB0(r14) #load UCF toggle
bl SendWordExi

addi r14, r14, 0x4
andi. r3, r14, 0xFFFF # Grab the bottom of the loop address
cmpwi r3, 0x20 # Stop looping after 8 iterations
blt+ START_UCF_LOOP

bl EndExiTransfer

b CLEANUP

################################################################################
# Routine: SendGamePreFrame
# ------------------------------------------------------------------------------
# Description: Gets information relevant to playing back a replay and writes
# it to Slippi device
################################################################################
SEND_GAME_PRE_FRAME:
#------------- INITIALIZE -------------
# here we want to initalize some variables we plan on using throughout
lbz r14, 0xC(r31) #loads this player slot

# generate address for static player block
lis r15, 0x8045
ori r15, r15, 0x3080
mulli r3, r14, 0xE90
add r15, r15, r3

#------------- FRAME_UPDATE -------------
bl StartExiTransfer #indicate transfer start

li r3, 0x37
bl SendByteExi #send OnPreFrameUpdate event code

bl GetFrameCount
bl SendWordExi

mr r3, r14 #player slot
bl SendByteExi

mr r3, r30
mr r4, r15
bl GetIsFollower
bl SendByteExi

lis r3, 0x804D
lwz r3, 0x5F90(r3) #load random seed
bl SendWordExi

lwz r3, 0x70(r30) #load action state ID
bl SendHalfExi
lwz r3, 0x110(r30) #load x coord
bl SendWordExi
lwz r3, 0x114(r30) #load y coord
bl SendWordExi
lwz r3, 0x8C(r30) #load facing direction
bl SendWordExi
lwz r3, 0x680(r30) #load Joystick X axis
bl SendWordExi
lwz r3, 0x684(r30) #load Joystick Y axis
bl SendWordExi
lwz r3, 0x698(r30) #load c-stick X axis
bl SendWordExi
lwz r3, 0x69c(r30) #load c-stick Y axis
bl SendWordExi
lwz r3, 0x6b0(r30) #load analog trigger input
bl SendWordExi
lwz r3, 0x6bc(r30) #load buttons pressed this frame
bl SendWordExi

# TODO: For some reason the following code block was causing a crash on console
# TODO: Need to figure out why
# TODO: Also need to make this work with single code concept
#get raw controller inputs
#lis r4, 0x804C
#ori r4, r4, 0x1FAC
#mulli r3, r14, 0x44
#add r4, r4, r3

#lhz r3, 0x2(r4) #load constant button presses
#bl SendHalfExi
#lwz r3, 0x30(r4) #load l analog trigger
#bl SendWordExi
#lwz r3, 0x34(r4) #load r analog trigger
#bl SendWordExi

li r3, 0
bl SendHalfExi
li r3, 0
bl SendWordExi
li r3, 0
bl SendWordExi

bl EndExiTransfer #stop transfer

b CLEANUP

################################################################################
# Routine: SendGamePostFrame
# ------------------------------------------------------------------------------
# Description: Gets information relevant to calculating stats and writes
# it to Slippi device
################################################################################
SEND_GAME_POST_FRAME:
# check scene controller to see if we are in game or in results screen
# if in results screen, skip
lis r3, 0x8048
lbz r3, -0x62CD(r3)
cmpwi r3, 0x3
beq- CLEANUP

# check if this character is in the inactive state (sheikd/zelda)
lwz r3, 0x70(r29) #load action state ID
cmpwi r3, 0xB
beq- CLEANUP

#------------- INITIALIZE -------------
# here we want to initalize some variables we plan on using throughout
lbz r14, 0x6C(r29) #loads this player slot

# generate address for static player block
lis r15, 0x8045
ori r15, r15, 0x3080
mulli r3, r14, 0xE90
add r15, r15, r3

#------------- FRAME_UPDATE -------------
bl StartExiTransfer #indicate transfer start

li r3, 0x38
bl SendByteExi #send OnPostFrameUpdate event code

bl GetFrameCount
bl SendWordExi

mr r3, r14 #player slot
bl SendByteExi

mr r3, r29
mr r4, r15
bl GetIsFollower
bl SendByteExi

lwz r3, 0x64(r29) #load internal char ID
bl SendByteExi
lwz r3, 0x70(r29) #load action state ID
bl SendHalfExi
lwz r3, 0x110(r29) #load x coord
bl SendWordExi
lwz r3, 0x114(r29) #load y coord
bl SendWordExi
lwz r3, 0x8C(r29) #load facing direction
bl SendWordExi
lwz r3, 0x1890(r29) #load current damage
bl SendWordExi
lwz r3, 0x19f8(r29) #load shield size
bl SendWordExi
lwz r3, 0x20ec(r29) #load last attack landed
bl SendByteExi
lhz r3, 0x20f0(r29) #load combo count
bl SendByteExi
lwz r3, 0x1924(r29) #load player who last hit this player
bl SendByteExi

lbz r3, 0x8E(r15) # load stocks remaining
bl SendByteExi

lwz r3, 0x8F4(r29) # load action state frame counter
bl SendWordExi

bl EndExiTransfer #stop transfer

b CLEANUP

################################################################################
# Routine: SendGameEnd
# ------------------------------------------------------------------------------
# Description: Send information about the end of a game to Slippi Device
################################################################################
SEND_GAME_END:
# initialize transfer with slippi device
bl StartExiTransfer

# request game information from slippi
li r3, 0x39
bl SendByteExi

#check byte that will tell us whether the game was won by stock loss or by ragequit
lis r3, 0x8047
lbz r3, -0x4960(r3)
bl SendByteExi #send win condition byte. this byte will be 0 on ragequit, 3 on win by stock loss

bl EndExiTransfer

################################################################################
# Routine: Cleanup
# ------------------------------------------------------------------------------
# Description: Will be called from every path. It will recover the registers
# and the stack and will fork to execute the replaced lines of code
################################################################################
CLEANUP:
# Recover stack frame
addi r1, r1, 0x88
lwz r0, 0x4(r1)
mtlr r0 # Put the stored lr back
lmw r2, -0x78(r1) # Reload all registers to the state they were in when function was called
lwz r0, -0x80(r1) # Can't multi-load past the register used for address so restore r0 individually

# Fork on lr value to replace correct code
mflr r3

# Fork to SendGameInfo if we came from 8016e74c
lis r4, 0x8016
ori r4, r4, 0xe750
cmpw r3, r4
beq RESTORE_SEND_GAME_INFO

# Fork to SendGamePreFrame if we came from 8006b0dc
lis r4, 0x8006
ori r4, r4, 0xb0e0
cmpw r3, r4
beq RESTORE_SEND_GAME_PRE_FRAME

# Fork to SendGamePostFrame if we came from 8006c5d4
lis r4, 0x8006
ori r4, r4, 0xc5d8
cmpw r3, r4
beq RESTORE_SEND_GAME_POST_FRAME

# Fork to SendGameEnd if we came from 801a5b04
lis r4, 0x801a
ori r4, r4, 0x5b08
cmpw r3, r4
beq RESTORE_SEND_GAME_END

# If lr did not match any sources, just return
lwz r3, -0x74(r1)
lwz r4, -0x70(r1)
blr

RESTORE_SEND_GAME_INFO:
lwz r3, -0x74(r1)
lwz r4, -0x70(r1)
lis r3, 0x8017 #execute replaced code line
blr

RESTORE_SEND_GAME_PRE_FRAME:
lwz r3, -0x74(r1)
lwz r4, -0x70(r1)
lbz r0, 0x2219(r31) #execute replaced code line
blr

RESTORE_SEND_GAME_POST_FRAME:
lwz r3, -0x74(r1)
lwz r4, -0x70(r1)
lwz r0, 0x3C(r1) #execute replaced code line
blr

RESTORE_SEND_GAME_END:
lwz r3, -0x74(r1)
lwz r4, -0x70(r1)
addi r28, r5, 0 #execute replaced code line
blr

################################################################################
# Function: GetFrameCount
# ------------------------------------------------------------------------------
# Description: Gets the number of frames this game has been going on for.
# The result can be negative if the timer has not started yet
# ------------------------------------------------------------------------------
# Outputs:
# r3 - Frame count
################################################################################
GetFrameCount:
# Compute and send frame count (supports negatives before timer starts)
lis r4, 0x8048
lwz r4, -0x62A8(r4) # load scene controller frame count
lis r3, 0x8047
lwz r3, -0x493C(r3) #load match frame count
cmpwi r3, 0
bne SKIP_FRAME_COUNT_ADJUST #this makes it so that if the timer hasn't started yet, we have a unique frame count still
sub r3, r3, r4
li r4, -0x7B
sub r3, r4, r3

SKIP_FRAME_COUNT_ADJUST:
blr

################################################################################
# Function: GetFrameCount
# ------------------------------------------------------------------------------
# Description: Gets the number of frames this game has been going on for.
# The result can be negative if the timer has not started yet
# ------------------------------------------------------------------------------
# Inputs:
# r3 - The current character pointer
# r4 - The address of the current player block
# ------------------------------------------------------------------------------
# Outputs:
# r3 - Frame count
################################################################################
GetIsFollower:
mr r5, r3

li r3, 0 # initialize isFollower to false

# check if we are playing ice climbers, if we are we need to check if this is nana
lwz r6, 0x4(r4)
cmpwi r6, 0xE
bne+ GET_IS_FOLLOWER_RETURN

# we need to check if this is a follower (nana). should not save inputs for nana
lwz r6, 0xB4(r4) # load pointer to follower for this port
cmpw r6, r5 # compare follower pointer with current pointer
bne GET_IS_FOLLOWER_RETURN # if the two  dont match, this is popo

li r3, 1 # if we get here then we know this is nana

GET_IS_FOLLOWER_RETURN:
blr

################################################################################
# Function: StartExiTransfer
# ------------------------------------------------------------------------------
# Description: Prepares EXI slot to be written to
################################################################################
StartExiTransfer:
# Store stack frame
mflr r0
stw r0, 0x4(r1)
stwu r1,-0x20(r1)

# Prepare to call EXIAttach (803464c0) r3: 0, r4: 803522a8
lis r3, 0x8034
ori r3, r3, 0x64c0
mtlr r3

# Load input params
li r3, 0 # slot
li r4, 0 # maybe a callback? leave 0
blrl # Call EXIAttach

# Prepare to call EXILock (80346d80) r3: 0
lis r3, 0x8034
ori r3, r3, 0x6d80
mtlr r3

# Load input params
li r3, 0 # slot
blrl # Call EXILock

# Prepare to call EXISelect (80346688) r3: 0, r4: 0, r5: 4
lis r3, 0x8034
ori r3, r3, 0x6688
mtlr r3

# Load input params
li r3, 0 # slot
li r4, 0 # device
li r5, 5 # freq
blrl # Call EXISelect

#restore registers and sp
lwz r0, 0x24(r1)
addi r1, r1, 0x20
mtlr r0

blr

################################################################################
# Function: SendByteExi
# ------------------------------------------------------------------------------
# Description: Send byte over EXI
# ------------------------------------------------------------------------------
# Inputs:
# r3 - Data to transfer
################################################################################
SendByteExi:
slwi r3, r3, 24 #the byte to send has to be left shifted
li r5, 1
b HANDLE_EXI

################################################################################
# Function: SendHalfExi
# ------------------------------------------------------------------------------
# Description: Send half word over EXI
# ------------------------------------------------------------------------------
# Inputs:
# r3 - Data to transfer
################################################################################
SendHalfExi:
slwi r3, r3, 16 #the bytes to send have to be left shifted
li r5, 2
b HANDLE_EXI

################################################################################
# Function: SendWordExi
# ------------------------------------------------------------------------------
# Description: Send word over EXI
# ------------------------------------------------------------------------------
# Inputs:
# r3 - Data to transfer
################################################################################
SendWordExi:
li r5, 4
b HANDLE_EXI

################################################################################
# Routine: HandleExi
# ------------------------------------------------------------------------------
# Description: Main handler for EXI sending
# ------------------------------------------------------------------------------
# Inputs:
# r3 - Left-shifted data to transfer
# r5 - Length of data to transfer
################################################################################
HANDLE_EXI:
mflr r0
stw r0, 0x4(r1)
stwu r1, -0xC(r1)

# Write the contents of r3 onto the stack and change r4 to that address
stw r3, 0x8(r1)
addi r4, r1, 0x8

# Prepare to call EXIImm (80345b64)
lis r3, 0x8034
ori r3, r3, 0x5b64
mtlr r3

# Load input params that haven't been loaded yet
li r3, 0 # slot
li r6, 1 # write mode input. 1 is write
li r7, 0 # r7 is a callback address. Dunno what to use so just set to 0
blrl # Call EXIImm

# Prepare to call EXISync (80345f4c) r3: 0
lis r3, 0x8034
ori r3, r3, 0x5f4c
mtlr r3

# Load input params
li r3, 0
blrl # Call EXISync

#restore registers and sp
lwz r0, 0x10(r1)
addi r1, r1, 0xC
mtlr r0
blr

################################################################################
# Function: EndExiTransfer
# ------------------------------------------------------------------------------
# Description: Wrap up EXI transfer
################################################################################
EndExiTransfer:
mflr r0
stw r0, 0x4(r1)
stwu r1, -0xC(r1)

# Prepare to call EXIDeselect (803467b4) r3: 0
lis r3, 0x8034
ori r3, r3, 0x67b4
mtlr r3

li r3, 0 # Load input params
blrl # Call EXIDeselect

# Prepare to call EXIUnlock (80346e74) r3: 0
lis r3, 0x8034
ori r3, r3, 0x6e74
mtlr r3

li r3, 0 # Load input params
blrl # Call EXIUnlock

# Prepare to call EXIDetach (803465cc) r3: 0
lis r3, 0x8034
ori r3, r3, 0x65cc
mtlr r3

li r3, 0 # Load input params
blrl # Call EXIDetach

#restore registers and sp
lwz r0, 0x10(r1)
addi r1, r1, 0xC
mtlr r0

blr
