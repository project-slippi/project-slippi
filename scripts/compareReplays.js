const { default: SlippiGame } = require('slp-parser-js');
const _ = require('lodash');
const moment = require('moment');

const replay1Path = "C:\\Slippi\\OnlineDesyncs\\Release\\HtwaVsSlowking\\Game1.slp";
const replay2Path = "C:\\Slippi\\OnlineDesyncs\\Release\\HtwaVsSlowking\\Game2.slp";

const game1 = new SlippiGame(replay1Path);
const game2 = new SlippiGame(replay2Path);

const game1Frames = game1.getFrames();
const game2Frames = game2.getFrames();

const gameSettings = game1.getSettings(); // These should be identical between the two games

let iFrameIdx = -123;

function findDifferences(f1, f2, type, playerIndex) {
	const difference = {};

	const t1 = f1[type];
	const t2 = f2[type];

	_.forEach(t1, (value, key) => {
		if (key === "physicalLTrigger" || key === "physicalRTrigger") {
			return;
		}

		// // TEMP: Only look for frames with input desync
		// if (key !== "joystickX" && key !== "buttons" && key !== "joystickY" && key !== "cStickX" && key !== "cStickY" && key !== "trigger") {
		// 	return;
		// }

		if (value === t2[key]) {
			return;
		}

		difference[`${type}-${key}-${playerIndex}`] = `${value} | ${t2[key]}`;
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

while (game1Frames[iFrameIdx] && game2Frames[iFrameIdx]) {
	let difference = {};

	const game1Frame = game1Frames[iFrameIdx];
	const game2Frame = game2Frames[iFrameIdx];

	_.forEach(gameSettings.players, (player) => {
		const f1 = game1Frame.players[player.playerIndex];
		const f2 = game2Frame.players[player.playerIndex];

		difference = {
			...difference,
			...findDifferences(f1, f2, "pre", player.playerIndex),
			...findDifferences(f1, f2, "post", player.playerIndex),
		};
	});

	if (!_.isEmpty(difference)) {
		const duration = moment.duration((28800 - iFrameIdx) / 60, 'seconds');

		console.log({
			frame: iFrameIdx,
			timer: moment.utc(duration.as('milliseconds')).format('m:ss.SSS'),
			...difference,
		});
	}

	iFrameIdx += 1;
}