#To be inserted at 8016e74c
################################################################################
#                      Inject at address 8016e74c
# Function is StartMelee and we are loading game information right before
# it gets read to initialize the match
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

# Read/write definitions
.set EXI_READ,0
.set EXI_WRITE,1

# Register names
.set BufferPointer,30

# Function names
.set FetchFrameInfo,0x800055f4

################################################################################
#                   subroutine: gameInfoLoad
# description: reads game info from slippi and loads those into memory
# addresses that will be used
################################################################################
# create stack frame and store link register
  backup

# allocate memory for the gameframe buffer used here and in ReceiveGameFrame
  li  r3,(PlayerDataLength*8)+FrameHeaderLength
  branchl r12,0x8037f1e4
  mr  BufferPointer,r3
  stw BufferPointer,-0x49b4(r13)

# create per frame function to fetch the game frame
# Create GObj
  li	r3,6		#GObj Type
  li	r4,7		#On-Pause Behavior
  li	r5,80
  branchl	r12,0x803901f0
# Schedule Function
  load r4,FetchFrameInfo
  li  r5,0    #Priority
  branchl	r12,0x8038fd54

# get the game info data
REQUEST_DATA:
# request game information from slippi
  li r3,0x75        # store game info request ID
  stb r3,0x0(BufferPointer)
# Transfer buffer over DMA
  mr r3,BufferPointer   #Buffer Pointer
  li  r4,0x1            #Buffer Length
  li  r5,EXI_WRITE
  branchl r12,0x800055f0
RECEIVE_DATA:
# Transfer buffer over DMA
  mr  r3,BufferPointer
  li  r4,GameInfoLength     #Buffer Length
  li  r5,EXI_READ
  branchl r12,0x800055f0
# Check if successful
  lbz r3,0x0(BufferPointer)
  cmpwi r3, 1
  beq READ_DATA
# Wait a frame before trying again
  branchl r12,0x8034f314 #VIWaitForRetrace
  b REQUEST_DATA

READ_DATA:
  lwz r3,InfoRNGSeed(BufferPointer)
  lis r4, 0x804D
  stw r3, 0x5F90(r4) #store random seed

#------------- GAME INFO BLOCK -------------
# this iterates through the static game info block that is used to pull data
# from to initialize the game. it reads the whole thing from slippi and writes
# it back to memory. (0x138 bytes long)
  mr  r3,r31                        #Match setup struct
  addi r4,BufferPointer,MatchStruct #Match info from slippi
  li  r5,0x138                      #Match struct length
  branchl r12,0x800031f4

#------------- OTHER INFO -------------
# write UCF toggle bytes
  load r3,0x804D1FB0
  addi r4,BufferPointer,UCFToggles
  li  r5,0x20
  branchl r12,0x800031f4


Injection_Exit:
restore
lis r3, 0x8017 #execute replaced code line
