################################################################################
#                      Inject at address 8006C0D8
# Unsure what the inject target function does exactly but I do know it ends up
# calling the stock subtraction instructions. It is called once per frame per
# character. It is also called during the score screen
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

#check if there are 3 or more players
lis r3,0x8016
ori r3,r3,0xB558 # load CountPlayers function
mtlr r3
blrl
cmpwi r3,3 # 3 or more players in match?
bge- CLEANUP # skip all this if so

#an input to this function is r5, r5 is the pointer of the player currently being considered + 0x60
#skip everything if pointer is not equal to the last players pointer
#the goal of this is to make the update only happen once per frame after the last character update
li r30, 3 #load last player number first
LAST_PLAYER_CHECK:
lis r3, 0x8045
ori r3, r3, 0x3130
mulli r4, r30, 0xE90 #compute address of this player's pointer
add r3, r3, r4
lwz r3, 0x0(r3)
cmpwi r3,0
bne LAST_PLAYER_FOUND #loop through until we find last player in game

subi r30,r30,1 #decrement player id
cmpwi r30,1
bge LAST_PLAYER_CHECK #iterate until potential last player candidates have been checked

LAST_PLAYER_FOUND:
addi r3, r3, 0x60
cmpw r3,r5
bne CLEANUP #if last valid player found does not equal player being considered, skip

#check if in single player mode, and ignore code if so
lis r3,0x801A # load SinglePlayer_Check function
ori r3,r3,0x4340
mtlr r3
lis r3,0x8048
lbz r3,-0x62D0(r3) #load menu controller major
blrl
cmpwi r3,1 # is this single player mode?
beq- CLEANUP # if in single player, ignore everything

#check frame count
lis r3,0x8047
lwz r3,-0x493C(r3) # load match frame count
lis r4,0x8048 #check scene controller frame count to make sure it is zero as well (only want to trigger OnStart on very first frame of match)
lwz r4,-0x62A8(r4) # load scene controller frame count

#check scene controller first, if zero it's either start or end of match
cmpwi r4,0
bne PRE_UPDATE_CHECKS #if scene controller is not zero, we are probably in game

#Here the scene controller is equal to zero, either trigger OnStart or OnEnd
cmpwi r3,0
bne ON_END_EVENT #if match frame count is greater than zero, this is the results screen

#------------- ON_START_EVENT -------------
bl startExiTransfer #indicate transfer start

li r3, 0x37
bl sendByteExi #send OnMatchStart event code

lis r31, 0x8045
ori r31, r31, 0xAC4C

lhz r3, 0x1A(r31) #stage ID half word
bl sendHalfExi

li r30, 0 #load player count

MP_WRITE_PLAYER:
#load character pointer for this player
lis r3, 0x8045
ori r3, r3, 0x3130
mulli r4, r30, 0xE90
add r3, r3, r4
lwz r3, 0x0(r3)

#skip this player if not in game
cmpwi r3, 0
beq MP_INCREMENT

#start writing data
mr r3, r30 #send character port ID
bl sendByteExi

#get start address for this player
lis r31, 0x8045
ori r31, r31, 0xAC4C
mulli r4, r30, 0x24
add r31, r31, r4

lbz r3, 0x6C(r31) #character ID
bl sendByteExi
lbz r3, 0x6D(r31) #player type
bl sendByteExi
lbz r3, 0x6F(r31) #costume ID
bl sendByteExi

MP_INCREMENT:
addi r30, r30, 1
cmpwi r30, 4
blt MP_WRITE_PLAYER

bl endExiTransfer #stop transfer

#----------- FRAME_UPDATE_CHECKS -----------
PRE_UPDATE_CHECKS:
#check if we are in results screen, if so, skip update
lis r3, 0x8045
lbz r3, 0x30C9(r3) #this global address exists for all players and appears to be = 1 when in game and = 0 when in results screen
cmpwi r3, 0
beq CLEANUP

