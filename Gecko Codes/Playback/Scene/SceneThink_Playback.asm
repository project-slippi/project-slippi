#To be inserted at 801a6348
.include "../../Common/Common.s"

.set REG_Floats, 30
.set REG_BufferPointer, 29

#############################
# Create Per Frame Function #
#############################

#Check If Major Scene 0xE
  load	r3,0x80479D30   #Scene Controller
  lbz r3,0x0(r3)        #Major Scene ID
  cmpwi r3,0xE          #DebugMelee
  bne Original

#Create GObj
  li	r3, 13
  li	r4,14
  li	r5,0
  branchl	r12,0x803901f0

#Schedule Function
  bl  PlaybackThink
  mflr  r4      #Function to Run
  li  r5,0      #Priority
  branchl r12,0x8038fd54

b Exit



###########################
# Playback Think Function #
###########################

PlaybackThink:
blrl

  backup

  ##############################
  ## Start Error Message Init ##
  ##############################

  #Get Float Values
  bl	FloatValues
  mflr	REG_Floats

  #Create Text Struct
  li	r3,0
  li	r4,-1
  branchl	r12,0x803a6754
  stw	r3, -0x52D0 (r13)

  #Set Text Size and Spacing
  lfs	f0, -0x7D58 (rtoc)
  stfs	f0, 0x0024 (r3)
  lfs	f0, -0x7D54 (rtoc)
  stfs	f0, 0x0028 (r3)

  li	r0, 1
  stb	r0, 0x004A (r3)
  stb	r0, 0x0049 (r3)



  ######################
  ## Print Lines Loop ##
  ######################

  PlaybackThink_InitText:
  lwz	r3, -0x52D0 (r13)
  lfs	f1, -0x7D50 (rtoc)
  lfs	f2, 0x0(REG_Floats)
  bl	Text
  mflr	r4
  branchl	r12,0x803a6b98

  ###########################
  ## Allocate Buffer Space ##
  ###########################

  li  r3,0x20
  branchl r12,0x8037f1e4
  mr  REG_BufferPointer,r3

  ########################
  ## Message Think Loop ##
  ########################

  PlaybackThink_Loop:
  branchl	r12,0x8033c898			#GXInvalidateCache
  branchl	r12,0x8033f270			#GXInvalidateTexAll

  li	r3,0x0
  branchl	r12,0x80375538			#HSD_StartRender

  li	r3,0x0
  lwz	r4, -0x52D0 (r13)
  branchl	r12,0x803a84bc			#renderTextOnscreen

  li	r3,0x0
  branchl	r12,0x803761c0			#HSD_VICopyXFBASync

  #Check For EXI
  PlaybackThink_CheckEXI:
  RequestReplay:
    li r3,CONST_SlippiCmdCheckForReplay
    stb r3,0x0(REG_BufferPointer)
    mr r3,REG_BufferPointer
    li  r4,0x1                #Length
    li  r5,CONST_ExiWrite
    branchl r12,FN_EXITransferBuffer
  ReceiveReplay:
    mr r3,REG_BufferPointer
    li  r4,0x1                #Length
    li  r5,CONST_ExiRead
    branchl r12,FN_EXITransferBuffer
  #Wait For Replay to be Ready
    lbz r3,0x0(REG_BufferPointer)
    cmpwi r3,0x1
    bne PlaybackThink_Loop

  ###############
  ## Exit Loop ##
  ###############

  PlaybackThink_ExitLoop:

  #Remove Text
  lwz	r3, -0x52D0 (r13)
  branchl	r12,0x803a5cc4

  #Resume
  branchl	r12,0x80024f6c

  #Play SFX
  li	r3,0x1
  branchl	r12,0x80024030

  #Change Scene Minor
  branchl r12,0x801a4b60

  b	PlaybackThink_Exit

######################################################

  FloatValues:
  blrl
  .float -80		#Y Initial

  Text:
  blrl
  .string "Waiting for game..."
  .align 2

  PlaybackThink_Exit:
  restore
  blr

################################################################

##################
# Exit Injection #
###################

Exit:
branch r12,0x801a6368

Original:
lwz	r3, 0 (r31)
