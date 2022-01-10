const { default: SlippiGame } = require('slp-parser-js');
const path = require('path');
const moment = require('moment');
const _ = require('lodash');
const fs = require('fs');

// const basePath = "D:\\Slippi\\Tournament-Replays\\Genesis-7";
const basePath = "D:\\Slippi\\Tournament-Replays\\Summit-11";

const dashbackThreshold = 0.8;
const newDashbackThreshold = 0.9125;
const componentThreshold = 0.95;

function shouldIncludeGame(metadata, settings) {
	if (!metadata || !settings) {
		return false;
	}

	const noCPUs = _.every(settings.players, player => player.type === 0);
	const isHumanSingles = settings.players.length === 2 && noCPUs;
	if (!isHumanSingles) {
		return false;
	}

	// const gameTime = moment(metadata.startAt);
	// // const afterPools = gameTime.isAfter('2020-01-25T18:00:00');
	// // if (afterPools) {
	// // 	return true;
	// // }

	// const isTop8 = gameTime.isAfter('2020-01-26T14:00:00');
	// if (isTop8) {
	// 	return true;
	// }

	return true;
}

function getClips(gameDump) {
  const filePath = path.join(basePath, gameDump.filePath.replace(basePath, ""));
  const frames = gameDump.frames;

  const mismatchResults = _.chain(frames).flatMap(frame => {
    return _.flatMap(frame.players, (player, playerIndex) => {
      if (!player) {
        return [];
      }

			const frameMinus2 = frames[frame.frame - 2]?.players[playerIndex]?.pre;
			const frameMinus1 = frames[frame.frame - 1]?.players[playerIndex]?.pre;
			const frame0 = player.pre;
			const frame1 = frames[frame.frame + 1]?.players[playerIndex]?.pre;
			const frame2 = frames[frame.frame + 2]?.players[playerIndex]?.pre;

			if (!frameMinus2 || !frameMinus1 || !frame1 || !frame2) {
				return [];
			}

			const f0AS = frame0.actionStateId;
			const f1AS = frame1.actionStateId;
			const f2AS = frame2.actionStateId;

			const frameMinus2Input = parseFloat((frameMinus2.joystickX*frame0.facingDirection).toFixed(4));
			const frameMinus1Input = parseFloat((frameMinus1.joystickX*frame0.facingDirection).toFixed(4));
			const frame0Input = parseFloat((frame0.joystickX*frame0.facingDirection).toFixed(4));
			const frame1Input = parseFloat((frame1.joystickX*frame0.facingDirection).toFixed(4));
			const frame1Component = parseFloat(Math.sqrt(Math.pow(frame1.joystickX, 2) + Math.pow(frame1.joystickY, 2)).toFixed(4));

			const isDashback = f0AS === 0xE && f1AS === 0x12 && f2AS === 0x14;
			const isTurn = f0AS === 0xE && f1AS === 0x12 && f2AS === 0x12;

			const isDashbackAvailable = frameMinus2Input >= 0 || frameMinus1Input >= 0;

			if (isDashback || isTurn) {
				const isVanillaDashback = isDashbackAvailable &&
              frame0Input <= -dashbackThreshold &&
              frame1Input <= -dashbackThreshold;
							
				// Check for two frame window with increased threshold.
				// Can be vanilla dashback or just the frame 1 window over the component thresh
				if (isVanillaDashback || (isDashbackAvailable && frame1Input <= -dashbackThreshold && frame1Component >= componentThreshold)) {
					if (isTurn) {
						return [{ frame: frame.frame, playerIndex: playerIndex }];
					}
				} else {
					if (isDashback) {
						// return [{ frame: frame.frame, playerIndex: playerIndex }];
					}
				}
			}

      return [];
    });
  }).sortBy('frame').value();

  const startAt = gameDump.metadata.startAt;
  const station = gameDump.metadata.consoleNick;

  return _.map(mismatchResults, mismatchInfo => {
    const momentStartAt = moment(startAt);

    return {
      path: filePath,
      startFrame: mismatchInfo.frame - 30,
      endFrame: mismatchInfo.frame + 120,
      gameStartAt: momentStartAt.format("M/D/YY · h:mm a"),
      gameStation: `${station} [P${mismatchInfo.playerIndex + 1}]`,
      unixStartAt: momentStartAt.unix(),
    };
  });
}

