#include "SlippiGame.h"

namespace Slippi {

	// Taken from Dolphin source
	uint64_t GetSize(FILE* f)
	{
		// can't use off_t here because it can be 32-bit
		uint64_t pos = ftell(f);
		if (fseek(f, 0, SEEK_END) != 0)
		{
			return 0;
		}

		uint64_t size = ftell(f);
		if ((size != pos) && (fseek(f, pos, SEEK_SET) != 0))
		{
			return 0;
		}

		return size;
	}

	SlippiGame* SlippiGame::FromFile(std::string path)
	{
		// Get file and file size
		FILE* inputFile = fopen(path.c_str(), "rb");
		uint64_t fileSize = GetSize(inputFile);

		// Write contents to a uint8_t array
		uint8_t* fileContents = (uint8_t*)malloc(fileSize);
		fread(fileContents, sizeof(uint8_t), fileSize, inputFile);
		fclose(inputFile);

		//// Iterate through the data and process frames
		//for (int i = 0; i < fileSize; i++) {
		//	int code = fileContents[i];
		//	int msgLength = asmEvents[code];
		//	if (!msgLength) {
		//		printf("ERROR - Received an invalid code with value: 0x%02X. MsgLength: %d\n", code, msgLength);
		//		return 2;
		//	}

		//	data = &fileContents[i + 1];
		//	processData(code);
		//	i += msgLength;
		//}

		free(fileContents);
		return nullptr;
	}
}