const fs = require("fs");
const _ = require("lodash");

const replayPath = "C:\\Users\\Jas\\Documents\\Melee\\CompressionTest\\HboxVsZain.slp";
const targetPath = "C:\\Users\\Jas\\Documents\\Melee\\CompressionTest\\HboxVsZain-compressed.slp";

const defs = {
	0x37: {
		oldCode: 0x37,
		newCode: 0x3F, // Maybe a bit weird since it won't be fixed size?
		keyFields: ['playerIndex', 'isFollower'],
		fields: [{
			offset: 0x1,
			type: "s32",
			name: "frame",
		}, {
			offset: 0x5,
			type: "u8",
			name: "playerIndex",
		}, {
			offset: 0x6,
			type: "bool",
			name: "isFollower",
		}, {
			offset: 0x7,
			type: "u32",
			name: "seed",
		}, {
			offset: 0xB,
			type: "u16",
			name: "state",
		}, {
			offset: 0xD,
			type: "float",
			name: "xPos",
		}, {
			offset: 0x11,
			type: "float",
			name: "yPos",
		}, {
			offset: 0x15,
			type: "float",
			name: "facingDirection",
		}, {
			offset: 0x19,
			type: "float",
			name: "joyX",
		}, {
			offset: 0x1D,
			type: "float",
			name: "joyY",
		}, {
			offset: 0x21,
			type: "float",
			name: "cX",
		}, {
			offset: 0x25,
			type: "float",
			name: "cY",
		}, {
			offset: 0x29,
			type: "float",
			name: "trigger",
		}, {
			offset: 0x2D,
			type: "u32",
			name: "processedButtons",
		}, {
			offset: 0x31,
			type: "u16",
			name: "physicalButtons",
		}, {
			offset: 0x33,
			type: "float",
			name: "physicalL",
		}, {
			offset: 0x37,
			type: "float",
			name: "physicalR",
		}, {
			offset: 0x3B,
			type: "u8",
			name: "ucfX",
		}, {
			offset: 0x3C,
			type: "float",
			name: "percent",
		}],
	},
	0x38: {
		oldCode: 0x38,
		newCode: 0x40,
		keyFields: ['playerIndex', 'isFollower'],
		fields: [{
			offset: 0x1,
			type: "s32",
			name: "frame",
		}, {
			offset: 0x5,
			type: "u8",
			name: "playerIndex",
		}, {
			offset: 0x6,
			type: "bool",
			name: "isFollower",
		}, {
			offset: 0x7,
			type: "u8",
			name: "internalCharId",
		}, {
			offset: 0x8,
			type: "u16",
			name: "state",
		}, {
			offset: 0xA,
			type: "float",
			name: "xPos",
		}, {
			offset: 0xE,
			type: "float",
			name: "yPos",
		}, {
			offset: 0x12,
			type: "float",
			name: "facingDirection",
		}, {
			offset: 0x16,
			type: "float",
			name: "percent",
		}, {
			offset: 0x1A,
			type: "float",
			name: "shieldSize",
		}, {
			offset: 0x1E,
			type: "u8",
			name: "lastHittingAttack",
		}, {
			offset: 0x1F,
			type: "u8",
			name: "comboCount",
		}, {
			offset: 0x20,
			type: "u8",
			name: "lastHitBy",
		}, {
			offset: 0x21,
			type: "u8",
			name: "stocks",
		}, {
			offset: 0x22,
			type: "float",
			name: "animationCounter",
		}, {
			offset: 0x26,
			type: "u8",
			name: "bitFlags1",
		}, {
			offset: 0x27,
			type: "u8",
			name: "bitFlags2",
		}, {
			offset: 0x28,
			type: "u8",
			name: "bitFlags3",
		}, {
			offset: 0x29,
			type: "u8",
			name: "bitFlags4",
		}, {
			offset: 0x2A,
			type: "u8",
			name: "bitFlags5",
		}, {
			offset: 0x2B,
			type: "float",
			name: "hitstun",
		}, {
			offset: 0x2F,
			type: "bool",
			name: "isAirborne",
		}, {
			offset: 0x30,
			type: "u16",
			name: "lastGroundId",
		}, {
			offset: 0x32,
			type: "u8",
			name: "jumpsRemaining",
		}, {
			offset: 0x33,
			type: "u8",
			name: "lCancelStatus",
		}, {
			offset: 0x34,
			type: "u8",
			name: "hurtboxState",
		}, {
			offset: 0x35,
			type: "float",
			name: "selfInducedAirSpeedX",
		}, {
			offset: 0x39,
			type: "float",
			name: "selfInducedAirSpeedY",
		}, {
			offset: 0x3D,
			type: "float",
			name: "attackBasedSpeedX",
		}, {
			offset: 0x41,
			type: "float",
			name: "attackBasedSpeedY",
		}, {
			offset: 0x45,
			type: "float",
			name: "selfInducedGroundSpeedX",
		}, {
			offset: 0x49,
			type: "float",
			name: "hitlagFrames",
		}],
	},
	0x3B: {
		oldCode: 0x3B,
		newCode: 0x41,
		keyFields: ['spawnId'],
		fields: [{
			offset: 0x1,
			type: "s32",
			name: "frame",
		}, {
			offset: 0x5,
			type: "u16",
			name: "typeId",
		}, {
			offset: 0x7,
			type: "u8",
			name: "state",
		}, {
			offset: 0x8,
			type: "float",
			name: "facingDirection",
		}, {
			offset: 0xC,
			type: "float",
			name: "velocityX",
		}, {
			offset: 0x10,
			type: "float",
			name: "velocityY",
		}, {
			offset: 0x14,
			type: "float",
			name: "posX",
		}, {
			offset: 0x18,
			type: "float",
			name: "posY",
		}, {
			offset: 0x1C,
			type: "u16",
			name: "damageTaken",
		}, {
			offset: 0x1E,
			type: "float",
			name: "expirationTimer",
		}, {
			offset: 0x22,
			type: "u32",
			name: "spawnId",
		}, {
			offset: 0x26,
			type: "u8",
			name: "misc1",
		}, {
			offset: 0x27,
			type: "u8",
			name: "misc2",
		}, {
			offset: 0x28,
			type: "u8",
			name: "misc3",
		}, {
			offset: 0x29,
			type: "u8",
			name: "misc4",
		}, {
			offset: 0x2A,
			type: "s8",
			name: "owner",
		}],
	},
}