#------------- FRAME_UPDATE -------------
bl startExiTransfer #indicate transfer start

li r3, 0x38
bl sendByteExi #send OnFrameUpdate event code

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

lis r3,0x804D
lwz r3,0x5F90(r3) #load random seed
bl sendWordExi

li r30, 0 #load player count

FU_WRITE_PLAYER:
#load character pointer for this player
lis r3, 0x8045
ori r3, r3, 0x3080
mulli r4, r30, 0xE90
add r29, r3, r4 #load static player memory address into r29
lwz r31, 0xB0(r29) #load player address into r31

#skip this player if not in game
cmpwi r31, 0
beq FU_INCREMENT

#check for sleep action state to load alternate character (sheik/zelda)
lwz r3,0x70(r31) #load action state ID
cmpwi r3, 0xB #compare to sleep state
bne FU_WRITE_CHAR_BLOCK #if not sleep state, continue as normal

lwz r4, 0xB4(r29) #sheik/zelda in sleep action, fetch other character's pointer
cmpwi r4, 0
beq FU_WRITE_CHAR_BLOCK #if pointer is zero, it is not sheik/zelda (or ics)

#ensure the character is not popo or nana (dont think this is needed)
#lwz r3,0x64(r31) #load internal char ID
#cmpwi r3,0xA #check popo
#beq FU_WRITE_CHAR_BLOCK
#cmpwi r3,0xB #check nana
#beq FU_WRITE_CHAR_BLOCK

mr r31, r4

FU_WRITE_CHAR_BLOCK:
lwz r3,0x64(r31) #load internal char ID
bl sendByteExi
lwz r3,0x70(r31) #load action state ID
bl sendHalfExi
lwz r3,0x110(r31) #load Top-N X coord
bl sendWordExi
lwz r3,0x114(r31) #load Top-N Y coord
bl sendWordExi
lwz r3,0x680(r31) #load Joystick X axis
bl sendWordExi
lwz r3,0x684(r31) #load Joystick Y axis
bl sendWordExi
lwz r3,0x698(r31) #load c-stick X axis
bl sendWordExi
lwz r3,0x69c(r31) #load c-stick Y axis
bl sendWordExi
lwz r3,0x6b0(r31) #load analog trigger input
bl sendWordExi
lwz r3,0x6bc(r31) #load buttons pressed this frame
bl sendWordExi
lwz r3,0x1890(r31) #load current damage
bl sendWordExi
lwz r3,0x19f8(r31) #load shield size
bl sendWordExi
lwz r3,0x20ec(r31) #load last attack landed
bl sendByteExi
lhz r3,0x20f0(r31) #load combo count
bl sendByteExi
lwz r3,0x1924(r31) #load player who last hit this player
bl sendByteExi

lbz r3,0x8E(r29) # load stocks remaining
bl sendByteExi

#get raw controller inputs
lis r31, 0x804C
ori r31, r31, 0x1FAC
mulli r3, r30, 0x44
add r31, r31, r3

lhz r3, 0x2(r31) #load constant button presses
bl sendHalfExi
lwz r3,0x30(r31) #load l analog trigger
bl sendWordExi
lwz r3,0x34(r31) #load r analog trigger
bl sendWordExi

FU_INCREMENT:
addi r30, r30, 1
cmpwi r30, 4
blt FU_WRITE_PLAYER

bl endExiTransfer #stop transfer
b CLEANUP

ON_END_EVENT:
#------------- ON_END_EVENT -------------
bl startExiTransfer #indicate transfer start

li r3, 0x39
bl sendByteExi #send OnMatchEnd event code

#check byte that will tell us whether the game was won by stock loss or by ragequit
lis r3, 0x8047
lbz r3, -0x4960(r3)
bl sendByteExi #send win condition byte. this byte will be 0 on ragequit, 3 on win by stock loss

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
lwz r0, 0x94(r1) #execute replaced code line
