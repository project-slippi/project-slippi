#To be inserted at 8016e2dc
################################################################################
#                      Inject at address 8016e2dc
# Function is PlayerThink_ControllerInputsToDataOffset. Injection location
# suggested by Achilles
################################################################################
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

# Function names
.set FetchFrameInfo,0x800055f4

################################################################################
#                   subroutine: LoadFirstSpawn
# description: per frame function that will handle fetching the current frame's
# data and storing it to the buffer
################################################################################

# Get GameFrame
  li  r3,0
  branchl r12,FetchFrameInfo

Original:
  lbz	r0, 0x0007 (r31)
