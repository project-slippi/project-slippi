const { default: SlippiGame } = require('slp-parser-js');
const _ = require('lodash');
const moment = require('moment');

//const replayPath = "C:\\Slippi\\OnlineDesyncs\\InputDesync\\3Jas.slp";
//const frameToFetch = 3515;

const replayPath = "C:\\Slippi\\OnlineDesyncs\\InputDesync\\Laptop.slp";
const frameToFetch = 8111;
const playerIndex = 1;

const game = new SlippiGame(replayPath);

const gameFrames = game.getAllFrames();

const extractedFrames = [];
_.forEach(gameFrames, frame => {
	if (frame.frame !== frameToFetch) {
		return;
	}

	const obj = frame.players[playerIndex].pre;
	console.log(obj);
	extractedFrames.push(obj);
});

// const extractedFramesByIndex = {};
// _.forEach(gameFrames, frame => {
// 	if (!extractedFramesByIndex[frame.frame]) {
// 		extractedFramesByIndex[frame.frame] = [];
// 	}

// 	extractedFramesByIndex[frame.frame].push(frame);
// });

// _.forEach(extractedFramesByIndex, framesByIndex => {
// 	const allFramesMatch = _.every(framesByIndex, f => _.isEqual(f.players[1].pre, framesByIndex[1].players[01].pre));
// 	if (!allFramesMatch) {
// 		console.log(`[${framesByIndex[0].frame}] Not all match`);
// 	}
// });