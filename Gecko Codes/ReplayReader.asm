################################################################################
#                      Inject at address 8006b80c
# Function address provided by UnclePunch. Function is
# PlayerThink_ControllerInputsToDataOffset
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
stw r31,0x1C(r1)
stw r30,0x18(r1)
stw r29,0x14(r1)



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
#  outputs: r3 received byte
################################################################################
sendByteExi:
lis r11, 0xCC00 #top bytes of address of EXI registers
li r10, 0x9 #bit pattern to write to control register to write one byte

#write value in r3 to EXI
slwi r3, r3, 24 #the byte to send has to be left shifted
stw r3, 0x6824(r11) #store current byte into transfer register
stw r10, 0x6820(r11) #write to control register to begin transfer

#wait until byte has been transferred
EXI_CHECK_RECEIVE_WAIT:
lwz r10, 0x6820(r11)
andi. r10, r10, 1
bne EXI_CHECK_RECEIVE_WAIT

#read values from transfer register to r3 for output
lwz r3, 0x6824(r11) #read from transfer register
srwi r3, r3, 24 #shift byte to the right of the register

blr

################################################################################
#                    subroutine: sendHalfExi
#  description: sends two bytes over port B exi
#  inputs: r3 bytes to send
#  outputs: r3 received bytes
################################################################################
sendHalfExi:
lis r11, 0xCC00 #top bytes of address of EXI registers
li r10, 0x19 #bit pattern to write to control register to write one byte

#write value in r3 to EXI
slwi r3, r3, 16 #the bytes to send have to be left shifted
stw r3, 0x6824(r11) #store bytes into transfer register
stw r10, 0x6820(r11) #write to control register to begin transfer

#wait until byte has been transferred
EXI_CHECK_RECEIVE_WAIT_HALF:
lwz r10, 0x6820(r11)
andi. r10, r10, 1
bne EXI_CHECK_RECEIVE_WAIT_HALF

#read values from transfer register to r3 for output
lwz r3, 0x6824(r11) #read from transfer register
srwi r3, r3, 16 #shift byte to the right of the register

blr

################################################################################
#                    subroutine: sendWordExi
#  description: sends one word over port B exi
#  inputs: r3 word to send
#  outputs: r3 received word
################################################################################
sendWordExi:
lis r11, 0xCC00 #top bytes of address of EXI registers
li r10, 0x39 #bit pattern to write to control register to write four bytes

#write value in r3 to EXI
stw r3, 0x6824(r11) #store current bytes into transfer register
stw r10, 0x6820(r11) #write to control register to begin transfer

#wait until byte has been transferred
EXI_CHECK_RECEIVE_WAIT_WORD:
lwz r10, 0x6820(r11)
andi. r10, r10, 1
bne EXI_CHECK_RECEIVE_WAIT_WORD

#read values from transfer register to r3 for output
lwz r3, 0x6824(r11) #read from transfer register

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
lwz r0, 0x7C(r1) #execute replaced code line
