const { iterateEvents, openSlpFile } = require("@slippi/slippi-js");
const fs = require('fs');

const file = openSlpFile({
  source: "file",
  filePath: "D:\\Slippi\\Bugs\\ECBCrash\\11-seconds-modded.slp",
});

let output = "";
const frames = [];
let lastFrame = null;
let idx = 0;

iterateEvents(file, (cmd, payload, buf) => {
  // console.log(cmd.toString(16));
  if (cmd === 0x3A) {
    if (output === "") {
      output = `#define replay_start_seed 0x${payload.seed.toString(16)}\n`;
    }
  } else if (cmd === 0x37) {
    if (payload.isFollower) {
      return false; // Continue without stopping
    }

    if (lastFrame !== payload.frame) {
      frames.push({});
      idx = frames.length - 1;
      lastFrame = payload.frame;
    }
    
    const inputs = [];
    inputs.push(...buf.slice(0x19, 0x31));
    inputs.push(buf[0x3b]);
    frames[idx][payload.playerIndex] = inputs;
  }
});

const playerLen = 0x19;
const colLen = 1 + playerLen * 4;
output += `#define replay_frame_count ${frames.length}\n\n`;
output += `const unsigned char replay_frame_resp[${frames.length}][${colLen}] = {\n`;
output += frames.map(inp => {
  const p1 = inp[0] ?? new Array(playerLen).fill(0);
  const p2 = inp[1] ?? new Array(playerLen).fill(0);
  const p3 = inp[2] ?? new Array(playerLen).fill(0);
  const p4 = inp[3] ?? new Array(playerLen).fill(0);
  const vals = [1, ...p1, ...p2, ...p3, ...p4];
  const formatted = vals.map(v => `0x${v.toString(16)}`);
  return `\t{${formatted.join(", ")}},`;
}).join("\n");

output += "\n};\n";

fs.writeFileSync("./replay_header.h", output);