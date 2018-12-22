#To be inserted at 801a45a0
.include "Common/Common.s"

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
