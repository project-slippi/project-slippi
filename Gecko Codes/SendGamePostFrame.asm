################################################################################
#                      Inject at address 8006C0D8
# Function is PlayerThink_Physics. Consider instead 8006c5d4 which is
# PlayerThink_Collision and is the last update
################################################################################

#replaced code line is executed at the end

################################################################################
#                   subroutine: writeStats
#  description: writes stats to EXI port on each frame
################################################################################
#create stack frame and store link register
mflr r0
stw r0, 0x4(r1)
stwu r1,-0x20(r1)

#check if in single player mode, and ignore code if so
lis r3,0x801A # load SinglePlayer_Check function
ori r3,r3,0x4340
mtlr r3
lis r3,0x8048
lbz r3,-0x62D0(r3) #load menu controller major
blrl
cmpwi r3,1 # is this single player mode?
beq- CLEANUP # if in single player, ignore everything

# check scene controller to see if we are in game or in results screen
# if in results screen, skip
lis r3, 0x8048
lbz r3, -0x62CD(r3)
cmpwi r3, 0x3
beq- CLEANUP

#------------- INITIALIZE -------------
# here we want to initalize some variables we plan on using throughout
lbz r7, 0x6C(r24) #loads this player slot

# generate address for static player block
lis r8, 0x8045
ori r8, r8, 0x3080
mulli r3, r7, 0xE90
add r8, r8, r3

#------------- FRAME_UPDATE -------------
bl startExiTransfer #indicate transfer start

li r3, 0x38
bl sendByteExi #send OnPostFrameUpdate event code

# Compute and send frame count (supports negatives before timer starts)
lis r4,0x8048
lwz r4,-0x62A8(r4) # load scene controller frame count
lis r3,0x8047
lwz r3,-0x493C(r3) #load match frame count
cmpwi r3, 0
bne SKIP_FRAME_COUNT_ADJUST #this makes it so that if the timer hasn't started yet, we have a unique frame count still
sub r3,r3,r4
li r4,-0x7B
sub r3,r4,r3

SKIP_FRAME_COUNT_ADJUST:
bl sendWordExi

lis r3, 0x804D
lwz r3, 0x5F90(r3) #load random seed
bl sendWordExi

mr r3, r7 #player slot
bl sendByteExi

li r4, 0 # initialize isFollower to false

# check if we are playing ice climbers, if we are we need to check if this is nana
lwz r3, 0x4(r8)
cmpwi r3, 0xE
bne+ WRITE_IS_FOLLOWER

# we need to check if this is a follower (nana). should not save inputs for nana
lwz r3, 0xB4(r8) # load pointer to follower for this port
cmpw r3, r24 # compare follower pointer with current pointer
bne WRITE_IS_FOLLOWER # if the two  dont match, this is popo

li r4, 1 # if we get here then we know this is nana

WRITE_IS_FOLLOWER:
mr r3, r4 # stage isFollower bool for writing
bl sendByteExi

lwz r3, 0x64(r24) #load internal char ID
bl sendByteExi
lwz r3, 0x70(r24) #load action state ID
bl sendHalfExi
lwz r3, 0x110(r24) #load x coord
bl sendWordExi
lwz r3, 0x114(r24) #load y coord
bl sendWordExi
lwz r3, 0x8C(r24) #load facing direction
bl sendWordExi
lwz r3, 0x1890(r24) #load current damage
bl sendWordExi
lwz r3, 0x19f8(r24) #load shield size
bl sendWordExi
lwz r3, 0x20ec(r24) #load last attack landed
bl sendByteExi
lhz r3, 0x20f0(r24) #load combo count
bl sendByteExi
lwz r3, 0x1924(r24) #load player who last hit this player
bl sendByteExi

lbz r3, 0x8E(r8) # load stocks remaining
bl sendByteExi

bl endExiTransfer #stop transfer

CLEANUP:
#restore registers and sp
lwz r0, 0x24(r1)
addi r1, r1, 0x20
mtlr r0

b GECKO_END

################################################################################
#                  subroutine: startExiTransfer
#  description: prepares port B exi to be written to
################################################################################
startExiTransfer:
lis r11, 0xCC00 #top bytes of address of EXI registers

#set up EXI
li r10, 0xB0 #bit pattern to set clock to 8 MHz and enable CS for device 0
stw r10, 0x6814(r11) #start transfer, write to parameter register

blr

################################################################################
#                    subroutine: sendByteExi
#  description: sends one byte over port B exi
#  inputs: r3 byte to send
################################################################################
sendByteExi:
slwi r3, r3, 24 #the byte to send has to be left shifted
li r4, 0x5 #bit pattern to write to control register to write one byte
b handleExi

################################################################################
#                    subroutine: sendHalfExi
#  description: sends two bytes over port B exi
#  inputs: r3 bytes to send
################################################################################
sendHalfExi:
slwi r3, r3, 16 #the bytes to send have to be left shifted
li r4, 0x15 #bit pattern to write to control register to write two bytes
b handleExi

################################################################################
#                    subroutine: sendWordExi
#  description: sends one word over port B exi
#  inputs: r3 word to send
################################################################################
sendWordExi:
li r4, 0x35 #bit pattern to write to control register to write four bytes
b handleExi

################################################################################
#                    subroutine: handleExi
#  description: Handles an exi operation over port B
#  inputs:
#  r3 data to write to transfer register
#  r4 bit pattern for control register
#  outputs:
#  r3 value read from transfer register after operation
################################################################################
handleExi:
#write value in r3 to EXI
stw r3, 0x6824(r11) #store data into transfer register
b handleExiStart

handleExiRetry:
# this effectively calls endExiTransfer and then startExiTransfer again
# the reason for this is on dolphin sometimes I would get an error that read:
# Exception thrown at 0x0000000019E04D6B in Dolphin.exe: 0xC0000005: Access violation reading location 0x000000034BFF6820
# this was causing data to not be written successfully and the only way I found
# to not soft-lock the game (the receive_wait loop would loop forever) was
# to do this
li r10, 0
stw r10, 0x6814(r11) #write 0 to the parameter register
li r10, 0xB0 #bit pattern to set clock to 8 MHz and enable CS for device 0
stw r10, 0x6814(r11) #start transfer, write to parameter register

handleExiStart:
stw r4, 0x6820(r11) #write to control register to begin transfer

li r9, 0
#wait until byte has been transferred
handleExiWait:
addi r9, r9, 1
cmpwi r9, 15
bge- handleExiRetry
lwz r10, 0x6820(r11)
andi. r10, r10, 1
bne handleExiWait

#read values from transfer register to r3 for output
lwz r3, 0x6824(r11) #read from transfer register

blr

################################################################################
#                  subroutine: endExiTransfer
#  description: stops port B writes
################################################################################
endExiTransfer:
li r10, 0
stw r10, 0x6814(r11) #write 0 to the parameter register

blr

GECKO_END:
lwz r0, 0x94(r1) #execute replaced code line
