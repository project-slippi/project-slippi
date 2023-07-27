const { SlippiGame } = require("@slippi/slippi-js");
const util = require('util');
const _ = require('lodash');
const path = require('path');
const moment = require('moment');
const fs = require('fs');

const replay1Path = String.raw`C:\Users\fizzi\Downloads\Game_20230208T221627.slp`;
const replay2Path = String.raw`C:\Users\fizzi\Downloads\desyncs_2023-02-09_mode.direct-2023-02-09T03_09_13.85-1-4-0_0e63d422-19hS0N7qk8fnZ0oY1xKGm8N3wUG2.slp`;

// Set to 0 to print all
const framePrintMax = 20;
const posLenient = true;
const posOnly = true;
const showFreezeFrames = true;

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
		isEqual: (v1, v2) => Math.abs(v1 - v2) < 1,

	},
	"positionY": {
		enabled: posLenient,
		isEqual: (v1, v2) => Math.abs(v1 - v2) < 1,
	},
	"seed": {
		enabled: true,
		post: (val) => `0x${val.toString(16)}`,
	},
	"buttons": {
		enabled: true,
		post: (val) => `0x${val.toString(16)}`,
	}
};

const game1 = new SlippiGame(replay1Path);
const game2 = new SlippiGame(replay2Path);

const game1Frames = game1.getFrames();
const game2Frames = game2.getFrames();

const gameSettings = game1.getSettings(); // These should be identical between the two games

const codeNames = {
	// Third-party codes
	"8007D5A0": "Fastfall Sparkle v1.2",
	"802F6690": "HUD Transparency v1.1",
	"802F71E0": "Smaller \"Ready, GO!\"",
	"80071960": "Yellow During IASA",
	"800CC818": "Turn Green When Actionable",
	"8008A478": "Turn Green When Actionable",
	"801C3374": "Target Test Never Ends [Link Master]",
	"80450F94": "Unrestricted Pause Camera [Link Master]",
	"80450F98": "Unrestricted Pause Camera [Link Master]",
	"80450F9C": "Unrestricted Pause Camera [Link Master]",
	"80450FA0": "Unrestricted Pause Camera [Link Master]",
	"80450FA4": "Unrestricted Pause Camera [Link Master]",
	"80099864": "UCF 0.66?: https://smashboards.com/threads/the-20xx-melee-training-hack-pack-v5-0-1-6-9-2022.351221/post-21890688",
};

const injectionPath = "./InjectionLists";
const injectionLists = fs.readdirSync(injectionPath);
injectionLists.forEach(listf => {
	const contents = fs.readFileSync(path.join(injectionPath, listf), { encoding: 'utf8', flag: 'r' });
	const list = JSON.parse(contents);
	list.Details.forEach(code => {
		const details = _.filter([code.Name, code.Annotation]);
		codeNames[code.InjectionAddress.toUpperCase()] = details.join(" | ");
	});
});