const SlpInputSource = {
  BUFFER: "buffer",
  FILE: "file",
};

function getRef(input) {
  switch (input.source) {
    case SlpInputSource.FILE:
      const fd = fs.openSync(input.filePath, "r");
      return {
        source: input.source,
        fileDescriptor: fd,
      };
    case SlpInputSource.BUFFER:
      return {
        source: input.source,
        buffer: input.buffer,
      };
    default:
      throw new Error("Source type not supported");
  }
}

function readRef(ref, buffer, offset, length, position) {
  switch (ref.source) {
    case SlpInputSource.FILE:
      return fs.readSync(ref.fileDescriptor, buffer, offset, length, position);
    case SlpInputSource.BUFFER:
      return ref.buffer.copy(buffer, offset, position, position + length);
    default:
      throw new Error("Source type not supported");
  }
}

function getLenRef(ref) {
  switch (ref.source) {
    case SlpInputSource.FILE:
      const fileStats = fs.fstatSync(ref.fileDescriptor);
      return fileStats.size;
    case SlpInputSource.BUFFER:
      return ref.buffer.length;
    default:
      throw new Error("Source type not supported");
  }
}

// This function gets the position where the raw data starts
function getRawDataPosition(ref) {
  const buffer = new Uint8Array(1);
  readRef(ref, buffer, 0, buffer.length, 0);

  if (buffer[0] === 0x36) {
    return 0;
  }

  if (buffer[0] !== "{".charCodeAt(0)) {
    return 0; // return error?
  }

  return 15;
}

function getRawDataLength(ref, position) {
  const fileSize = getLenRef(ref);
  if (position === 0) {
    return fileSize;
  }

  const buffer = new Uint8Array(4);
  readRef(ref, buffer, 0, buffer.length, position - 4);

  const rawDataLen = (buffer[0] << 24) | (buffer[1] << 16) | (buffer[2] << 8) | buffer[3];
  if (rawDataLen > 0) {
    // If this method manages to read a number, it's probably trustworthy
    return rawDataLen;
  }

  // If the above does not return a valid data length,
  // return a file size based on file length. This enables
  // some support for severed files
  return fileSize - position;
}

function canReadFromView(view, offset, length) {
  const viewLength = view.byteLength;
  return offset + length <= viewLength;
}

function readFloat(view, offset) {
  if (!canReadFromView(view, offset, 4)) {
    return null;
  }

  return view.getFloat32(offset);
}

function readInt32(view, offset) {
  if (!canReadFromView(view, offset, 4)) {
    return null;
  }

  return view.getInt32(offset);
}

function readInt8(view, offset) {
  if (!canReadFromView(view, offset, 1)) {
    return null;
  }

  return view.getInt8(offset);
}

function readUint32(view, offset) {
  if (!canReadFromView(view, offset, 4)) {
    return null;
  }

  return view.getUint32(offset);
}

function readUint16(view, offset) {
  if (!canReadFromView(view, offset, 2)) {
    return null;
  }

  return view.getUint16(offset);
}

function readUint8(view, offset) {
  if (!canReadFromView(view, offset, 1)) {
    return null;
  }

  return view.getUint8(offset);
}

function readBool(view, offset) {
  if (!canReadFromView(view, offset, 1)) {
    return null;
  }

  return !!view.getUint8(offset);
}

function getLengthFromType(type) {
	switch (type) {
	case "float":
	case "s32":
	case "u32":
		return 4;
	case "s16":
	case "u16":
		return 2;
	case "bool":
	case "s8":
	case "u8":
		return 1;
	default:
		throw new Error(`Cannot get length from type: ${type}`);
	}
}

