#To be inserted at 800055f4
################################################################################
#                      Inject at address 800055f4
# Function is PlayerThink_ControllerInputsToDataOffset. Injection location
# suggested by Achilles
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

# function names
.set GetFrameIndex,0x800055fc

# debug flag
.set debugFlag,0

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
  branchl r12,GetFrameIndex
  mr  FrameNumber,r3
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
  branchl r12,0x8034f314     #VIWaitForRetrace
.if debugFlag==1
# OSReport
  branchl r12,GetFrameIndex
  mr r4,r3
  bl  WaitAFrameText
  mflr r3
  branchl r12,0x803456a8
.endif
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

.if debugFlag==1
b FetchFrameInfo_Exit
#################################
WaitAFrameText:
blrl
.string "Waiting on frame %d"
.align 2
#################################
.endif

FetchFrameInfo_Exit:
restore
blr
#-----------------------------------------------
