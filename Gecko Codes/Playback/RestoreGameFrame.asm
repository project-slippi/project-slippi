#To be inserted at 8006b0dc
################################################################################
#                      Inject at address 8006b0dc
# Function is PlayerThink_ControllerInputsToDataOffset. Injection location
# suggested by Achilles
################################################################################
.macro branchl reg, address
lis \reg, \address @h
ori \reg,\reg,\address @l
mtctr \reg
bctrl
.endm

.macro backup
mflr r0
stw r0, 0x4(r1)
stwu	r1,-0x50(r1)	# make space for 12 registers
stmw  r20,0x8(r1)
.endm

 .macro restore
lmw  r20,0x8(r1)
lwz r0, 0x54(r1)
addi	r1,r1,0x50	# release the space
mtlr r0
.endm

.macro load reg, address
lis \reg, \address @h
ori \reg, \reg, \address @l
.endm


#replaced code line is executed at the end

# Port A EXI Addresses
# .set EXI_CSR_LOW, 0x6800
# .set EXI_CR_LOW, 0x680C
# .set EXI_DATA_LOW, 0x6810

# Port B EXI Addresses
.set EXI_CSR_LOW, 0x6814
.set EXI_CR_LOW, 0x6820
.set EXI_DATA_LOW, 0x6824

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

# Read/write definitions
.set EXI_READ,0
.set EXI_WRITE,1

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

# check if the player is a follower
  li r20, 0 # initialize isFollower to false
  lbz	r3, 0x221F (PlayerData)
#Check If Subchar
  rlwinm.	r0, r3, 29, 31, 31
  beq	WRITE_IS_FOLLOWER
#Check If Follower
  lwz r3,0x4(PlayerDataStatic)
  load	r4,0x803bcde0			#pdLoadCommonData table
  mulli	r0, r3, 3			#struct length
  add	r3,r4,r0			#get characters entry
  lbz	r0, 0x2 (r3)			#get subchar functionality
  cmpwi	r0,0x0			#if not a follower, exit
  bne	WRITE_IS_FOLLOWER
  li r20, 1 # if we get here then we know this is nana
WRITE_IS_FOLLOWER:

# Get players offset in buffer ()
  addi r4,BufferPointer,FrameHeaderLength  #get to player data start
  lbz r5,0xC(PlayerData)                  #get player number
  mulli r5,r5,PlayerDataLength*2          #get players offset
  add r4,r4,r5
  mulli r5,r20,PlayerDataLength           #get offset based on if the player is a follower
  add PlayerBackup,r4,r5

CONTINUE_READ_DATA:
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

Injection_Exit:
  restore             #restore registers and lr
  lbz r0, 0x2219(r31) #execute replaced code line
