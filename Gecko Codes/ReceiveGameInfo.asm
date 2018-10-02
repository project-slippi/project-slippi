################################################################################
#                      Inject at address 8016e74c
# Function is StartMelee and we are loading game information right before
# it gets read to initialize the match
################################################################################

#replaced code line is executed at the end

# Port A EXI Addresses
# .set EXI_CSR_LOW, 0x6800
# .set EXI_CR_LOW, 0x680C
# .set EXI_DATA_LOW, 0x6810

# Port B EXI Addresses
.set EXI_CSR_LOW, 0x6814
.set EXI_CR_LOW, 0x6820
.set EXI_DATA_LOW, 0x6824

################################################################################
#                   subroutine: gameInfoLoad
# description: reads game info from slippi and loads those into memory
# addresses that will be used
################################################################################
#create stack frame and store link register
mflr r0
stw r0, 0x4(r1)
stwu r1,-0x20(r1)

# initialize transfer with slippi device
bl startExiTransfer

# request game information from slippi
li r3,0x75
bl sendByteExi

bl readWordExi #randomSeed
lis r4, 0x804D
stw r3, 0x5F90(r4) #load random seed

#------------- GAME INFO BLOCK -------------
# this iterates through the static game info block that is used to pull data
# from to initialize the game. it reads the whole thing from slippi and writes
# it back to memory. (0x138 bytes long)
li r7, 0
START_GAME_INFO_LOOP:
add r8, r31, r7

bl readWordExi
stw r3, 0x0(r8)

addi r7, r7, 0x4
cmpwi r7, 0x138
blt+ START_GAME_INFO_LOOP

#------------- OTHER INFO -------------
# write UCF toggle bytes
lis r7, 0x804D
START_UCF_LOOP:
bl readWordExi
stw r3, 0x1FB0(r7) #save UCF toggle

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
lis r11, 0xCC00 #top bytes of address of EXI registers

#set up EXI
li r10, 0xD0 #bit pattern to set clock to 8 MHz and enable CS for device 0
stw r10, EXI_CSR_LOW(r11) #start transfer, write to parameter register

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
stw r3, EXI_DATA_LOW(r11) #store data into transfer register
b handleExiStart

handleExiRetry:
# this effectively calls endExiTransfer and then startExiTransfer again
# the reason for this is on dolphin sometimes I would get an error that read:
# Exception thrown at 0x0000000019E04D6B in Dolphin.exe: 0xC0000005: Access violation reading location 0x000000034BFF6820
# this was causing data to not be written successfully and the only way I found
# to not soft-lock the game (the receive_wait loop would loop forever) was
# to do this
li r10, 0
stw r10, EXI_CSR_LOW(r11) #write 0 to the parameter register
li r10, 0xD0 #bit pattern to set clock to 8 MHz and enable CS for device 0
stw r10, EXI_CSR_LOW(r11) #start transfer, write to parameter register

handleExiStart:
stw r4, EXI_CR_LOW(r11) #write to control register to begin transfer

li r9, 0
#wait until byte has been transferred
handleExiWait:
addi r9, r9, 1
cmpwi r9, 15
bge- handleExiRetry
lwz r10, EXI_CR_LOW(r11)
andi. r10, r10, 1
bne handleExiWait

#read values from transfer register to r3 for output
lwz r3, EXI_DATA_LOW(r11) #read from transfer register

blr

################################################################################
#                  subroutine: endExiTransfer
#  description: stops port B writes
################################################################################
endExiTransfer:
li r10, 0
stw r10, EXI_CSR_LOW(r11) #write 0 to the parameter register

blr

GECKO_END:
lis r3, 0x8017 #execute replaced code line