// These codes seem to store data inside them or something and will often mismatch, ignore them
const changingCodes = {
	0x80005618: true, // Required: Slippi Online | Online/Static/UserDisplayFunctions.asm
	0x802652F0: true, // Required: Slippi Online | Online/Menus/CSS/InitSheikSelector.asm
	0x803753B4: true, // Required: Slippi Online
	0x8023CCA4: true, // Required: Slippi Online | Online/Menus/CSS/TextEntryScreen/CheckTriggersAndZ.asm
	0x80264534: true, // Required: Slippi Online | Online/Menus/CSS/LoadCSSText.asm
	0x802652F4: true, // Required: Slippi Online | Online/Menus/CSS/Teams/InitTeamToggleButton.asm
	0x80015F88: true, // Required: Slippi Online
	0x802F666C: true, // Recommended: Apply Delay to all In-Game Scenes | Common/UseInGameDelay/InitializeInGameDelay.asm
};

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

		if (posOnly && key !== "positionX" && key !== "positionY") {
			return;
		}

		// // TEMP: Only look for frames with input desync
		// if (key !== "joystickX" && key !== "buttons" && key !== "joystickY" && key !== "cStickX" && key !== "cStickY" && key !== "trigger") {
		// 	return;
		// }

		let val1 = value;
		let val2 = t2[key];

		const orig1 = val1;
		const orig2 = val2;

		const p = processing[key];
		if (p?.enabled && p?.isEqual && p.isEqual(val1, val2)) {
			return;
		} else if (val1 === val2) {
			return;
		}

		if (p?.enabled && p?.post) {
			val1 = `${p.post(val1)} (${orig1})`;
			val2 = `${p.post(val2)} (${orig2})`;
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

// Start gecko code list comparison
const codes1 = (game1.getGeckoList()?.codes ?? []).map(c => ({ ...c, path: replay1Path }));
const codes2 = (game2.getGeckoList()?.codes ?? []).map(c => ({ ...c, path: replay2Path }));;

// Key by address such that duplicated codes will use the last copy only
const codes1ByInj = _.keyBy(codes1, "address");
const codes2ByInj = _.keyBy(codes2, "address");

const formatCodeContents = (contents) => {
	return _.chain(_.range(0, contents.length, 8)).map(idx => (
		(`${_.chain(contents).slice(idx, idx + 4).map(b => _.padStart(b.toString(16), 2, "0")).join("").value()}` +
			` ${_.chain(contents).slice(idx + 4, idx + 8).map(b => _.padStart(b.toString(16), 2, "0")).join("").value()}`).toUpperCase()
	)).join("\n").value();
};

const formatForDisplay = (code1, code2, type) => {
	const display = {
		name: codeNames[code1.address.toString(16).toUpperCase()] ?? "Unknown",
		difftype: type,
		codetype: code1.type.toString(16).toUpperCase(),
		address: code1.address.toString(16).toUpperCase(),
	};

	if (type === "missing") {
		display["presentIn"] = code1.path;
		display["body"] = formatCodeContents(code1.contents);
	} else if (type === "mismatch") {
		display["body1"] = formatCodeContents(code1.contents);
		display["body2"] = formatCodeContents(code2.contents);
	}

	return display;
};

const getCodeComparison = (code1, code2) => {
	// code1 should always exists since we are iterating through them
	if (!code1) {
		throw new Error("Gecko code input issue?");
	}

	if (!code2) {
		return "missing"; // Injection does not exist in code list 2
	}

	let c1c = code1.contents;
	let c2c = code2.contents;

	// If both codes are injections, remove the last 4 bytes for the comparison because I don't
	// think they're guaranteed to be the same because of the way the backup process happens
	if (code1.type === 0xC2 && code2.type === 0xC2) {
		c1c = c1c.slice(0, c1c.length - 4);
		c2c = c2c.slice(0, c2c.length - 4);
	}

	const codesAreMismatched = c1c.length !== c2c.length || !c1c.every((v, i) => v === c2c[i]);
	if (codesAreMismatched && !changingCodes[code1.address]) {
		return "mismatch";
	}

	return "match";
};

const differentCodes = [];
_.forEach(codes1ByInj, (code1, address) => {
	const code2 = codes2ByInj[address];
	const comp = getCodeComparison(code1, code2);

	// If code2 is missing or mismatched, add to difference and move on
	if (comp === "missing" || comp === "mismatch") {
		differentCodes.push(formatForDisplay(code1, code2, comp));
	}

	// If the injection exists in both, delete it from codes2ByInj because we will be adding
	// everything that remains in there at the end.
	delete codes2ByInj[address];
});

// Add all the codes remaining in the codes2 list, these are missing in codes1 list
_.forEach(codes2ByInj, (code2) => {
	differentCodes.push(formatForDisplay(code2, null, "missing"));
});

if (_.isEmpty(differentCodes)) {
	console.log("Gecko codes match.");
} else {
	console.log("Some gecko codes differ between the replays:");
	console.log(differentCodes);
}


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
		// Frame -39 is first playable frame. There seem to be some differences during the freeze frames
		if (framePrintMax && (showFreezeFrames || iFrameIdx >= -39)) {
			const duration = moment.duration((28800 - iFrameIdx) / 60, 'seconds');

			console.log({
				printCount: framePrintCount,
				frame: iFrameIdx,
				sceneFrame: iFrameIdx + 123,
				timer: moment.utc(duration.as('milliseconds')).format('m:ss.SSS'),
				...difference,
			});

			framePrintCount++;
			if (framePrintCount > framePrintMax) {
				break;
			}
		}
	}

	iFrameIdx += 1;
}

console.log("Processing complete...");