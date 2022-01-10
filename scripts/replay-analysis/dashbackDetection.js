const { default: SlippiGame } = require('slp-parser-js');
const path = require('path');
const _ = require('lodash');
const fs = require('fs');
const util = require('util');

// const basePath = "D:\\Slippi\\Tournament-Replays\\Genesis-7";
// const basePath = "D:\\Slippi\\Tournament-Replays\\Summit-11";
const basePath = "D:\\Slippi\\Tournament-Replays\\The-Big-House-9";

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

	// Load all files and filter down to just singles games
	let games = _.map(filePaths, (filePath) => new SlippiGame(filePath));
	let singlesGames = _.filter(games, (game) => {
		const settings = game.getSettings();
		const noCPUs = _.every(settings.players, player => player.type === 0);
		return settings.players.length === 2 && noCPUs;
	});

	console.log(`Processing ${singlesGames.length} games...`);
	
	// Make games inaccessible through this variable so garbage collect will pick up on them
	games = null;

	const chunkSize = 25;
	const singlesGamesCount = singlesGames.length;
	const processChunks = _.chunk(singlesGames, chunkSize);
	singlesGames = null;

	let lastProcessedIdx = singlesGamesCount;

	const emptyResult = {
		turnCount: 0,
		dashCount: 0,
    turnBecomesDash: 0,
    dashBecomesTurn: 0,
	};

	const results = {
		oneFrame: { ...emptyResult },
		twoFrame: { ...emptyResult },
    twoFrameNewThresh: { ...emptyResult },
    componentThresh: { ...emptyResult },
		fromGameUcf: { ...emptyResult },
	};

  const minus2InputsOnTurn = {};
  const minus2InputsOnDash = {};

  const dashbackThreshold = 0.8;
  const newDashbackThreshold = 0.9125;
  const componentThreshold = 0.95;

	// Do a stupid chunk loop by index so that we can hopefully get rid of all references
	// to earlier chunks to make GC work right
	_.forEach(_.range(0, processChunks.length), (chunkIdx) => {
		console.log(`Processing chunk ${chunkIdx}...`);

		let chunk = processChunks[chunkIdx];
		_.forEach(chunk, (game, idxWithinChunk) => {
			const idx = (chunkIdx * chunkSize) + idxWithinChunk;
			if (idx < start || idx >= (start + count)) {
				return;
			}
	
			const relPath = game.getFilePath().replace(tournamentDir, "");

			console.log(`Processing game ${idx} / ${singlesGamesCount} (${relPath})`);

			let settings, frames;
			try {
				settings = game.getSettings();
				frames = game.getFrames();
			} catch (ex) {
				console.log(ex);
				return;
			}

      const sortedFrames = _.sortBy(frames, 'frame');
      // console.log(util.inspect(settings, { depth: 10, colors: true }));
      _.forEach(settings.players, player => {
        _.forEach(sortedFrames, frame => {
          // The processed inputs are fully zero'd out during freeze time, don't process this
          // frame if we can't correctly determine prior state
          if (frame.frame - 2 < -39) {
            return;  
          }

          const frameMinus2 = frames[frame.frame - 2]?.players[player.playerIndex].pre;
          const frameMinus1 = frames[frame.frame - 1]?.players[player.playerIndex].pre;
          const frame0 = frame.players[player.playerIndex].pre;
          const frame1 = frames[frame.frame + 1]?.players[player.playerIndex].pre;
          const frame2 = frames[frame.frame + 2]?.players[player.playerIndex].pre;

          if (!frameMinus2 || !frameMinus1 || !frame1 || !frame2) {
            return;
          }

          const f0AS = frame0.actionStateId;
          const f1AS = frame1.actionStateId;
          const f2AS = frame2.actionStateId;

          // The parseFloat and toFixed process is to compensate for floating point math error, we
          // want the values to be exactly 4 decimal places to >= comparisons will work with exact
          // const value thresholds defined above
          const frameMinus2Input = parseFloat((frameMinus2.joystickX*frame0.facingDirection).toFixed(4));
          const frameMinus1Input = parseFloat((frameMinus1.joystickX*frame0.facingDirection).toFixed(4));
          const frame0Input = parseFloat((frame0.joystickX*frame0.facingDirection).toFixed(4));
          const frame1Input = parseFloat((frame1.joystickX*frame0.facingDirection).toFixed(4));
          const frame1Component = parseFloat(Math.sqrt(Math.pow(frame1.joystickX, 2) + Math.pow(frame1.joystickY, 2)).toFixed(4));

          const isDashback = f0AS === 0xE && f1AS === 0x12 && f2AS === 0x14;
          const isTurn = f0AS === 0xE && f1AS === 0x12 && f2AS === 0x12;

          const isDashbackAvailable = frameMinus2Input >= 0 || frameMinus1Input >= 0;

          if (isDashback) {
            results.fromGameUcf.dashCount++;
            // const curCountForInput = minus2InputsOnDash[frameMinus2Input] || 0;
            // minus2InputsOnDash[frameMinus2Input] = curCountForInput + 1;
            if (!isDashbackAvailable) {
              console.log(`Detected strange dashback for P${player.playerIndex+1} on frame ${frame.frame}`);
              console.log(`[-2] ${frameMinus2Input}, [-1] ${frameMinus1Input}`);
            }
          } else if (isTurn) {
            results.fromGameUcf.turnCount++;
            // const curCountForInput = minus2InputsOnTurn[frameMinus2Input] || 0;
            // minus2InputsOnTurn[frameMinus2Input] = curCountForInput + 1;
          }

          if (isDashback || isTurn) {
            const isVanillaDashback = isDashbackAvailable &&
              frame0Input <= -dashbackThreshold &&
              frame1Input <= -dashbackThreshold;

            // Check for one frame window
            if (isVanillaDashback) {
              results.oneFrame.dashCount++;
              results.oneFrame.turnBecomesDash += isTurn ? 1 : 0;
            } else {
              results.oneFrame.turnCount++;
              results.oneFrame.dashBecomesTurn += isDashback ? 1 : 0;
            }
            
            // Check for two frame window.
            // Can be vanilla dashback or just the frame 1 window over the threshold
            if (isVanillaDashback || (isDashbackAvailable && frame1Input <= -dashbackThreshold)) {
              results.twoFrame.dashCount++;
              results.twoFrame.turnBecomesDash += isTurn ? 1 : 0;
            } else {
              results.twoFrame.turnCount++;
              results.twoFrame.dashBecomesTurn += isDashback ? 1 : 0;
            }

            // Check for two frame window with increased threshold.
            // Can be vanilla dashback or just the frame 1 window over the new threshold
            if (isVanillaDashback || (isDashbackAvailable && frame1Input <= -newDashbackThreshold)) {
              results.twoFrameNewThresh.dashCount++;
              results.twoFrameNewThresh.turnBecomesDash += isTurn ? 1 : 0;
            } else {
              results.twoFrameNewThresh.turnCount++;
              results.twoFrameNewThresh.dashBecomesTurn += isDashback ? 1 : 0;
            }

            if (isVanillaDashback || (isDashbackAvailable && frame1Input <= -dashbackThreshold && frame1Component >= componentThreshold)) {
              results.componentThresh.dashCount++;
              results.componentThresh.turnBecomesDash += isTurn ? 1 : 0;
            } else {
              results.componentThresh.turnCount++;
              results.componentThresh.dashBecomesTurn += isDashback ? 1 : 0;
            }
          }
        });
      });
	
			lastProcessedIdx = idx;
		});

		// Trying to clear chunk out of memory
		console.log(`Trying to remove chunk ${chunkIdx} from memory...`);
		chunk = null;
		processChunks[chunkIdx] = null;
  });
  
  // const sortedminus2InputsOnTurn = _.chain(minus2InputsOnTurn).map((count, value) => {
  //   return { value: parseFloat(value), count: count  };
  // }).sortBy('value').map((entry) => ({ value: entry.value.toFixed(4), count: entry.count })).value();

  // const sortedminus2InputsOnDash = _.chain(minus2InputsOnDash).map((count, value) => {
  //   return { value: parseFloat(value), count: count  };
  // }).sortBy('value').map((entry) => ({ value: entry.value.toFixed(4), count: entry.count })).value();

  console.log(`Done processing ${lastProcessedIdx + 1} games...`);
  // console.log(util.inspect({
  //   minus2InputsOnTurn: sortedminus2InputsOnTurn,
  //   minus2InputsOnDash: sortedminus2InputsOnDash,
  // }, { colors: true, maxArrayLength: 101 }));
  console.log(results);
};

processAll(0, 999999);
