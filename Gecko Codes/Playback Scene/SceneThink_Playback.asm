#To be inserted at 801a6348
.macro branchl reg, address
lis \reg, \address @h
ori \reg,\reg,\address @l
mtctr \reg
bctrl
.endm

.macro branch reg, address
lis \reg, \address @h
ori \reg,\reg,\address @l
mtctr \reg
bctr
.endm

.macro load reg, address
lis \reg, \address @h
ori \reg, \reg, \address @l
.endm

.macro loadf regf,reg,address
lis \reg, \address @h
ori \reg, \reg, \address @l
stw \reg,-0x4(sp)
lfs \regf,-0x4(sp)
.endm

.macro backup
mflr r0
stw r0, 0x4(r1)
stwu	r1,-0x100(r1)	# make space for 12 registers
stw	r31,0x08(r1)
stw	r30,0x0C(r1)
stw	r29,0x10(r1)
.endm

.macro restore
lwz	r29,0x10(r1)
lwz	r30,0x0C(r1)
lwz	r31,0x08(r1)
addi	r1,r1,0x100	# release the space
lwz r0, 0x4(r1)
mtlr r0
.endm

.set entity,31
.set player,31
.set floats,30

# Port B EXI Addresses
.set EXI_CSR_LOW, 0x6814
.set EXI_CR_LOW, 0x6820
.set EXI_DATA_LOW, 0x6824

.set CHECK_FOR_REPLAY,0x88

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
  mflr	floats

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
  lfs	f2, 0x0(floats)
  bl	Text
  mflr	r4
  branchl	r12,0x803a6b98


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
  #Init EXI Transfer
    lis r5,0xCC00          #top bytes of address of EXI registers
    li  r3,0xD0            #bit pattern to set clock to 8 MHz and enable CS for device 0
    stw r3,0x6814(r5)     #start transfer, write to parameter register
  #Ask for Replay
    li r3,CHECK_FOR_REPLAY
    slwi r3, r3, 24
    li r4, 0x5            #bit pattern to write to control register to write one byte
    bl handleExi
  #Receive Word Response
    li  r4,0x31            #bit pattern to write to control register to read one byte
    bl  handleExi
  #Wait For Replay to be Ready
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

  handleExi:
  #write value in r3 to EXI
    stw r3, EXI_DATA_LOW(r5) #store data into transfer register
    stw r4, EXI_CR_LOW(r5) #write to control register to begin transfer
  handleExiWait:
    lwz r3, EXI_CR_LOW(r5)
    andi. r3, r3, 1
    bne handleExiWait
  #read values from transfer register to r3 for output
    lwz r3, EXI_DATA_LOW(r5) #read from transfer register
    blr

#######################################################

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
