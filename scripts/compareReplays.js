const { SlippiGame } = require("@slippi/slippi-js");
const util = require('util');
const _ = require('lodash');
const moment = require('moment');

const replay1Path = String.raw`/Users/Fizzi/Downloads/Desyncs/Real/cherryello-1/one.slp`;
const replay2Path = String.raw`/Users/Fizzi/Downloads/Desyncs/Real/cherryello-1/two.slp`;

// Set to 0 to print all
const framePrintMax = 30;
const posLenient = false;

const game1 = new SlippiGame(replay1Path);
const game2 = new SlippiGame(replay2Path);

const game1Frames = game1.getFrames();
const game2Frames = game2.getFrames();

const gameSettings = game1.getSettings(); // These should be identical between the two games

let iFrameIdx = -123;
let framePrintCount = 0;

const deadActionStates = {
	"6": true,
	"7": true,
};

const ignoredKeys = {
	"physicalLTrigger": true,
	"physicalRTrigger": true,
	"selfInducedSpeeds": true,
};

const processing = {
	"positionX": {
		enabled: posLenient,
		pre: (val) => Math.trunc(val * 10.0),
		post: (val) => val / 10.0,

	},
	"positionY": {
		enabled: posLenient,
		pre: (val) => Math.trunc(val * 10.0),
		post: (val) => val / 10.0,
	},
	"seed": {
		enabled: true,
		post: (val) => `0x${val.toString(16)}`,
	},
	"buttons": {
		enabled: true,
		post: (val) => `0x${val.toString(16)}`,
	}
}

function findDifferences(f1, f2, type, playerIndex, isFollower) {
	const difference = {};

	if (!f1 || !f2) {
		return difference;
	}

	const t1 = f1[type];
	const t2 = f2[type];

	const prefix = isFollower ? "follower-" : "";

	// if (f1.post.frame === 1950 && isFollower) {
	// 	console.log(f1);
	// }

	// // Seems to be a weird case where Nana does inputs while dead?
	// if (deadActionStates[f1.post.actionStateId] && f1.post.actionStateId === f2.post.actionStateId && isFollower) {
	// 	return;
	// }

	_.forEach(t1, (value, key) => {
		if (ignoredKeys[key]) {
			return;
		}


		// // TEMP: Only look for frames with input desync
		// if (key !== "joystickX" && key !== "buttons" && key !== "joystickY" && key !== "cStickX" && key !== "cStickY" && key !== "trigger") {
		// 	return;
		// }

		let val1 = value;
		let val2 = t2[key];

		const p = processing[key];
		if (p?.enabled && p?.pre) {
			val1 = p.pre(val1);
			val2 = p.pre(val2);
		}

		if (val1 === val2) {
			return;
		}

		if (p?.enabled && p?.post) {
			val1 = p.post(val1);
			val2 = p.post(val2);
		}

		// difference[`${prefix}${type}-actionStateIdFixed-${playerIndex}`] = `${t1['actionStateId']} | ${t2['actionStateId']}`;
		difference[`${prefix}${type}-${key}-${playerIndex}`] = `${val1} | ${val2}`;
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

while (game1Frames[iFrameIdx] && game2Frames[iFrameIdx]) {
	let difference = {};

	const game1Frame = game1Frames[iFrameIdx];
	const game2Frame = game2Frames[iFrameIdx];

	_.forEach(gameSettings.players, (player) => {
		const f1 = game1Frame.players[player.playerIndex];
		const f2 = game2Frame.players[player.playerIndex];

		difference = {
			...difference,
			...findDifferences(f1, f2, "pre", player.playerIndex, false),
			...findDifferences(f1, f2, "post", player.playerIndex, false),
		};

		const ff1 = _.get(game1Frame, ['followers', player.playerIndex]);
		const ff2 = _.get(game2Frame, ['followers', player.playerIndex]);

		// Check for nana desyncs
		if (ff1 && ff2) {
			difference = {
				...difference,
				...findDifferences(ff1, ff2, "pre", player.playerIndex, true),
				...findDifferences(ff1, ff2, "post", player.playerIndex, true),
			};
		}
	});

	if (!_.isEmpty(difference)) {
		const duration = moment.duration((28800 - iFrameIdx) / 60, 'seconds');

		console.log({
			frame: iFrameIdx,
			printCount: framePrintCount,
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

console.log("Processing complete...");