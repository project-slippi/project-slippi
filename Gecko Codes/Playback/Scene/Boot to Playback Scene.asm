#To be inserted at 801a45a0
.macro branchl reg, address
lis \reg, \address @h
ori \reg,\reg,\address @l
mtctr \reg
bctrl
.endm

.macro branch reg, address
lis \reg, \address @h
ori \reg,\reg,\address @l
mtctr \reg
bctr
.endm

.macro load reg, address
lis \reg, \address @h
ori \reg, \reg, \address @l
.endm

.macro loadf regf,reg,address
lis \reg, \address @h
ori \reg, \reg, \address @l
stw \reg,-0x4(sp)
lfs \regf,-0x4(sp)
.endm

.macro backup
mflr r0
stw r0, 0x4(r1)
stwu	r1,-0x100(r1)	# make space for 12 registers
stw	r31,0x08(r1)
stw	r30,0x0C(r1)
stw	r29,0x10(r1)
.endm

.macro restore
lwz	r29,0x10(r1)
lwz	r30,0x0C(r1)
lwz	r31,0x08(r1)
addi	r1,r1,0x100	# release the space
lwz r0, 0x4(r1)
mtlr r0
.endm

.set MajorStruct_DebugMelee,0x803dada8

###########################################################################
# Store pointer to custom OnMajorLoad function                            #
# DebugMelee has no SceneLoadMajor function, so this will store a pointer #
# to a function that will run before the Major starts                     #
###########################################################################
  bl  SceneLoadMajor_DebugMelee
  mflr r3
  load r4,MajorStruct_DebugMelee
  stw r3,0x4(r4)    #Store to OnMajorLoad offset
  b Exit

#####################################################################################
# OnMajorLoad function                                                              #
# Runs When the DebugMelee scene is first entered. This handles jumping immediately #
# to the playback scene (result screen) instead of the "Dairanto" scene.            #
#####################################################################################
SceneLoadMajor_DebugMelee:
  blrl

  #Immediately go to the result screen
    li    r3,0x3          #Result Screen Minor
  	load	r4,0x80479D30   #Scene Controller
    stb   r3,0x3(r4)
    blr

######################################################################
# Load the DebugMelee scene ID and return to original injection site #
######################################################################
Exit:
#Store DebugMelee Scene ID
  li  r0,0xE
