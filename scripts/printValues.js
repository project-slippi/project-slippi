const { default: SlippiGame } = require('slp-parser-js');
const _ = require('lodash');

const replayPath = "C:\\Users\\Jas\\go\\src\\github.com\\jlaferri\\ruckus\\replays\\fd-spawn-land.slp";

const game = new SlippiGame(replayPath);

const gameFrames = game.getFrames();

_.forEach(gameFrames, (frame, frameNum) => {
	const p1Post = frame.players[0].post;
	const p2Post = frame.players[0].post;
	console.log(`[${frameNum}] (${p1Post.positionX}, ${p1Post.positionY}) | (${p2Post.positionX}, ${p2Post.positionY})`);
});