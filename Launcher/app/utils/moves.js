const moves = {
  1: {
    // This includes all thrown items, zair, luigi's taunt, samus bombs, etc
    id: 1,
    name: "Miscellaneous",
    shortName: "misc",
  },
  2: {
    id: 2,
    name: "Jab",
    shortName: "jab",
  },
  3: {
    id: 3,
    name: "Jab",
    shortName: "jab",
  },
  4: {
    id: 4,
    name: "Jab",
    shortName: "jab",
  },
  6: {
    id: 6,
    name: "Dash Attack",
    shortName: "dash",
  },
  7: {
    id: 7,
    name: "Forward Tilt",
    shortName: "ftilt",
  },
  8: {
    id: 8,
    name: "Up Tilt",
    shortName: "utilt",
  },
  9: {
    id: 9,
    name: "Down Tilt",
    shortName: "dtilt",
  },
  10: {
    id: 10,
    name: "Forward Smash",
    shortName: "fsmash",
  },
  11: {
    id: 11,
    name: "Up Smash",
    shortName: "usmash",
  },
  12: {
    id: 12,
    name: "Down Smash",
    shortName: "dsmash",
  },
  13: {
    id: 13,
    name: "Neutral Air",
    shortName: "nair",
  },
  14: {
    id: 14,
    name: "Forward Air",
    shortName: "fair",
  },
  15: {
    id: 15,
    name: "Back Air",
    shortName: "bair",
  },
  16: {
    id: 16,
    name: "Up Air",
    shortName: "uair",
  },
  17: {
    id: 17,
    name: "Down Air",
    shortName: "dair",
  },
  18: {
    id: 18,
    name: "Neutral B",
    shortName: "neutral-b",
  },
  19: {
    id: 19,
    name: "Side B",
    shortName: "side-b",
  },
  20: {
    id: 20,
    name: "Up B",
    shortName: "up-b",
  },
  21: {
    id: 21,
    name: "Down B",
    shortName: "down-b",
  },
  50: {
    id: 50,
    name: "Getup Attack",
    shortName: "getup",
  },
  51: {
    id: 51,
    name: "Getup Attack (Slow)",
    shortName: "getup-slow",
  },
  52: {
    id: 52,
    name: "Grab Release",
    shortName: "release",
  },
  53: {
    id: 53,
    name: "Forward Throw",
    shortName: "fthrow",
  },
  54: {
    id: 54,
    name: "Back Throw",
    shortName: "bthrow",
  },
  55: {
    id: 55,
    name: "Up Throw",
    shortName: "uthrow",
  },
  56: {
    id: 56,
    name: "Down Throw",
    shortName: "dthrow",
  },
  61: {
    id: 61,
    name: "Edge Attack (Slow)",
    shortName: "edge-slow",
  },
  62: {
    id: 62,
    name: "Edge Attack",
    shortName: "edge",
  },
};

export function getMoveInfo(moveId) {
  return moves[moveId];
}

export function getMoveShortName(moveId) {
  const move = getMoveInfo(moveId) || {};
  return move.shortName || "unknown";
}

export function getMoveName(moveId) {
  const move = getMoveInfo(moveId) || {};
  return move.name || "Unknown Move";
}
