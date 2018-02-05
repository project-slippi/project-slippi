const moves = {
  2: {
    id: 2,
    name: "Jab",
    shortName: "jab",
  },
  10: {
    id: 10,
    name: "Forward Smash",
    shortName: "fsmash",
  },
  15: {
    id: 15,
    name: "Back Air",
    shortName: "bair",
  },
  17: {
    id: 17,
    name: "Down Air",
    shortName: "dair",
  },
  19: {
    id: 19,
    name: "Side B",
    shortName: "side-b",
  }
};

export function getMoveInfo(moveId) {
  return moves[moveId];
}

export function getMoveShortName(moveId) {
  const move = getMoveInfo(moveId) || {};
  return move.shortName;
}
