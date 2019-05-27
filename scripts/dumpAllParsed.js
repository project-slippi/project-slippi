const { default: SlippiGame } = require('slp-parser-js');
const path = require('path');
const _ = require('lodash');
const fs = require('fs');

const forceGC = () => {
   if (global.gc) {
      global.gc();
   } else {
      console.warn('No GC hook! Start your program as `node --expose-gc file.js`.');
   }
};

const dumpAll = (start, count) => {
	const tournamentDir = "D:\\Slippi\\Tournament-Replays\\Pound-2019";
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

	// Make games inaccessible through this variable so garbage collect will pick up on them
	games = null;

	const chunkSize = 50;
	const singlesGamesCount = singlesGames.length;
	const processChunks = _.chunk(singlesGames, chunkSize);
	singlesGames = null;

	let lastProcessedIdx = singlesGamesCount;

	// Do a stupid chunk loop by index so that we can hopefully get rid of all references
	// to earlier chunks to make GC work right
	const allData = _.flatMap(_.range(0, processChunks.length), (chunkIdx) => {
		console.log(`Processing chunk ${chunkIdx}...`);

		let chunk = processChunks[chunkIdx];
		const chunkResult = _.flatMap(chunk, (game, idxWithinChunk) => {
			const idx = (chunkIdx * chunkSize) + idxWithinChunk;
			if (idx < start || idx >= (start + count)) {
				return [];
			}
	
			console.log(`Processing game ${idx} / ${singlesGamesCount}`);

			const settings = game.getSettings();
			const stats = game.getStats();
			const metadata = game.getMetadata() || {};
	
			const res = {
				gameIdx: idx,
				filePath: game.filePath.replace(tournamentDir, ""),
				settings: settings,
				stats: stats,
				metadata: metadata,
			};
	
			lastProcessedIdx = idx;
			return [res];
		});

		// Trying to clear chunk out of memory
		console.log(`Trying to remove chunk ${chunkIdx} from memory...`);
		chunk = null;
		processChunks[chunkIdx] = null;
		forceGC();

		return chunkResult;
	});

	fs.writeFileSync(`slippi-data-${start}-${lastProcessedIdx}.json`, JSON.stringify(allData));
};

dumpAll(0, 9999999);
