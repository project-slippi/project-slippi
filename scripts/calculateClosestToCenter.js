const { SlippiGame } = require("@slippi/slippi-js");

const game = new SlippiGame("D:\\Slippi\\Tournament-Replays\\Genesis-8\\Top 8\\Game_8C56C58C3FBD_20220417T181205.slp");
const frames = Object.values(game.getFrames());

const settings = game.getSettings();

const p1Idx = settings.players[0].playerIndex;
const p2Idx = settings.players[1].playerIndex;

let p1CloserCount = 0;
let p2CloserCount = 0;

frames.forEach(frame => {
  p1Post = frame.players[p1Idx].post;
  p2Post = frame.players[p2Idx].post;
  p1Distance = Math.sqrt(p1Post.positionX * p1Post.positionX + p1Post.positionY * p1Post.positionY);
  p2Distance = Math.sqrt(p2Post.positionX * p2Post.positionX + p2Post.positionY * p2Post.positionY);

  if (p1Distance < p2Distance) {
    p1CloserCount += 1;
  } else if (p2Distance < p1Distance) {
    p2CloserCount += 1;
  }
});

const total = frames.length;
console.log(`Port: FramesCloserTo0 (PercentOfGameCloserTo0)`);
console.log(`P${p1Idx + 1}: ${p1CloserCount} (${(100 * p1CloserCount / total).toFixed(1)}%)`);
console.log(`P${p2Idx + 1}: ${p2CloserCount} (${(100 * p2CloserCount / total).toFixed(1)}%)`);