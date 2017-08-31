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
stw r31,0x1C(r1)
stw r30,0x18(r1)
stw r29,0x14(r1)

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

# If this is the very first frame of the match, send game start info
lis r4,0x8048
lwz r4,-0x62A8(r4) # load scene controller frame count

#check frame count, if zero it's the start of the match
cmpwi r4,0
bne FRAME_UPDATE #if scene controller is not zero, game has started

#------------- ON_START_EVENT -------------
bl startExiTransfer #indicate transfer start

li r3, 0x37
bl sendByteExi #send OnMatchStart event code

lis r3, 0x8046
lhz r3, -0x539A(r3) #stage ID half word
bl sendHalfExi

mr r3, r7 #player slot
bl sendByteExi

lwz r3, 0x4(r8) #character ID
bl sendByteExi
lwz r3, 0x8(r8) #player type
bl sendByteExi
lbz r3, 0x44(r8) #costume ID
bl sendByteExi

# TODO: Add timer, stocks, teams, etc

bl endExiTransfer #stop transfer

FRAME_UPDATE:
#------------- FRAME_UPDATE -------------
bl startExiTransfer #indicate transfer start

li r3, 0x38
bl sendByteExi #send OnFrameUpdate event code

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
bl sendWordExi #4

lis r3, 0x804D
lwz r3, 0x5F90(r3) #load random seed
bl sendWordExi #8

# TODO: handle sheik/zelda

mr r3, r7 #player slot
bl sendByteExi #9
lwz r3, 0x64(r30) #load internal char ID
bl sendByteExi #10
lwz r3, 0x70(r30) #load action state ID
bl sendHalfExi #12
lwz r3, 0x110(r30) #load Top-N X coord
bl sendWordExi #16
lwz r3, 0x114(r30) #load Top-N Y coord
bl sendWordExi #20
lwz r3, 0x680(r30) #load Joystick X axis
bl sendWordExi #24
lwz r3, 0x684(r30) #load Joystick Y axis
bl sendWordExi #28
lwz r3, 0x698(r30) #load c-stick X axis
bl sendWordExi #32
lwz r3, 0x69c(r30) #load c-stick Y axis
bl sendWordExi #36
lwz r3, 0x6b0(r30) #load analog trigger input
bl sendWordExi #40
lwz r3, 0x6bc(r30) #load buttons pressed this frame
bl sendWordExi #44
lwz r3, 0x1890(r30) #load current damage
bl sendWordExi #48
lwz r3, 0x19f8(r30) #load shield size
bl sendWordExi #52
lwz r3, 0x20ec(r30) #load last attack landed
bl sendByteExi #53
lhz r3, 0x20f0(r30) #load combo count
bl sendByteExi #54
lwz r3, 0x1924(r30) #load player who last hit this player
bl sendByteExi #55

lbz r3, 0x8E(r8) # load stocks remaining
bl sendByteExi #56

#get raw controller inputs
lis r4, 0x804C
ori r4, r4, 0x1FAC
mulli r3, r7, 0x44
add r4, r4, r3

lhz r3, 0x2(r4) #load constant button presses
bl sendHalfExi #58
lwz r3, 0x30(r4) #load l analog trigger
bl sendWordExi #62
lwz r3, 0x34(r4) #load r analog trigger
bl sendWordExi #66

bl endExiTransfer #stop transfer

CLEANUP:
#restore registers and sp
lwz r0, 0x24(r1)
lwz r31, 0x1C(r1)
lwz r30, 0x18(r1)
lwz r29, 0x14(r1)
addi r1, r1, 0x20
mtlr r0

b GECKO_END

################################################################################
#                  subroutine: startExiTransfer
#  description: prepares port B exi to be written to
################################################################################
startExiTransfer:
lis r11, 0xCC00 #top bytes of address of EXI registers

#disable read/write protection on memory pages
lhz r10, 0x4010(r11)
ori r10, r10, 0xFF
sth r10, 0x4010(r11) # disable MP3 memory protection

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
lis r11, 0xCC00 #top bytes of address of EXI registers
li r10, 0x5 #bit pattern to write to control register to write one byte

#write value in r3 to EXI
slwi r3, r3, 24 #the byte to send has to be left shifted
stw r3, 0x6824(r11) #store current byte into transfer register
stw r10, 0x6820(r11) #write to control register to begin transfer

#wait until byte has been transferred
EXI_CHECK_RECEIVE_WAIT:
lwz r10, 0x6820(r11)
andi. r10, r10, 1
bne EXI_CHECK_RECEIVE_WAIT

blr

################################################################################
#                    subroutine: sendHalfExi
#  description: sends two bytes over port B exi
#  inputs: r3 bytes to send
################################################################################
sendHalfExi:
lis r11, 0xCC00 #top bytes of address of EXI registers
li r10, 0x15 #bit pattern to write to control register to write one byte

#write value in r3 to EXI
slwi r3, r3, 16 #the bytes to send have to be left shifted
stw r3, 0x6824(r11) #store bytes into transfer register
stw r10, 0x6820(r11) #write to control register to begin transfer

#wait until byte has been transferred
EXI_CHECK_RECEIVE_WAIT_HALF:
lwz r10, 0x6820(r11)
andi. r10, r10, 1
bne EXI_CHECK_RECEIVE_WAIT_HALF

blr

################################################################################
#                    subroutine: sendWordExi
#  description: sends one word over port B exi
#  inputs: r3 word to send
################################################################################
sendWordExi:
lis r11, 0xCC00 #top bytes of address of EXI registers
li r10, 0x35 #bit pattern to write to control register to write four bytes

#write value in r3 to EXI
stw r3, 0x6824(r11) #store current bytes into transfer register
stw r10, 0x6820(r11) #write to control register to begin transfer

#wait until byte has been transferred
EXI_CHECK_RECEIVE_WAIT_WORD:
lwz r10, 0x6820(r11)
andi. r10, r10, 1
bne EXI_CHECK_RECEIVE_WAIT_WORD

blr

################################################################################
#                  subroutine: endExiTransfer
#  description: stops port B writes
################################################################################
endExiTransfer:
lis r11, 0xCC00 #top bytes of address of EXI registers

li r10, 0
stw r10, 0x6814(r11) #write 0 to the parameter register

blr

GECKO_END:
lbz r0, 0x2219(r31) #execute replaced code line
