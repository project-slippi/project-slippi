################################################################################
#                      Inject at address 8006b0dc
# Function is PlayerThink_ControllerInputsToDataOffset. Injection location
# suggested by Achilles
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
stw r3,0x1C(r1)
stw r4,0x18(r1)

#check if in single player mode, and ignore code if so
lis r3,0x801A # load SinglePlayer_Check function
ori r3,r3,0x4340
mtlr r3
lis r3,0x8048
lbz r3,-0x62D0(r3) #load menu controller major
blrl
cmpwi r3,1 # is this single player mode?
beq- CLEANUP # if in single player, ignore everything

#------------- INITIALIZE -------------
# here we want to initalize some variables we plan on using throughout
lbz r7, 0xC(r31) #loads this player slot

# generate address for static player block
lis r8, 0x8045
ori r8, r8, 0x3080
mulli r3, r7, 0xE90
add r8, r8, r3

#------------- FRAME_UPDATE -------------
bl startExiTransfer #indicate transfer start

li r3, 0x37
bl sendByteExi #send OnPreFrameUpdate event code

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

mr r3, r7 #player slot
bl sendByteExi

li r4, 0 # initialize isFollower to false

# check if we are playing ice climbers, if we are we need to check if this is nana
lwz r3, 0x4(r8)
cmpwi r3, 0xE
bne+ WRITE_IS_FOLLOWER

# we need to check if this is a follower (nana). should not save inputs for nana
lwz r3, 0xB4(r8) # load pointer to follower for this port
cmpw r3, r30 # compare follower pointer with current pointer
bne WRITE_IS_FOLLOWER # if the two  dont match, this is popo

li r4, 1 # if we get here then we know this is nana

WRITE_IS_FOLLOWER:
mr r3, r4 # stage isFollower bool for writing
bl sendByteExi

lis r3, 0x804D
lwz r3, 0x5F90(r3) #load random seed
bl sendWordExi

lwz r3, 0x70(r30) #load action state ID
bl sendHalfExi
lwz r3, 0x110(r30) #load x coord
bl sendWordExi
lwz r3, 0x114(r30) #load y coord
bl sendWordExi
lwz r3, 0x8C(r30) #load facing direction
bl sendWordExi
lwz r3, 0x680(r30) #load Joystick X axis
bl sendWordExi
lwz r3, 0x684(r30) #load Joystick Y axis
bl sendWordExi
lwz r3, 0x698(r30) #load c-stick X axis
bl sendWordExi
lwz r3, 0x69c(r30) #load c-stick Y axis
bl sendWordExi
lwz r3, 0x6b0(r30) #load analog trigger input
bl sendWordExi
lwz r3, 0x6bc(r30) #load buttons pressed this frame
bl sendWordExi

# TODO: For some reason the following code block was causing a crash on console
# TODO: Need to figure out why
#get raw controller inputs
#lis r4, 0x804C
#ori r4, r4, 0x1FAC
#mulli r3, r7, 0x44
#add r4, r4, r3

#lhz r3, 0x2(r4) #load constant button presses
#bl sendHalfExi
#lwz r3, 0x30(r4) #load l analog trigger
#bl sendWordExi
#lwz r3, 0x34(r4) #load r analog trigger
#bl sendWordExi

li r3, 0
bl sendHalfExi
li r3, 0
bl sendWordExi
li r3, 0
bl sendWordExi

bl endExiTransfer #stop transfer

CLEANUP:
#restore registers and sp
lwz r0, 0x24(r1)
lwz r3, 0x1C(r1)
lwz r4, 0x18(r1)
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
li r10, 0xD0 #bit pattern to set clock to 8 MHz and enable CS for device 0
stw r10, 0x6800(r11) #start transfer, write to parameter register

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
stw r3, 0x6810(r11) #store data into transfer register
b handleExiStart

handleExiRetry:
# this effectively calls endExiTransfer and then startExiTransfer again
# the reason for this is on dolphin sometimes I would get an error that read:
# Exception thrown at 0x0000000019E04D6B in Dolphin.exe: 0xC0000005: Access violation reading location 0x000000034BFF6820
# this was causing data to not be written successfully and the only way I found
# to not soft-lock the game (the receive_wait loop would loop forever) was
# to do this
li r10, 0
stw r10, 0x6800(r11) #write 0 to the parameter register
li r10, 0xD0 #bit pattern to set clock to 8 MHz and enable CS for device 0
stw r10, 0x6800(r11) #start transfer, write to parameter register

handleExiStart:
stw r4, 0x680C(r11) #write to control register to begin transfer

li r9, 0
#wait until byte has been transferred
handleExiWait:
addi r9, r9, 1
cmpwi r9, 15
bge- handleExiRetry
lwz r10, 0x680C(r11)
andi. r10, r10, 1
bne handleExiWait

#read values from transfer register to r3 for output
lwz r3, 0x6810(r11) #read from transfer register

blr

################################################################################
#                  subroutine: endExiTransfer
#  description: stops port B writes
################################################################################
endExiTransfer:
li r10, 0
stw r10, 0x6800(r11) #write 0 to the parameter register

blr

GECKO_END:
lbz r0, 0x2219(r31) #execute replaced code line
