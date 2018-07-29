################################################################################
# Function: SlippiRecording
# ------------------------------------------------------------------------------
# Description: This is the main entry point for a few injected codes. The
# branches to this code will be added manually via other codes. The branches
# must set the link register because that is what will be used to decide which
# function to execute. Everything is done in one code to allow for sharing the
# EXI functions
# ------------------------------------------------------------------------------
# Injection Address: 8032ED8C (Screenshot Code Region)
# ------------------------------------------------------------------------------
# Supports branching from:
# 8016e74c (SendGameInfo)
# 8006b0dc (SendGamePreFrame)
# 8006c5d4 (SendGamePostFrame)
# 801a5b04 (SendGameEnd)
# ------------------------------------------------------------------------------
# Register Usage:
# r14 - used for persistent local variables
# r15 - used for persistent local variables
# r16 - used for persistent local variables
# r24 - write buffer length
# r25 - address of current write location
# r26 - address of write buffer
# r27-r31 - reserved for external function inputs (player block address, etc)
################################################################################

.set MEM_SLOT, 0 # 0 is SlotA, 1 is SlotB

# Payload lengths, if any additional data is added, these must be incremented
.set MESSAGE_DESCIPTIONS_PAYLOAD_LENGTH, 13 # byte count
.set GAME_INFO_PAYLOAD_LENGTH, 352 # byte count
.set GAME_PRE_FRAME_PAYLOAD_LENGTH, 58 # byte count
.set GAME_POST_FRAME_PAYLOAD_LENGTH, 37 # byte count
.set GAME_END_PAYLOAD_LENGTH, 1 # byte count

# Create stack frame and back up every register. For now this is just ultra
# safe partially to save space and also because the locations we are branching
# from were not originally designed to be branched from in those locations
stwu r1, -0x100(r1)
stw r14, 0x8(r1)
stw r15, 0xC(r1)
stw r16, 0x10(r1)
stw r3, 0x14(r1) # Needed for game end code
stw r24, 0x18(r1)
stw r25, 0x1C(r1)
stw r26, 0x20(r1)
mflr r0
stw r0, 0x104(r1)

# scene controller checks. must be in VS mode (major) and in-game (minor)
lis r4, 0x8048 # load address to offset from for scene controller
lbz r3, -0x62D0(r4)
cmpwi r3, 0x2 # the major scene for VS Mode is 0x2
bne- CLEANUP # if not in VS Mode, ignore everything
lbz r3, -0x62CD(r4)
cmpwi r3, 0x2 # the minor scene for in-game is 0x2
bne- CLEANUP

# Move value of the lr to r3 for determining where we came from
# I could have used r0 directly but doing this way allows for future bl calls
# in the "should run" checks
lwz r3, 0x104(r1)

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
#------------- WRITE OUT COMMAND SIZES -------------
# prepare write buffer with size able to fit payload
li r3, MESSAGE_DESCIPTIONS_PAYLOAD_LENGTH
bl PrepareWriteBuffer

# start file sending and indicate the sizes of the output commands
li r3, 0x35
bl PushByte

# write out the payload size of the 0x35 command (includes this byte)
# we can write this in only a byte because I doubt it will ever be larger
# than 255. We write out the sizes of the other commands as half words for
# consistent parsing
li r3, MESSAGE_DESCIPTIONS_PAYLOAD_LENGTH
bl PushByte

# game info command
li r3, 0x36
bl PushByte
li r3, GAME_INFO_PAYLOAD_LENGTH
bl PushHalf

# pre-frame update command
li r3, 0x37
bl PushByte
li r3, GAME_PRE_FRAME_PAYLOAD_LENGTH
bl PushHalf

# post-frame update command
li r3, 0x38
bl PushByte
li r3, GAME_POST_FRAME_PAYLOAD_LENGTH
bl PushHalf

# game end command
li r3, 0x39
bl PushByte
li r3, GAME_END_PAYLOAD_LENGTH
bl PushHalf

bl ExiTransferBuffer
bl FreeBuffer

#------------- BEGIN GAME INFO COMMAND -------------
# prepare write buffer with size able to fit payload
li r3, GAME_INFO_PAYLOAD_LENGTH
bl PrepareWriteBuffer

