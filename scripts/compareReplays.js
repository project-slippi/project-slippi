const { default: SlippiGame } = require('slp-parser-js');
const util = require('util');
const _ = require('lodash');
const moment = require('moment');

const replayPaths = [
	String.raw`C:\Users\Owner\Documents\prog\slippi-replay-tester\Game_20220904T204903.slp`,
	String.raw`C:\Users\Owner\Documents\prog\slippi-replay-tester\Game_20220904T204856.slp`,
	String.raw`C:\Users\Owner\Documents\prog\slippi-replay-tester\Game_20220904T204856_1.slp`,
]

// Set to 0 to print all
const framePrintMax = 50;

const games = replayPaths.map(path => new SlippiGame(path));

const gameFrames = games.map(game => game.getFrames());

const gameSettings = games[0].getSettings(); // These should be identical between the games

let iFrameIdx = -123;
let framePrintCount = 0;

const deadActionStates = {
	"6": true,
	"7": true,
};

function findDifferences(playerFrames, type, playerIndex, isFollower) {
	const difference = {};

	if (playerFrames.some(f => f === null)) {
		return difference;
	}

	const types = playerFrames.map(f => f[type]);

	const prefix = isFollower ? "follower-" : "";

	// if (f1.post.frame === 1950 && isFollower) {
	// 	console.log(f1);
	// }

	// // Seems to be a weird case where Nana does inputs while dead?
	// if (deadActionStates[f1.post.actionStateId] && f1.post.actionStateId === f2.post.actionStateId && isFollower) {
	// 	return;
	// }

	_.forEach(types[0], (value, key) => {
		if (key === "physicalLTrigger" || key === "physicalRTrigger") {
			return;
		}

		// // TEMP: Only look for frames with input desync
		// if (key !== "joystickX" && key !== "buttons" && key !== "joystickY" && key !== "cStickX" && key !== "cStickY" && key !== "trigger") {
		// 	return;
		// }

		if (types.every(t => t[key] === value)) {
			return;
		}

		let printVals = types.map(t => t[key]);

		if (key === "seed" || key === "buttons") {
			printVals = printVals.map(v => `0x${v.toString(16)}`);
		}

        difference[`${prefix}${type}-${key}-${playerIndex}`] = printVals;
	});

	return difference;
}

// console.log(gameSettings.players);

// const f1 = game1Frames[2084].players[0];
// const f2 = game2Frames[2084].players[0];

// console.log(f1);
// console.log(f2);

// const diff = findDifferences(f1, f2, "pre", 0);
// console.log(diff);

// const frameToOutput = 2026;
// console.log(util.inspect({
// 	game1: game1Frames[frameToOutput],
// 	game2: game2Frames[frameToOutput],
// }, false, 10, true));

while (gameFrames.every(e => e[iFrameIdx])) {
	let difference = {};

	const frames = gameFrames.map(g => g[iFrameIdx]);

	_.forEach(gameSettings.players, (player) => {

		const playerFrames = frames.map(f => f.players[player.playerIndex]);

		difference = {
			...difference,
			...findDifferences(playerFrames, "pre", player.playerIndex, false),
			...findDifferences(playerFrames, "post", player.playerIndex, false),
		};

		const followerFrames = frames.map(f => _.get(f, ['followers'], player.playerIndex));

		// Check for nana desyncs
		if (followerFrames.every(f => f !== null)) {
			difference = {
				...difference,
				...findDifferences(followerFrames, "pre", player.playerIndex, true),
				...findDifferences(followerFrames, "post", player.playerIndex, true),
			};
		}
	});

	if (!_.isEmpty(difference)) {
		const duration = moment.duration((28800 - iFrameIdx) / 60, 'seconds');

		console.table({
			frame: iFrameIdx,
			sceneFrame: iFrameIdx + 123,
			timer: moment.utc(duration.as('milliseconds')).format('m:ss.SSS'),
			...difference,
		});

		// Frame -39 is first playable frame. There seem to be some differences during the freeze frames
		if (framePrintMax && iFrameIdx >= -39) {
			framePrintCount++;
			if (framePrintCount > framePrintMax) {
				return;
			}
		}
	}

	iFrameIdx += 1;
}