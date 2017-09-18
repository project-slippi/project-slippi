const characters = [{
  id: 0,
  name: "Captain Falcon",
  shortName: "Falcon"
}, {
  id: 1,
  name: "Donkey Kong",
  shortName: "DK"
}, {
  id: 2,
  name: "Fox",
  shortName: "Fox"
}, {
  id: 3,
  name: "Mr. Game & Watch",
  shortName: "G&W"
}, {
  id: 4,
  name: "Kirby",
  shortName: "Kirby"
}, {
  id: 5,
  name: "Bowser",
  shortName: "Bowser"
}, {
  id: 6,
  name: "Link",
  shortName: "Link"
}, {
  id: 7,
  name: "Luigi",
  shortName: "Luigi"
}, {
  id: 8,
  name: "Mario",
  shortName: "Mario"
}, {
  id: 9,
  name: "Marth",
  shortName: "Marth"
}, {
  id: 10,
  name: "Mewtwo",
  shortName: "Mewtwo"
}, {
  id: 11,
  name: "Ness",
  shortName: "Ness"
}, {
  id: 12,
  name: "Peach",
  shortName: "Peach"
}, {
  id: 13,
  name: "Pikachu",
  shortName: "Pikachu"
}, {
  id: 14,
  name: "Ice Climbers",
  shortName: "ICs"
}, {
  id: 15,
  name: "Jigglypuff",
  shortName: "Puff"
}, {
  id: 16,
  name: "Samus",
  shortName: "Samus"
}, {
  id: 17,
  name: "Yoshi",
  shortName: "Yoshi"
}, {
  id: 18,
  name: "Zelda",
  shortName: "Zelda"
}, {
  id: 19,
  name: "Sheik",
  shortName: "Sheik"
}, {
  id: 20,
  name: "Falco",
  shortName: "Falco"
}, {
  id: 21,
  name: "Young Link",
  shortName: "YLink"
}, {
  id: 22,
  name: "Dr. Mario",
  shortName: "Doc"
}, {
  id: 23,
  name: "Roy",
  shortName: "Roy"
}, {
  id: 24,
  name: "Pichu",
  shortName: "Pichu"
}, {
  id: 25,
  name: "Ganondorf",
  shortName: "Ganon"
}];

export function getCharacterInfo(characterId) {
  return characters[characterId];
}

export function getCharacterShortName(characterId) {
  const character = getCharacterInfo(characterId) || {};
  return character.shortName;
}