# game information message type
li r3, 0x36
bl PushByte

# build version number. Each byte is one digit
# any change in command data should result in a minor version change
# current version: 1.0.0.0
# Version is of the form major.minor.build.revision. A change to major
# indicates breaking changes/loss of backwards compatibility. A change
# to minor indicates a pretty major change like added fields or new
# events. Build/Revision can be incremented for smaller changes
lis r3, 0x0100
addi r3, r3, 0x0000
bl PushWord

#------------- GAME INFO BLOCK -------------
# this iterates through the static game info block that is used to pull data
# from to initialize the game. it writes out the whole thing (0x138 long)
li r14, 0
START_GAME_INFO_LOOP:
add r3, r31, r14
lwz r3, 0x0(r3)
bl PushWord

addi r14, r14, 0x4
cmpwi r14, 0x138
blt+ START_GAME_INFO_LOOP

#------------- OTHER INFO -------------
# write out random seed
lis r3, 0x804D
lwz r3, 0x5F90(r3) #load random seed
bl PushWord

# write UCF toggle bytes
lis r14, 0x804D
START_UCF_LOOP:
lwz r3, 0x1FB0(r14) #load UCF toggle
bl PushWord

addi r14, r14, 0x4
andi. r3, r14, 0xFFFF # Grab the bottom of the loop address
cmpwi r3, 0x20 # Stop looping after 8 iterations
blt+ START_UCF_LOOP

bl ExiTransferBuffer
bl FreeBuffer

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
# prepare write buffer with size able to fit payload
li r3, GAME_PRE_FRAME_PAYLOAD_LENGTH
bl PrepareWriteBuffer

li r3, 0x37
bl PushByte #send OnPreFrameUpdate event code

bl GetFrameCount
bl PushWord

mr r3, r14 #player slot
bl PushByte

mr r3, r30
mr r4, r15
bl GetIsFollower
bl PushByte

lis r3, 0x804D
lwz r3, 0x5F90(r3) #load random seed
bl PushWord

lwz r3, 0x70(r30) #load action state ID
bl PushHalf
lwz r3, 0x110(r30) #load x coord
bl PushWord
lwz r3, 0x114(r30) #load y coord
bl PushWord
lwz r3, 0x8C(r30) #load facing direction
bl PushWord
lwz r3, 0x680(r30) #load Joystick X axis
bl PushWord
lwz r3, 0x684(r30) #load Joystick Y axis
bl PushWord
lwz r3, 0x698(r30) #load c-stick X axis
bl PushWord
lwz r3, 0x69c(r30) #load c-stick Y axis
bl PushWord
lwz r3, 0x6b0(r30) #load analog trigger input
bl PushWord
lwz r3, 0x6bc(r30) #load buttons pressed this frame
bl PushWord

#get raw controller inputs
lis r16, 0x804C
ori r16, r16, 0x1FAC
mulli r3, r14, 0x44
add r16, r16, r3

lhz r3, 0x2(r16) #load constant button presses
bl PushHalf
lwz r3, 0x30(r16) #load l analog trigger
bl PushWord
lwz r3, 0x34(r16) #load r analog trigger
bl PushWord

bl ExiTransferBuffer
bl FreeBuffer

b CLEANUP

################################################################################
# Routine: SendGamePostFrame
# ------------------------------------------------------------------------------
# Description: Gets information relevant to calculating stats and writes
# it to Slippi device
################################################################################
SEND_GAME_POST_FRAME:
# check if this character is in the inactive state (sheik/zelda)
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
# prepare write buffer with size able to fit payload
li r3, GAME_POST_FRAME_PAYLOAD_LENGTH
bl PrepareWriteBuffer

li r3, 0x38
bl PushByte #send OnPostFrameUpdate event code

bl GetFrameCount
bl PushWord

mr r3, r14 #player slot
bl PushByte

mr r3, r29
mr r4, r15
bl GetIsFollower
bl PushByte

