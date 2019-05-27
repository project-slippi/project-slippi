const path = require('path');
const _ = require('lodash');
const fs = require('fs');
const moment = require('moment');

// CONFIG
const basePath = "D:\\Slippi\\Tournament-Replays\\Pound-2019";
const dataDumpPath = "C:\\Dolphin\\FM-v5.9-Slippi-r7-Win\\Slippi\\Tournament PXB2\\Temp\\pound-slippi-data-0-9501.json";
const damageMin = 70;
const restComboDamageMin = 75;

const isWithinTimeRange = (startAt, station) => {
	const gameTime = moment(startAt);
	const day1Valid = gameTime.isBetween('2019-04-19T10:00:00', '2019-04-19T22:00:00');
	if (day1Valid) {
		return true;
	}

	const day2Valid = gameTime.isBetween('2019-04-20T10:00:00', '2019-04-20T22:00:00');
	if (day2Valid) {
		return true;
	}

	const day3Valid = gameTime.isBetween('2019-04-21T10:00:00', '2019-04-21T22:00:00');
	if (day3Valid && station === "vgbootcamp") {
		return true;
	}

	return false;
}

const extractCombos = () => {
	const dataDumpStr = fs.readFileSync(dataDumpPath);
	const dataDump = JSON.parse(dataDumpStr);

	const orderedDataDump = _.orderBy(dataDump, [(game) => _.get(game, ['metadata', 'startAt'])]);

	console.log(`Extracting combos from ${orderedDataDump.length} replays...`);
	
	const combos = _.flatMap(orderedDataDump, (gameDump) => {
		const filePath = path.join(basePath, gameDump.filePath.replace(basePath, ""));
		const gameCombos = _.get(gameDump, ['stats', 'combos']) || [];
		const players = _.get(gameDump, ['settings', 'players']) || [];
		const playersByIndex = _.keyBy(players, 'playerIndex');
		return _.flatMap(gameCombos, (combo) => {
			const comboPercent = combo.endPercent - combo.startPercent;
			if (comboPercent < damageMin) {
				// Don't include if combo did not do enough damage
				return [];
			}

			if (!combo.didKill) {
				// Don't include if combo didn't kill (probably a bad idea cause of too far to recover deaths)
				return [];
			}

			const player = playersByIndex[combo.playerIndex];

			const isICs = player.characterId === 14;
			const pummelMoves = _.filter(combo.moves, (move) => move.moveId === 52);
			if (isICs && (pummelMoves.length / combo.moves.length) > 0.4) {
				return [];
			}

			const fdUthrowCgers = {
				12: "Peach",
				9: "Marth",
				0xD: "Pikachu",
			}
			
			const isFd = gameDump.settings.stageId === 32;
			const pummelOrUthrowMoves = _.filter(combo.moves, (move) => (
				move.moveId === 52 || move.moveId === 55
			));
			const isUthrower = !!fdUthrowCgers[player.characterId];
			if (isUthrower && isFd && (pummelOrUthrowMoves.length / combo.moves.length) > 0.7) {
				// If boring chain grab on FD, remove
				return [];
			}

			const isPuff = player.characterId === 15;
			const lastMove = _.last(combo.moves);
			const lastMoveIsRest = _.get(lastMove, 'moveId') === 21;
			if (isPuff && lastMoveIsRest && comboPercent < restComboDamageMin) {
				// Combos ending end rest have a higher damage threshold
				return [];
			}

			const startAt = gameDump.metadata.startAt;
			const station = gameDump.metadata.consoleNick;

			const isTimeValid = isWithinTimeRange(startAt, station);
			if (!isTimeValid) {
				return [];
			}

			const overallStats = _.get(gameDump, ['stats', 'overall']) || [];
			const overallStatsByPlayer = _.keyBy(overallStats, 'playerIndex');
			const statsForOpponent = _.get(overallStatsByPlayer, combo.opponentIndex);
			const opntInputCount = statsForOpponent.inputCount;
			if (opntInputCount < 50) {
				// console.log({
				// 	'startAt': startAt,
				// 	'station': station,
				// });

				// 50 inputs is kind of arbitrary, but we'll assume that under that amount, the opponent
				// was not playing
				return [];
			}

			const opponent = playersByIndex[combo.opponentIndex];

			return [{
				path: filePath,
				startFrame: combo.startFrame - 90,
				endFrame: combo.endFrame + 60,
				gameStartAt: moment(startAt).format("M/D/YY · h:mm a"),
				gameStation: station,
				additional: {
					characterId: player.characterId,
					opponentCharacterId: opponent.characterId,
				}
			}];
		});
	});

	const sumFrames = _.sumBy(combos, (combo) => combo.endFrame - combo.startFrame);

	console.log(`Extracted ${combos.length} combos. ${sumFrames / 3600} minutes.`);

	console.log(`Combo counts by character:`);
	const combosByCharacter = _.groupBy(combos, (combo) => combo.additional.characterId);
	_.forEach(combosByCharacter, (combosForCharacter, characterId) => {
		console.log(`${characterId}: ${combosForCharacter.length}`);
	});

	// TODO: Log out all nametags used for verification

	const combosWithoutAdditional = _.map(combos, (combo) => {
		return _.omit(combo, ['additional']);
	});

	fs.writeFileSync('combos.json', JSON.stringify(combosWithoutAdditional));
};

extractCombos();
