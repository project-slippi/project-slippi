################################################################################
#                      Inject at address 8016e74c
# Function is StartMelee and we are loading game information right before
# it gets read to initialize the match
################################################################################

#replaced code line is executed at the end

################################################################################
#                   subroutine: sendGameInfo
# description: reads game info from slippi and loads those into memory
# addresses that will be used
################################################################################
#create stack frame and store link register
mflr r0
stw r0, 0x4(r1)
stwu r1,-0x20(r1)

# initialize transfer with slippi device
bl startExiTransfer

#------------- WRITE OUT COMMAND SIZES -------------
# start file sending and indicate the sizes of the output commands
li r3,0x35
bl sendByteExi

# write out the payload size of the 0x35 command (includes this byte)
# we can write this in only a byte because I doubt it will ever be larger
# than 255. We write out the sizes of the other commands as half words for
# consistent parsing
li r3, 13
bl sendByteExi

# game info command
li r3, 0x36
bl sendByteExi
li r3, 352
bl sendHalfExi

# pre-frame update command
li r3, 0x37
bl sendByteExi
li r3, 58
bl sendHalfExi

# post-frame update command
li r3, 0x38
bl sendByteExi
li r3, 37
bl sendHalfExi

# game end command
li r3, 0x39
bl sendByteExi
li r3, 1
bl sendHalfExi

#------------- BEGIN GAME INFO COMMAND -------------
# game information message type
li r3,0x36
bl sendByteExi

# build version number. Each byte is one digit
# any change in command data should result in a minor version change
# current version: 1.0.0.0
# Version is of the form major.minor.build.revision. A change to major
# indicates breaking changes/loss of backwards compatibility. A change
# to minor indicates a pretty major change like added fields or new
# events. Build/Revision can be incremented for smaller changes
lis r3, 0x0100
addi r3, r3, 0x0000
bl sendWordExi

#------------- GAME INFO BLOCK -------------
# this iterates through the static game info block that is used to pull data
# from to initialize the game. it writes out the whole thing (0x138 long)
li r7, 0
START_GAME_INFO_LOOP:
add r3, r31, r7
lwz r3, 0x0(r3)
bl sendWordExi

addi r7, r7, 0x4
cmpwi r7, 0x138
blt+ START_GAME_INFO_LOOP

#------------- OTHER INFO -------------
# write out random seed
lis r3, 0x804D
lwz r3, 0x5F90(r3) #load random seed
bl sendWordExi

# write UCF toggle bytes
lis r7, 0x804D
START_UCF_LOOP:
lwz r3, 0x1FB0(r7) #load UCF toggle
bl sendWordExi

addi r7, r7, 0x4
andi. r3, r7, 0xFFFF
cmpwi r3, 0x20
blt+ START_UCF_LOOP

bl endExiTransfer

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
#lis r11, 0xCC00 #top bytes of address of EXI registers

#set up EXI
#li r10, 0xB0 #bit pattern to set clock to 8 MHz and enable CS for device 0
#stw r10, 0x6814(r11) #start transfer, write to parameter register

blr

################################################################################
#                    subroutine: sendByteExi
#  description: sends one byte over port B exi
#  inputs: r3 byte to send
################################################################################
sendByteExi:
#slwi r3, r3, 24 #the byte to send has to be left shifted
#li r4, 0x5 #bit pattern to write to control register to write one byte
mr r4, r3
li r3, 0
li r5, 0
b handleExi

################################################################################
#                    subroutine: sendHalfExi
#  description: sends two bytes over port B exi
#  inputs: r3 bytes to send
################################################################################
sendHalfExi:
#slwi r3, r3, 16 #the bytes to send have to be left shifted
#li r4, 0x15 #bit pattern to write to control register to write two bytes
mr r4, r3
li r3, 0
li r5, 1
b handleExi

################################################################################
#                    subroutine: sendWordExi
#  description: sends one word over port B exi
#  inputs: r3 word to send
################################################################################
sendWordExi:
#li r4, 0x35 #bit pattern to write to control register to write four bytes
mr r4, r3
li r3, 0
li r5, 3
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
mflr r0
stw r0, 0x4(r1)
stwu r1,-0x20(r1)
stw r7,0x1C(r1)

# Write 1c to this memory value or for some reason the game doesn't allow
# EXI calls
li r6, 0x1c
lis r7, 0x804A
stw r6, 0x7C8C(r7)

li r6, 1 # write mode input. 1 is write

lis r7, 0x8034
ori r7, r7, 0x5b64
mtlr r7
li r7, 0 # r7 is cb? Dunno what that is, just set to 0
blrl

#restore registers and sp
lwz r0, 0x24(r1)
lwz r7, 0x1C(r1)
addi r1, r1, 0x20
mtlr r0
blr

################################################################################
#                  subroutine: endExiTransfer
#  description: stops port B writes
################################################################################
endExiTransfer:
#li r10, 0
#stw r10, 0x6814(r11) #write 0 to the parameter register

blr

GECKO_END:
lis r3, 0x8017 #execute replaced code line