lwz r3, 0x64(r29) #load internal char ID
bl PushByte
lwz r3, 0x70(r29) #load action state ID
bl PushHalf
lwz r3, 0x110(r29) #load x coord
bl PushWord
lwz r3, 0x114(r29) #load y coord
bl PushWord
lwz r3, 0x8C(r29) #load facing direction
bl PushWord
lwz r3, 0x1890(r29) #load current damage
bl PushWord
lwz r3, 0x19f8(r29) #load shield size
bl PushWord
lwz r3, 0x20ec(r29) #load last attack landed
bl PushByte
lhz r3, 0x20f0(r29) #load combo count
bl PushByte
lwz r3, 0x1924(r29) #load player who last hit this player
bl PushByte

lbz r3, 0x8E(r15) # load stocks remaining
bl PushByte

lwz r3, 0x8F4(r29) # load action state frame counter
bl PushWord

bl ExiTransferBuffer
bl FreeBuffer

b CLEANUP

################################################################################
# Routine: SendGameEnd
# ------------------------------------------------------------------------------
# Description: Send information about the end of a game to Slippi Device
################################################################################
SEND_GAME_END:
# prepare write buffer with size able to fit payload
li r3, GAME_END_PAYLOAD_LENGTH
bl PrepareWriteBuffer

# request game information from slippi
li r3, 0x39
bl PushByte

#check byte that will tell us whether the game was won by stock loss or by ragequit
lis r3, 0x8047
lbz r3, -0x4960(r3)
bl PushByte #send win condition byte. this byte will be 0 on ragequit, 3 on win by stock loss

bl ExiTransferBuffer
bl FreeBuffer

b CLEANUP

################################################################################
# Routine: Cleanup
# ------------------------------------------------------------------------------
# Description: Will be called from every path. It will recover the registers
# and the stack and will fork to execute the replaced lines of code
################################################################################
CLEANUP:
# Recover stack frame
lwz r0, 0x104(r1)
mtlr r0 # Put the stored lr back
lwz r14, 0x8(r1)
lwz r15, 0xC(r1)
lwz r16, 0x10(r1)
lwz r3, 0x14(r1) # Needed for game end code
lwz r24, 0x18(r1)
lwz r25, 0x1C(r1)
lwz r26, 0x20(r1)
addi r1, r1, 0x100 # restore sp

# Fork on lr value to replace correct code
mflr r9

# Fork to SendGameInfo if we came from 8016e74c
lis r8, 0x8016
ori r8, r8, 0xe750
cmpw r9, r8
beq RESTORE_SEND_GAME_INFO

# Fork to SendGamePreFrame if we came from 8006b0dc
lis r8, 0x8006
ori r8, r8, 0xb0e0
cmpw r9, r8
beq RESTORE_SEND_GAME_PRE_FRAME

# Fork to SendGamePostFrame if we came from 8006c5d4
lis r8, 0x8006
ori r8, r8, 0xc5d8
cmpw r9, r8
beq RESTORE_SEND_GAME_POST_FRAME

# Fork to SendGameEnd if we came from 801a5b04
lis r8, 0x801a
ori r8, r8, 0x5b08
cmpw r9, r8
beq RESTORE_SEND_GAME_END

# If lr did not match any sources, just return
blr

RESTORE_SEND_GAME_INFO:
lis r3, 0x8017 #execute replaced code line
blr

RESTORE_SEND_GAME_PRE_FRAME:
lbz r0, 0x2219(r31) #execute replaced code line
blr

RESTORE_SEND_GAME_POST_FRAME:
lwz r0, 0x3C(r1) #execute replaced code line
blr

RESTORE_SEND_GAME_END:
addi r28, r5, 0 #execute replaced code line
blr

################################################################################
# Function: PrepareWriteBuffer
# ------------------------------------------------------------------------------
# Description: Prepares memory buffer where data will be written to before
# it is sent to the EXI bus
# ------------------------------------------------------------------------------
# Inputs:
# r3 - Payload byte count. Size will be 1 greater than this to fit command
# ------------------------------------------------------------------------------
# Outputs: (Non-standard because this output is used code-wide)
# r24 - write buffer length
# r25 - address of allocated memory (serves as current write location)
# r26 - address of allocated memory
################################################################################
PrepareWriteBuffer:
# Store stack frame
mflr r0
stw r0, 0x4(r1)
stwu r1, -0x20(r1)

