#To be inserted at 800055fc
################################################################################
# Function: GetFrameIndex
# Inject @ 800055fc
# ------------------------------------------------------------------------------
# Description: Gets current frame index
# ------------------------------------------------------------------------------
# in
#   none
# out
#   r3 = current frame index
################################################################################

.macro branchl reg, address
lis \reg, \address @h
ori \reg,\reg,\address @l
mtctr \reg
bctrl
.endm

.macro backup
mflr r0
stw r0, 0x4(r1)
stwu	r1,-0x50(r1)	# make space for 12 registers
stmw  r20,0x8(r1)
.endm

 .macro restore
lmw  r20,0x8(r1)
lwz r0, 0x54(r1)
addi	r1,r1,0x50	# release the space
mtlr r0
.endm

.macro load reg, address
lis \reg, \address @h
ori \reg, \reg, \address @l
.endm

GetFrameIndex:
backup

# request frame number
  lis r4,0x8048
  lwz r4,-0x62A8(r4) # load scene controller frame count
  lis r3,0x8047
  lwz r3,-0x493C(r3) #load match frame count
  cmpwi r3, 0
  bne TimerHasStarted #this makes it so that if the timer hasn't started yet, we have a unique frame count still
  sub r3,r3,r4
  li r4,-0x7B
  sub r3,r4,r3
TimerHasStarted:

Exit:
#restore registers and sp
  restore
  blr
