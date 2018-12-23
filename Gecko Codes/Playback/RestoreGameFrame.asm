#To be inserted at 8006b0dc
.include "Common/Common.s"

# Frame data case ID's
.set RESULT_WAIT, 0
.set RESULT_CONTINUE, 1
.set RESULT_TERMINATE, 2

# Register names
.set PlayerData,31
.set PlayerGObj,30
.set PlayerSlot,29
.set PlayerDataStatic,28
.set BufferPointer,27
.set PlayerBackup,26

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

# debug flag
.set debugFlag,0

################################################################################
#                   subroutine: readInputs
# description: reads inputs from Slippi for a given frame and overwrites
# memory locations
################################################################################
# Create stack frame and store link register
  backup

#------------- INITIALIZE -------------
# here we want to initalize some variables we plan on using throughout
  lbz PlayerSlot, 0xC(PlayerData) #loads this player slot

# Get address for static player block
  mr r3,PlayerSlot
  branchl r12,0x80031724
  mr PlayerDataStatic,r3

# get buffer pointer
  lwz BufferPointer,-0x49b4(r13)

  mr  r3,PlayerData
  branchl r12,FN_GetIsFollower

# Get players offset in buffer ()
  addi r4,BufferPointer,FrameHeaderLength  #get to player data start
  lbz r5,0xC(PlayerData)                  #get player number
  mulli r5,r5,PlayerDataLength*2          #get players offset
  add r4,r4,r5
  mulli r5,r20,PlayerDataLength           #get offset based on if the player is a follower
  add PlayerBackup,r4,r5

CONTINUE_READ_DATA:

.if debugFlag==1
CheckForDesync:
  lfs f1,XPos(PlayerBackup)
  lfs f2,0xB0(PlayerData)
  fcmpo cr0,f1,f2
  bne DesyncDetected
  lfs f1,YPos(PlayerBackup)
  lfs f2,0xB4(PlayerData)
  fcmpo cr0,f1,f2
  bne DesyncDetected
  lfs f1,FacingDirection(PlayerBackup)
  lfs f2,0x2C(PlayerData)
  fcmpo cr0,f1,f2
  bne DesyncDetected
  lwz r4,ActionStateID(PlayerBackup)
  lwz r5,0x10(PlayerData)
  cmpw r4,r5
  bne DesyncDetected
  b RestoreData

DesyncDetected:
  bl  DumpFrameData
.endif

RestoreData:
# Restore data
  lis r4,0x804D
  lwz r3,RNGSeed(PlayerBackup)
  stw r3,0x5F90(r4) #RNG seed
  lwz r3,AnalogX(PlayerBackup)
  stw r3,0x620(PlayerData) #analog X
  lwz r3,AnalogY(PlayerBackup)
  stw r3,0x624(PlayerData) #analog Y
  lwz r3,CStickX(PlayerBackup)
  stw r3,0x638(PlayerData) #cstick X
  lwz r3,CStickY(PlayerBackup)
  stw r3,0x63C(PlayerData) #cstick Y
  lwz r3,Trigger(PlayerBackup)
  stw r3,0x650(PlayerData) #trigger
  lwz r3,Buttons(PlayerBackup)
  stw r3,0x65C(PlayerData) #buttons
  lwz r3,XPos(PlayerBackup)
  stw r3,0xB0(PlayerData) #x position
  lwz r3,YPos(PlayerBackup)
  stw r3,0xB4(PlayerData) #y position
  lwz r3,FacingDirection(PlayerBackup)
  stw r3,0x2C(PlayerData) #facing direction
  lwz r3,ActionStateID(PlayerBackup)
  stw r3,0x10(PlayerData) #animation state ID

# UCF uses raw controller inputs for dashback, restore x analog byte here
  lis r3, 0x8046  # start location of circular buffer
  ori r3, r3, 0xb108
# Get offset in raw controller input buffer
  lis r4, 0x804c
  ori r4, r4, 0x1f78
  lbz r4, 0x0001(r4) # this is the current index in the circular buffer
  subi r4, r4, 1
  cmpwi r4, 0
  bge+ CONTINUE_RAW_X # if our index is already 0 or greater, continue
  addi r4, r4, 5 # here our index was -1, this should wrap around to be 4
  CONTINUE_RAW_X:
  mulli r4, r4, 0x30
  add r3, r3, r4 # move to the correct start index for this index
# Get this players controller offset
  mulli r4, PlayerSlot, 0xc
  add r20, r3, r4 # move to the correct player position
# Get backed up input value
  lbz r3,AnalogRawInput(PlayerBackup)
  stb r3, 0x2(r20) #store raw x analog


.if debugFlag==1

  b Injection_Exit

##############################################################
## Dump Frame Data Upon Desync
###############################################################
DumpFrameData:
backup

# Output data
#Divider
  bl  DividerText
  mflr r3
  branchl r12,0x803456a8
#Frame
  bl  FrameText
  mflr  r3
  addi  r4,PlayerSlot,1
  lis r5,0x8048
  lwz r5,-0x62A8(r5) # load scene controller frame count
  lis r6,0x8047
  lwz r6,-0x493C(r6) #load match frame count
  cmpwi r6, 0
  bne DontAdjustFrame #this makes it so that if the timer hasn't started yet, we have a unique frame count still
  sub r6,r6,r5
  li r5,-0x7B
  sub r5,r5,r6
  DontAdjustFrame:
  branchl r12,0x803456a8
#XPos
  bl  XPosText
  mflr  r3
  lfs f1,0xB0(PlayerData)
  lfs f2,XPos(PlayerBackup)
  branchl r12,0x803456a8
#YPos
  bl  YPosText
  mflr  r3
  lfs f1,0xB4(PlayerData)
  lfs f2,YPos(PlayerBackup)
  branchl r12,0x803456a8
#Facing Direction
  bl  FacingText
  mflr  r3
  lfs f1,0x2C(PlayerData)
  lfs f2,FacingDirection(PlayerBackup)
  branchl r12,0x803456a8
#AS
  bl  ASText
  mflr  r3
  lwz r4,0x10(PlayerData)
  lwz r5,ActionStateID(PlayerBackup)
  branchl r12,0x803456a8

restore
blr

######################################################################

  FrameText:
  blrl
  .string "P%d Frame: %d // Original // Restored"
  .align 2

  XPosText:
  blrl
  .string "X Position: %f // %f"
  .align 2

  YPosText:
  blrl
  .string "Y Position: %f // %f"
  .align 2

  FacingText:
  blrl
  .string "Facing Direction: %1.0f // %1.0f"
  .align 2

  ASText:
  blrl
  .string "Action State: 0x%X // 0x%X"
  .align 2

  DividerText:
  blrl
  .string "------Desync Detected--------"
  .align 2

.endif
#######################################################################

Injection_Exit:
  restore             #restore registers and lr
  lbz r0, 0x2219(r31) #execute replaced code line
