#To be inserted at 800055f4
################################################################################
#                      Inject at address 800055f4
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
.set FrameNumber,25

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
#                   subroutine: FetchFrameInfo
# description: per frame function that will handle fetching the current frame's
# data and storing it to the buffer
################################################################################

FetchFrameInfo:

backup
lwz BufferPointer,-0x49b4(r13)

# check if from LoadFirstSpawn
  cmpwi r3,0
  beq FromLoadFirstSpawn
# request frame number
  lis r4,0x8048
  lwz r4,-0x62A8(r4) # load scene controller frame count
  lis r3,0x8047
  lwz FrameNumber,-0x493C(r3) #load match frame count
  cmpwi FrameNumber, 0
  bne FetchFrameInfo_REQUEST_DATA #this makes it so that if the timer hasn't started yet, we have a unique frame count still
  sub FrameNumber,FrameNumber,r4
  li r4,-0x7B
  sub FrameNumber,r4,FrameNumber
  b FetchFrameInfo_REQUEST_DATA
FromLoadFirstSpawn:
  li  FrameNumber,-123

FetchFrameInfo_REQUEST_DATA:
# request game information from slippi
  li r3,0x76        # store gameframe request ID
  stb r3,0x0(BufferPointer)
  stw FrameNumber,0x1(BufferPointer)
# Transfer buffer over DMA
  mr  r3,BufferPointer   #Buffer Pointer
  li  r4,0x5            #Buffer Length
  li  r5,EXI_WRITE
  branchl r12,0x800055f0
FetchFrameInfo_RECEIVE_DATA:
# Transfer buffer over DMA
  mr  r3,BufferPointer
  li  r4,(PlayerDataLength*8)+FrameHeaderLength      #Buffer Length
  li  r5,EXI_READ
  branchl r12,0x800055f0
# Check if successful
  lbz r3,Status(BufferPointer)
  cmpwi r3, 0
  bne FetchFrameInfo_ENDGAME_CHECK
# Wait a frame before trying again
  branchl r12,0x8034f314 #VIWaitForRetrace
  b FetchFrameInfo_REQUEST_DATA
FetchFrameInfo_ENDGAME_CHECK:
#Get status of this player's frame data
  lbz r3,Status(BufferPointer)
  cmpwi r3, RESULT_CONTINUE
  beq FetchFrameInfo_Exit
END_GAME:
  li  r3,-1  #Unk
  li  r4,7   #GameEnd ID (7 = LRA Start)
  branchl r12,0x8016cf4c

FetchFrameInfo_Exit:
restore
blr
#-----------------------------------------------
