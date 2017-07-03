#include "stdafx.h"
#include "SlippiGame.h"

namespace Slippi {

	//**********************************************************************
	//*                         Event Handlers
	//**********************************************************************
	uint8_t* data;

	//The read operators will read a value and increment the index so the next read will read in the correct location
	uint8_t readByte(uint8_t* a, int& idx) {
		return a[idx++];
	}

	uint16_t readHalf(uint8_t* a, int& idx) {
		uint16_t value = a[idx] << 8 | a[idx + 1];
		idx += 2;
		return value;
	}

	uint32_t readWord(uint8_t* a, int& idx) {
		uint32_t value = a[idx] << 24 | a[idx + 1] << 16 | a[idx + 2] << 8 | a[idx + 3];
		idx += 4;
		return value;
	}

	float readFloat(uint8_t* a, int& idx) {
		uint32_t bytes = readWord(a, idx);
		return *(float*)(&bytes);
	}

	void handleGameStart(Game* game) {
		int idx = 0;

		//Load stage ID
		game->settings.stage = readHalf(data, idx);

		for (int i = 0; i < PLAYER_COUNT; i++) {
			PlayerSettings& p = game->settings.player[i];

			//Load player data
			p.controllerPort = readByte(data, idx);
			p.characterId = readByte(data, idx);
			p.playerType = readByte(data, idx);
			p.characterColor = readByte(data, idx);
		}
	}

	void handleUpdate(Game* game) {
		int idx = 0;

		//Check frame count
		int32_t frameCount = readWord(data, idx);
		game->frameCount = frameCount;

		FrameData* frame = new FrameData();
		frame->frame = frameCount;
		frame->randomSeed = readWord(data, idx);

		for (int i = 0; i < PLAYER_COUNT; i++) {
			PlayerFrameData& p = frame->players[i];

			//Load player data
			p.internalCharacterId = readByte(data, idx);
			p.animation = readHalf(data, idx);
			p.locationX = readFloat(data, idx);
			p.locationY = readFloat(data, idx);

			//Controller information
			p.joystickX = readFloat(data, idx);
			p.joystickY = readFloat(data, idx);
			p.cstickX = readFloat(data, idx);
			p.cstickY = readFloat(data, idx);
			p.trigger = readFloat(data, idx);
			p.buttons = readWord(data, idx);

			//More data
			p.percent = readFloat(data, idx);
			p.shieldSize = readFloat(data, idx);
			p.lastMoveHitId = readByte(data, idx);
			p.comboCount = readByte(data, idx);
			p.lastHitBy = readByte(data, idx);
			p.stocks = readByte(data, idx);

			//Raw controller information
			p.physicalButtons = readHalf(data, idx);
			p.lTrigger = readFloat(data, idx);
			p.rTrigger = readFloat(data, idx);
		}

		// Add frame to game
		game->frameData.push_back(*frame);
	}

	void handleGameEnd(Game* game) {
		int idx = 0;

		game->winCondition = readByte(data, idx);
	}

	// Taken from Dolphin source
	uint64_t getSize(FILE* f) {
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

	SlippiGame* SlippiGame::processFile(uint8_t* fileContents, uint64_t fileSize) {
		SlippiGame* result = new SlippiGame();
		result->game = new Game();

		// Iterate through the data and process frames
		for (int i = 0; i < fileSize; i++) {
			int code = fileContents[i];
			int msgLength = asmEvents[code];
			if (!msgLength) {
				return nullptr;
			}

			data = &fileContents[i + 1];
			switch (code) {
			case EVENT_GAME_START:
				handleGameStart(result->game);
				break;
			case EVENT_UPDATE:
				handleUpdate(result->game);
				break;
			case EVENT_GAME_END:
				handleGameEnd(result->game);
				break;
			}
			i += msgLength;
		}

		return result;
	}

	void SlippiGame::init() {
		if (initialized) {
			return;
		}

		asmEvents[EVENT_GAME_START] = 0xA;
		asmEvents[EVENT_UPDATE] = 0x7A;
		asmEvents[EVENT_GAME_END] = 0x1;

		initialized = true;
	}

	SlippiGame* SlippiGame::FromFile(std::string path) {
		init();

		// Get file and file size
		FILE* inputFile = fopen(path.c_str(), "rb");
		uint64_t fileSize = getSize(inputFile);

		// Write contents to a uint8_t array
		uint8_t* fileContents = (uint8_t*)malloc(fileSize);
		fread(fileContents, sizeof(uint8_t), fileSize, inputFile);
		fclose(inputFile);

		SlippiGame* result = processFile(fileContents, fileSize);
		
		free(fileContents);
		return result;
	}

	FrameData* SlippiGame::GetFrame(int32_t frame) {
		// Get the index offset for this frame
		FrameData firstFrame = game->frameData.at(0);
		int32_t offset = firstFrame.frame;

		// Get the frame we want
		return &game->frameData.at(frame - offset);
	}
}