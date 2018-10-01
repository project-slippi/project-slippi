################################################################################
#                      Inject at address 8006b0dc
# Function is PlayerThink_ControllerInputsToDataOffset. Injection location
# suggested by Achilles
################################################################################

#replaced code line is executed at the end

################################################################################
#                   subroutine: readInputs
# description: reads inputs from Slippi for a given frame and overwrites
# memory locations
################################################################################
#create stack frame and store link register
mflr r0
stw r0, 0x4(r1)
stwu r1,-0x20(r1)
stw r3,0x1C(r1)
stw r4,0x18(r1)

#------ TEST
#lis r3, 0x2c00
#lis r4, 0x800D
#stw r3, -0x64B4(r4)

#------------- INITIALIZE -------------
# here we want to initalize some variables we plan on using throughout
lbz r7, 0xC(r31) #loads this player slot

# generate address for static player block
lis r8, 0x8045
ori r8, r8, 0x3080
mulli r3, r7, 0xE90
add r8, r8, r3

#------------- START MAIN -------------
bl startExiTransfer

li r3,0x76
bl sendByteExi

#Frame Number
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

REPLAY:
bl readWordExi
lis r4,0x804D
stw r3,0x5F90(r4) #RNG seed
bl readWordExi
stw r3,0x620(r31) #analog X
bl readWordExi
stw r3,0x624(r31) #analog Y
bl readWordExi
stw r3,0x638(r31) #cstick X
bl readWordExi
stw r3,0x63C(r31) #cstick Y
bl readWordExi
stw r3,0x650(r31) #trigger
bl readWordExi
stw r3,0x65C(r31) #buttons
bl readWordExi
stw r3,0xB0(r31) #x position
bl readWordExi
stw r3,0xB4(r31) #y position
bl readWordExi
stw r3,0x2C(r31) #facing direction
bl readWordExi
stw r3,0x10(r31) #animation state ID

# UCF uses raw controller inputs for dashback, restore x analog byte here
lis r3, 0x8046  # start location of circular buffer
ori r3, r3, 0xb108

lis r4, 0x804c
ori r4, r4, 0x1f78
lbz r4, 0x0001(r4) # this is the current index in the circular buffer
subi r4, r4, 1
cmpwi r4, 0
bge+ CONTINUE_RAW_X # if our index is already 0 or greater, continue
addi r4, r4, 5 # here our index was -1, this should wrap around to be 4
CONTINUE_RAW_X:
mulli r4, r4, 0x30
add r3, r3, r4 # move to the correct start index for this index

mulli r4, r7, 0xc
add r3, r3, r4 # move to the correct player position

mr r8, r3
bl readWordExi
stb r3, 0x2(r8) #load raw x analog

bl endExiTransfer

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
#                    subroutine: sendWordExi
#  description: sends one word over port B exi
#  inputs: r3 word to send
################################################################################
sendWordExi:
li r4, 0x35 #bit pattern to write to control register to write four bytes
b handleExi

################################################################################
#                    subroutine: readWordExi
#  description: reads one word over port B exi
#  outputs: r3 received word
################################################################################
readWordExi:
li r4, 0x31 #bit pattern to write to control register to read four bytes
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
