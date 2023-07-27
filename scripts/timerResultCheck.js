const { spawn } = require('child_process');
const { chunk, flatten, take, size } = require('lodash');
const { SlippiGame } = require("@slippi/slippi-js");


const archivePath = "C:\\Users\\fizzi\\Documents\\Slippi\\Replays\\ranked-anonymized\\ranked-anonymized-1-116248.7z";
const numWorkers = 10;


const startTime = process.hrtime.bigint();
function getElapsedTime() {
  const NS_PER_SEC = 1e9;
  const SECONDS_PER_MIN = 60; 

  const elapsedSeconds = Number((process.hrtime.bigint() - startTime) / BigInt(NS_PER_SEC));

  const minutes = Math.floor(elapsedSeconds / SECONDS_PER_MIN);
  const seconds = Math.floor(elapsedSeconds - minutes * SECONDS_PER_MIN);

  let timeString = '';
  if (minutes > 0) {
    timeString += `${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`;
  }
  if (seconds > 0) {
    timeString += `${minutes > 0 ? ' ' : ''}${seconds} ${seconds === 1 ? 'second' : 'seconds'}`;
  }

  return timeString || 'less than 1 second';
}

function spawnPromise(command, args) {
  return new Promise((resolve, reject) => {
    const process = spawn(command, args);

    let stdoutData = Buffer.alloc(0);
    let stderrData = Buffer.alloc(0);

    process.stdout.on('data', (data) => {
      stdoutData = Buffer.concat([stdoutData, data]);
    });

    process.stderr.on('data', (data) => {
      stderrData = Buffer.concat([stderrData, data]);
    });

    process.on('error', (err) => {
      reject(err);
    });

    process.on('close', (code) => {
      if (code === 0) {
        resolve({ stdout: stdoutData, stderr: stderrData });
      } else {
        reject(new Error(`Process exited with code ${code}`));
      }
    });
  });
}

async function listFilesInArchive() {
  try {
    const { stdout } = await spawnPromise('7z', ['l', archivePath]);

    const fileNames = stdout
      .toString()
      .split('\n')
      .map(line => {
        // Get file name from line
        const split = line.trim().split(" ");
        const last = split[split.length - 1];
        return last.endsWith(".slp") ? last : null;
      })
      .filter(fileName => fileName !== null);

    return fileNames;
  } catch (error) {
    console.error('Error listing files from archive:', error);
    return [];
  }
}

async function runWorker(num, fileNames) {
  const results = [];

  const totalFiles = fileNames.length;

  console.log(`Starting worker ${num}...`);
  for (const fileName of fileNames) {
    // console.log(`Processing ${fileName}...`);
    try {
      const { stdout } = await spawnPromise('7z', ['e', '-so', archivePath, fileName]);
      results.push(await getResultFromFile(stdout));
      console.log(`[${getElapsedTime()}] Worker ${num} finished ${results.length}/${totalFiles} (${(100 * (results.length/totalFiles)).toFixed(2)}%) files`);
    } catch (error) {
      console.error(`Error extracting ${fileName}:`, error);
    }
  }

  console.log(`Worker ${num} finished.`);
  return results;
}

async function processFiles(fileNames) {
  console.log(`Processing ${fileNames.length} files...`)
  const chunks = chunk(fileNames, Math.ceil(fileNames.length / numWorkers));

  const promises = chunks.map((chunk, i) => runWorker(i, chunk));
  const results = await Promise.all(promises);

  return flatten(results);
}

async function getResultFromFile(buffer) {
  const game = new SlippiGame(buffer);
  const frames = game.getFrames();
  const winnerIndex = game.getWinners()?.[0]?.playerIndex ?? -1;

  const result = {}
  for (let minute = 2; minute <= 7; minute++) {
    const frameNum = minute * 60 * 60;
    const frame = frames[frameNum];
    if (!frame) {
      result[minute] = { isComplete: true };
      break;
    }

    // Game is not complete yet at this minute, determine if the person leading ends up winning
    const p0Stocks = frame.players[0].post.stocksRemaining;
    const p1Stocks = frame.players[1].post.stocksRemaining;
    const p0Percent = Math.trunc(frame.players[0].post.percent);
    const p1Percent = Math.trunc(frame.players[1].post.percent);

    const iResult = { winnerIndex, p0Stocks, p1Stocks, p0Percent, p1Percent };

    if (p0Stocks > p1Stocks) {
      result[minute] = { isComplete: false, leaderEndsUpWinning: winnerIndex === 0, ...iResult };
      continue;
    } else if (p1Stocks > p0Stocks) {
      result[minute] = { isComplete: false, leaderEndsUpWinning: winnerIndex === 1, ...iResult };
      continue;
    }

    if (p0Percent < p1Percent) {
      result[minute] = { isComplete: false, leaderEndsUpWinning: winnerIndex === 0, ...iResult };
      continue;
    } else if (p1Percent < p0Percent) {
      result[minute] = { isComplete: false, leaderEndsUpWinning: winnerIndex === 1, ...iResult };
      continue;
    }

    result[minute] = { isComplete: false, leaderEndsUpWinning: false, ...iResult };
  }

  return result;
}

async function combineResults(results) {
  const totalCount = size(results);

  const result = {};
  for (let minute = 2; minute <= 7; minute++) {
    const minuteResults = results.map(r => r[minute]);
    const completeCount = minuteResults.filter(r => r?.isComplete || r === undefined).length;
    const incompleteCount = minuteResults.filter(r => r?.leaderEndsUpWinning !== undefined).length;
    const winnerCount = minuteResults.filter(r => r?.leaderEndsUpWinning === true).length;

    // if (minute === 6) {
    //   console.log(minuteResults.filter(r => r?.leaderEndsUpWinning !== undefined))
    // }

    const percentComplete = `${(100 * completeCount / totalCount).toFixed(2)}%`;
    const leaderWinsPercent = `${(100 * winnerCount / incompleteCount).toFixed(2)}%`;

    result[minute] = { percentComplete, leaderWinsPercent };
  }

  return result;
}

(async () => {
  const fileNames = await listFilesInArchive();
  const results = await processFiles(take(fileNames, 30000));
  const combinedResult = await combineResults(results);
  console.log(combinedResult);
})();