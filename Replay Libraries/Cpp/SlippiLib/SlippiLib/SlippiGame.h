#pragma once

#include "stdafx.h"

#include <string>
#include <vector>

namespace Slippi {
	const uint8_t PLAYER_COUNT = 2;

	typedef struct {
		uint8_t internalCharacterId;
		uint16_t animation;
		float locationX;
		float locationY;
		uint8_t stocks;
		float percent;
		float shieldSize;
		uint8_t lastMoveHitId;
		uint8_t comboCount;
		uint8_t lastHitBy;

		//Controller information
		float joystickX;
		float joystickY;
		float cstickX;
		float cstickY;
		float trigger;
		uint32_t buttons; //This will include multiple "buttons" pressed on special buttons. For example I think pressing z sets 3 bits

		//This is extra controller information
		uint16_t physicalButtons; //A better representation of what a player is actually pressing
		float lTrigger;
		float rTrigger;
	} PlayerFrameData;

	typedef struct {
		int32_t frame;
		uint32_t randomSeed;
		PlayerFrameData players[PLAYER_COUNT];
	} FrameData;

	typedef struct {
		//Static data
		uint8_t characterId;
		uint8_t characterColor;
		uint8_t playerType;
		uint8_t controllerPort;
	} PlayerSettings;

	typedef struct {
		uint16_t stage; //Stage ID
		PlayerSettings player[PLAYER_COUNT];
	} GameSettings;

	typedef struct {
		std::vector<FrameData> frameData;
		GameSettings settings;

		//From OnGameEnd event
		uint8_t winCondition;
	} Game;

	class SlippiGame
	{
	public:
		static SlippiGame* FromFile(std::string path);
	};
}