addi r24, r3, 1 # add 1 to payload length to fit command byte

# Prepare to call _HSD_MemAlloc (8037f1e4)
lis r3, 0x8037
ori r3, r3, 0xf1e4
mtlr r3
mr r3, r24 # size to alloc
blrl

mr r25, r3 # store pointer to memory location
mr r26, r3 # store pointer to memory location

#restore registers and sp
lwz r0, 0x24(r1)
addi r1, r1, 0x20
mtlr r0

blr

PushByte:
stb r3, 0x0(r25)
addi r25, r25, 1
blr

PushHalf:
sth r3, 0x0(r25)
addi r25, r25, 2
blr

PushWord:
stw r3, 0x0(r25)
addi r25, r25, 4
blr

################################################################################
# Function: FreeBuffer
# ------------------------------------------------------------------------------
# Description: Prepares memory buffer where data will be written to before
# it is sent to the EXI bus
# ------------------------------------------------------------------------------
# Inputs:
# r26 - address of allocated memory
################################################################################
FreeBuffer:
# Store stack frame
mflr r0
stw r0, 0x4(r1)
stwu r1,-0x20(r1)

# Prepare to call HSD_Free (8037f1b0)
lis r3, 0x8037
ori r3, r3, 0xf1b0
mtlr r3
mr r3, r26 # Pass address to free function
blrl

#restore registers and sp
lwz r0, 0x24(r1)
addi r1, r1, 0x20
mtlr r0

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
# Function: ExiTransferBuffer
# ------------------------------------------------------------------------------
# Description: Sets up EXI slot, writes buffer via DMA, closes EXI slot
################################################################################
ExiTransferBuffer:
# Store stack frame
mflr r0
stw r0, 0x4(r1)
stwu r1,-0x20(r1)

# Step 1 - Prepare slot
# Prepare to call EXIAttach (803464c0) r3: 0, r4: 803522a8
lis r3, 0x8034
ori r3, r3, 0x64c0
mtlr r3

# Load input params
li r3, MEM_SLOT # slot
li r4, 0 # maybe a callback? leave 0
blrl # Call EXIAttach

# Prepare to call EXILock (80346d80) r3: 0
lis r3, 0x8034
ori r3, r3, 0x6d80
mtlr r3

# Load input params
li r3, MEM_SLOT # slot
blrl # Call EXILock

# Prepare to call EXISelect (80346688) r3: 0, r4: 0, r5: 4
lis r3, 0x8034
ori r3, r3, 0x6688
mtlr r3

# Load input params
li r3, MEM_SLOT # slot
li r4, 0 # device
li r5, 5 # freq
blrl # Call EXISelect

# Step 2 - Write
# Prepare to call EXIDma (80345e60)
lis r3, 0x8034
ori r3, r3, 0x5e60
mtlr r3

# Load input params that haven't been loaded yet
li r3, MEM_SLOT # slot
mr r4, r26
mr r5, r24
li r6, 1 # write mode input. 1 is write
li r7, 0 # r7 is a callback address. Dunno what to use so just set to 0
blrl # Call EXIDma

# Prepare to call EXISync (80345f4c) r3: 0
lis r3, 0x8034
ori r3, r3, 0x5f4c
mtlr r3

# Load input params
li r3, MEM_SLOT # slot
blrl # Call EXISync

# Step 3 - Close slot
# Prepare to call EXIDeselect (803467b4) r3: 0
lis r3, 0x8034
ori r3, r3, 0x67b4
mtlr r3

li r3, MEM_SLOT # Load input param for slot
blrl # Call EXIDeselect

# Prepare to call EXIUnlock (80346e74) r3: 0
lis r3, 0x8034
ori r3, r3, 0x6e74
mtlr r3

li r3, MEM_SLOT # Load input param for slot
blrl # Call EXIUnlock

# Prepare to call EXIDetach (803465cc) r3: 0
lis r3, 0x8034
ori r3, r3, 0x65cc
mtlr r3

li r3, MEM_SLOT # Load input param for slot
blrl # Call EXIDetach

#restore registers and sp
lwz r0, 0x24(r1)
addi r1, r1, 0x20
mtlr r0

blr
