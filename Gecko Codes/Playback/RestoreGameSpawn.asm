#To be inserted at 80067d18
################################################################################
#                      Inject at address 80067d18
# Injection point provided by Achilles, runs every time somebody spawns
################################################################################
.include "Common/Common.s"

#replaced code line is executed at the end

# Port A EXI Addresses
# .set EXI_CSR_LOW, 0x6800
# .set EXI_CR_LOW, 0x680C
# .set EXI_DATA_LOW, 0x6810

# Port B EXI Addresses
.set EXI_CSR_LOW, 0x6814
.set EXI_CR_LOW, 0x6820
.set EXI_DATA_LOW, 0x6824

# Payload lengths, if any additional data is added, these must be incremented
.set MESSAGE_DESCIPTIONS_PAYLOAD_LENGTH, 13 # byte count
.set GAME_INFO_PAYLOAD_LENGTH, 352 # byte count
.set GAME_PRE_FRAME_PAYLOAD_LENGTH, 59 # byte count
.set GAME_POST_FRAME_PAYLOAD_LENGTH, 37 # byte count
.set GAME_END_PAYLOAD_LENGTH, 1 # byte count
.set FULL_FRAME_DATA_BUF_LENGTH, 8 * (GAME_PRE_FRAME_PAYLOAD_LENGTH + 1) + 8 * (GAME_POST_FRAME_PAYLOAD_LENGTH + 1) + 1 #784

# Read/write definitions
.set EXI_READ,0
.set EXI_WRITE,1

# Frame data case ID's
.set RESULT_WAIT, 0
.set RESULT_CONTINUE, 1
.set RESULT_TERMINATE, 2

# register names
.set PlayerBlockStatic,31
.set PlayerData,27
.set BufferPointer,30
.set PlayerBackup,29

# gameframe offsets
# header
.set FrameHeaderLength,0x1
.set Status,0x0
# per player
.set PlayerDataLength,0x2D
.set RNGSeed,0x00
.set AnalogX,0x04
.set AnalogY,0x08
.set CStickX,0x0C
.set CStickY,0x10
.set Trigger,0x14
.set Buttons,0x18
.set XPos,0x1C
.set YPos,0x20
.set FacingDirection,0x24
.set ActionStateID,0x28
.set AnalogRawInput,0x2C
#.set Percentage,0x2C

# gameinfo offsets
.set GameInfoLength,0x15D
.set SuccessBool,0x0
.set InfoRNGSeed,0x1
.set MatchStruct,0x5
.set UCFToggles,0x13D

################################################################################
#                   subroutine: receiveGameSpawn
# description: reads inputs from Slippi for a given frame and overwrites
# memory locations
################################################################################
#create stack frame and store link register
backup


# check scene controller to see if we are in game or in results screen
# if in results screen, skip spawn loading
  lis r3, 0x8048
  lbz r3, -0x62CD(r3)
  cmpwi r3, 0x3
  beq- Injection_Exit

# get static block
  lbz r3,0xC(PlayerData)
  branchl r12,0x80031724
  mr PlayerBlockStatic,r3

# get buffer pointer
  lwz BufferPointer,-0x49b4(r13)

# check if the player is a follower
  li r20, 0 # initialize isFollower to false
  lbz	r3, 0x221F (PlayerData)
#Check If Subchar
  rlwinm.	r0, r3, 29, 31, 31
  beq	WRITE_IS_FOLLOWER
#Check If Follower
  lwz r3,0x4(PlayerBlockStatic)
  load	r4,0x803bcde0			#pdLoadCommonData table
  mulli	r0, r3, 3			#struct length
  add	r3,r4,r0			#get characters entry
  lbz	r0, 0x2 (r3)			#get subchar functionality
  cmpwi	r0,0x0			#if not a follower, exit
  bne	WRITE_IS_FOLLOWER
  li r20, 1 # if we get here then we know this is nana
WRITE_IS_FOLLOWER:

# Get players offset in buffer ()
  addi r4,BufferPointer,FrameHeaderLength       #get to player data start
  lbz r5,0xC(PlayerData)                  #get player number
  mulli r5,r5,PlayerDataLength*2          #get players offset
  add r4,r4,r5
  mulli r5,r20,PlayerDataLength           #get offset based on if the player is a follower
  add PlayerBackup,r4,r5

CONTINUE_READ_DATA:

# read positions and write back to proper locations
  lwz r3, XPos(PlayerBackup)
  stw r3, 0xB0(PlayerData) # x position
  lwz r3, YPos(PlayerBackup)
  stw r3, 0xB4(PlayerData) # y position
  lwz r3, FacingDirection(PlayerBackup)
  stw r3, 0x2c(PlayerData) # facing direction

Injection_Exit:
restore
li r0, 255 # this was the value in r0 for some reason from 80067ce4
lfs	f0, 0x002C (r27)