function getValueFromType(type, view, offset) {
	switch (type) {
	case "float":
		return readFloat(view, offset);
	case "s32":
		return readInt32(view, offset);
	case "u32":
		return readUint32(view, offset);
	// case "s16":
	// 	return readInt16(view, offset);
	case "u16":
		return readUint16(view, offset);
	case "bool":
		return readBool(view, offset);
	case "s8":
		return readUint8(view, offset);
	case "u8":
		return readInt8(view, offset);
	default:
		throw new Error(`Cannot get length from type: ${type}`);
	}
}

function compress(buffer, def, history) {
	const resBuffer =  Buffer.alloc(2 * buffer.byteLength);
	
	const view = new DataView(buffer.buffer);

	const curFields = _.chain(def.fields).map(field => {
		if (field.offset >= buffer.byteLength) {
			return null;
		}

		const len = getLengthFromType(field.type);
		const sliced = buffer.slice(field.offset, field.offset + len);

		return {
			name: field.name,
			buf: sliced,
			value: getValueFromType(field.type, view, field.offset),
		};
	}).filter().value();

	const valuesByName = _.keyBy(curFields, 'name');
	const keyValues = _.map(def.keyFields, field => valuesByName[field].value);
	keyValues.unshift(def.oldCode);
	const key = keyValues.join('_');
	
	// Get previous instance for this key
	const previousFields = history[key] || [];
	history[key] = previousFields;

	// Indicate this is a variable length message (0x11). We will set the length later
	const idxLen = def.fields.length > 0x100 ? 2 : 1;
	resBuffer.set([0x11, 0x0, 0x0, def.newCode, idxLen], 0);

	let resPos = 5;

	// Loop through fields, comparing to history, and setting if different
	let i = 0;
	for (i = 0; i < curFields.length; i++) {
		const prev = previousFields[i];
		const cur = curFields[i];

		// If the buffers are different, handle
		if (!prev || Buffer.compare(prev.buf, cur.buf)) {
			// Add buf to output
			let idxBuf = Buffer.from([0, 0]);
			idxBuf.writeUInt16BE(i, 0);
			if (idxLen <= 1) {
				idxBuf = idxBuf.slice(1, 2);
			}

			// Write index number of field
			resBuffer.set(idxBuf, resPos);
			resPos += idxBuf.byteLength;

			// Write value
			resBuffer.set(cur.buf, resPos);
			resPos += cur.buf.byteLength;

			// Update history with current value
			history[key][i] = cur;
			const inc = _.get(history, ['changes', `0x${def.oldCode.toString(16)}`, cur.name], 0);
			_.set(history, ['changes', `0x${def.oldCode.toString(16)}`, cur.name], inc + 1);
		}
	}

	// Write size of variable length message
	resBuffer.writeUInt16BE(resPos - 1, 1);

	const resultSliced = resBuffer.slice(0, resPos);

	// console.log(`${buffer.byteLength} -> ${resPos}`);

	return resultSliced;
}

const ref = getRef({
	source: SlpInputSource.FILE,
	filePath: replayPath,
});

const rawDataPosition = getRawDataPosition(ref);
const rawDataLength = getRawDataLength(ref, rawDataPosition);

const buffer = new Uint8Array(rawDataLength);
readRef(ref, buffer, 0, buffer.length, rawDataPosition);

const resBuffer = new Uint8Array(2 * rawDataLength); // Just use a length that should be large enough

const view = new DataView(buffer.buffer);

/////////////////////////////////////////////////
// Step 1: Read payload sizes
/////////////////////////////////////////////////

const firstByte = readUint8(view, 0);
if (firstByte !== 0x35) {
	throw new Error(`First byte not event payloads types: 0x${firstByte.toString(16)}`);
}

const payloadSizesLen = readUint8(view, 1);

const payloadSizes = {};

let i = 0;
for (i = 1; i < payloadSizesLen; i += 3) {
	payloadSizes[readUint8(view, i + 1)] = readUint16(view, i + 2);
}

// TODO: Write new payload sizes of compressed file
let resPos = 0;

/////////////////////////////////////////////////
// Step 2: Iterate commands
/////////////////////////////////////////////////

const history = {};
let pos = payloadSizesLen + 1;

while (pos < rawDataLength) {
	const commandByte = readUint8(view, pos);
	const size = payloadSizes[commandByte];

	let compressed = buffer.slice(pos, pos + size + 1);

	const def = defs[commandByte];
	if (def) {
		compressed = compress(compressed, def, history);
	}

	// Add compressed data to result buffer
	resBuffer.set(compressed, resPos);
	resPos += compressed.byteLength;
	
	// Move to next command
	pos += size + 1;

	// if (pos > 1000) break;
}

console.log(history.changes);
console.log(`Original: ${pos}, Compressed: ${resPos}. ${(pos / resPos).toFixed(1)}x compression.`)
