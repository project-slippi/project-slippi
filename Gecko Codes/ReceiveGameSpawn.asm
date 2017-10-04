################################################################################
#                      Inject at address 80067cf8
# Injection point provided by Achilles, runs every time somebody spawns
################################################################################

#replaced code line is executed at the end

################################################################################
#                   subroutine: receiveGameSpawn
# description: reads inputs from Slippi for a given frame and overwrites
# memory locations
################################################################################
#create stack frame and store link register
mflr r0
stw r0, 0x4(r1)
stwu r1,-0x20(r1)

#------------- INITIALIZE -------------
# here we want to initalize some variables we plan on using throughout
lbz r7, 0xC(r27) #loads this player slot

# generate address for static player block
lis r8, 0x8045
ori r8, r8, 0x3080
mulli r3, r7, 0xE90
add r8, r8, r3

#------------- START MAIN -------------
bl startExiTransfer

li r3,0x77
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

# read positions and write back to proper locations
bl readWordExi
stw r3, 0x2c(sp) # x position
bl readWordExi
stw r3, 0x30(sp) # y position
bl readWordExi
stw r3, 0x2c(r27) # facing direction

# check if we are playing ice climbers, if we are we need to check if this is nana
lwz r3, 0x4(r8)
cmpwi r3, 0xE
bne+ SKIP_NANA_CHECK

# we need to check if this is a follower (nana). if nana should modify position
lwz r3, 0xB0(r8) # load pointer to main player for this port
lwz r3, 0x8(r3) # load pointer to secondary player for this port
addi r3, r3, 0x60 # add offset to turn into pointer to data
cmpw r3, r27 # compare follower pointer with current pointer
bne SKIP_NANA_CHECK # if the two match, this is a follower

# here we have detected we are spawning nana, let's put her 10 distance away
lfs f10, 0x2c(r27) # load facing direction into floating point register
lfs f12, 0x2c(sp) # load the current x position into f11
lis r3, 0x4120 # prepare to load the float 10 into f11
stw r3, 0x2c(sp) # write to memory so we can read back as float
lfs f11, 0x2c(sp) # read memory as float
fmuls f10, f10, f11 # multiply facing direction by 10
fsubs f10, f12, f10 # move x position by the nana offset
stfs f10, 0x2c(sp)

SKIP_NANA_CHECK:
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
li r0, 255 # this was the value in r0 for some reason from 80067ce4
lfs f0, 0xc(sp) # previous code line, redo for safety and 20XX compatibility
stfs f0, 0xb0(r27) # default code line at this injection point