function writeClipFile(clips) {
  const outputClips = _.map(clips, clip => _.pick(clip, ['path', 'startFrame', 'endFrame', 'gameStartAt', 'gameStation']));

  const output = {
    mode: "queue",
    outputOverlayFiles: true,
    queue: outputClips,
  };

  fs.writeFileSync('playback.txt', JSON.stringify(output));
}

function processAll(start, count) {
	const tournamentDir = basePath;
	const stationDirs = fs.readdirSync(tournamentDir, { withFileTypes: true });

	// Start by collecting all files
	const filePaths = _.flatMap(stationDirs, (dir) => {
		if (!dir.isDirectory()) {
			return [];
		}

		// TODO: Make sure we are grabbing slp files
		const stationDirPath = path.join(tournamentDir, dir.name);
		const fileNames = fs.readdirSync(stationDirPath);
		return _.map(fileNames, (fileName) => path.join(stationDirPath, fileName));
	});

	console.log(`Filtering through a total of ${filePaths.length} files...`);

	// Load all files and filter down to just the games we want
	let games = _.map(filePaths, (filePath) => new SlippiGame(filePath));
	let filteredGames = _.filter(games, (game) => {
		const settings = game.getSettings();
		const metadata = game.getMetadata();
		return shouldIncludeGame(metadata, settings);
	});

	console.log(`Processing ${filteredGames.length} games...`);
	
	// Make games inaccessible through this variable so garbage collect will pick up on them
	games = null;

	const chunkSize = 25;
	const filteredGamesCount = filteredGames.length;
	const processChunks = _.chunk(filteredGames, chunkSize);
	filteredGames = null;

	let lastProcessedIdx = filteredGamesCount;

	// Do a stupid chunk loop by index so that we can hopefully get rid of all references
	// to earlier chunks to make GC work right
	const allClips = _.flatMap(_.range(0, processChunks.length), (chunkIdx) => {
		console.log(`Processing chunk ${chunkIdx}...`);

		let chunk = processChunks[chunkIdx];
		const chunkResult = _.flatMap(chunk, (game, idxWithinChunk) => {
			const idx = (chunkIdx * chunkSize) + idxWithinChunk;
			if (idx < start || idx >= (start + count)) {
				return [];
			}
	
			const relPath = game.getFilePath().replace(tournamentDir, "");

			console.log(`Processing game ${idx} / ${filteredGamesCount} (${relPath})`);

			let settings, metadata, frames;
			try {
				settings = game.getSettings();
				frames = game.getFrames();
				metadata = game.getMetadata() || {};
			} catch (ex) {
				console.log(ex);
				return [];
			}
	
			const res = {
				gameIdx: idx,
				filePath: relPath,
				settings: settings,
				frames: frames,
				metadata: metadata,
			};
	
			lastProcessedIdx = idx;
			return getClips(res);
		});

		// Trying to clear chunk out of memory
		console.log(`Trying to remove chunk ${chunkIdx} from memory...`);
		chunk = null;
		processChunks[chunkIdx] = null;

		return chunkResult;
  });
  
  const frameSum = _.sumBy(allClips, clip => clip.endFrame - clip.startFrame);
  console.log(`Extracted a total of ${allClips.length} with a duration of ${(frameSum / 3600).toFixed(1)} minutes.`);

  // Get random 5 minute sampling of clips
  const shuffledClips = _.shuffle(allClips);
  const top120Clips = _.take(shuffledClips, 180);
  const remainingClips = _.orderBy(top120Clips, [clip => clip.unixStartAt]);

  console.log(`Writing ${remainingClips.length} clips from ${lastProcessedIdx + 1} games...`);
  writeClipFile(remainingClips);
};

processAll(0, 999999);
