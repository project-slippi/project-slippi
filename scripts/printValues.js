const { SlippiGame } = require("@slippi/slippi-js");
const _ = require('lodash');

// const replayPath = "C:\\Users\\Jas\\go\\src\\github.com\\jlaferri\\ruckus\\replays\\fd-spawn-land.slp";
const replayPath = "C:\\Users\\Jas\\Downloads\\ginger-inputs.slp";

const game = new SlippiGame(replayPath);

const gameFrames = game.getFrames();

_.forEach(gameFrames, (frame, frameNum) => {
	if (frameNum < 1525 || frameNum > 1575) {
		return;
	}
	// Print Positions
	// const p1Post = frame.players[0].post;
	// const p2Post = frame.players[0].post;
	// console.log(`[${frameNum}] (${p1Post.positionX}, ${p1Post.positionY}) | (${p2Post.positionX}, ${p2Post.positionY})`);

	// Print X-analog inputs
	const p1Pre = frame.players[0].pre;
	console.log(`[${frameNum}] [X-Analog] Processed: ${p1Pre.joystickX.toFixed(4)}, Raw: ${p1Pre.rawJoystickX}`);
});