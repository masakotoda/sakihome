import { jaroWinkler } from './jaro-winkler@1.1.1/index.mjs';

// src/constants.ts
var UNIT = {
  zero: 0,
  first: 1,
  one: 1,
  second: 2,
  two: 2,
  third: 3,
  thirteenth: 13,
  thirteen: 13,
  three: 3,
  fourth: 4,
  fourteenth: 14,
  fourteen: 14,
  four: 4,
  fifteenth: 15,
  fifteen: 15,
  fifth: 5,
  five: 5,
  sixth: 6,
  sixteenth: 16,
  sixteen: 16,
  six: 6,
  seventeenth: 17,
  seventeen: 17,
  seventh: 7,
  seven: 7,
  eighteenth: 18,
  eighteen: 18,
  eighth: 8,
  eight: 8,
  nineteenth: 19,
  nineteen: 19,
  ninth: 9,
  nine: 9,
  tenth: 10,
  ten: 10,
  eleventh: 11,
  eleven: 11,
  twelfth: 12,
  twelve: 12,
  a: 1
};
var TEN = {
  twenty: 20,
  twentieth: 20,
  thirty: 30,
  thirtieth: 30,
  forty: 40,
  fortieth: 40,
  fifty: 50,
  fiftieth: 50,
  sixty: 60,
  sixtieth: 60,
  seventy: 70,
  seventieth: 70,
  eighty: 80,
  eightieth: 80,
  ninety: 90,
  ninetieth: 90
};
var MAGNITUDE = {
  hundred: 100,
  hundredth: 100,
  thousand: 1e3,
  million: 1e6,
  billion: 1e9,
  trillion: 1e12,
  quadrillion: 1e15,
  quintillion: 1e18,
  sextillion: 1e21,
  septillion: 1e24,
  octillion: 1e27,
  nonillion: 1e30,
  decillion: 1e33
};
var NUMBER = {
  ...UNIT,
  ...TEN,
  ...MAGNITUDE
};
var UNIT_KEYS = Object.keys(UNIT);
var TEN_KEYS = Object.keys(TEN);
var MAGNITUDE_KEYS = Object.keys(MAGNITUDE);
var NUMBER_WORDS = [...UNIT_KEYS, ...TEN_KEYS, ...MAGNITUDE_KEYS];
var JOINERS = ["and"];
var DECIMALS = ["point", "dot"];
var PUNCTUATION = [
  ".",
  ",",
  "\\",
  "#",
  "!",
  "$",
  "%",
  "^",
  "&",
  "/",
  "*",
  ";",
  ":",
  "{",
  "}",
  "=",
  "-",
  "_",
  "`",
  "~",
  "(",
  ")",
  " "
];
var ALL_WORDS = [...NUMBER_WORDS, ...JOINERS, ...DECIMALS];
var BLACKLIST_SINGULAR_WORDS = ["a"];

// src/util.ts
var splice = (str, index, count, add) => {
  let i = index;
  if (i < 0) {
    i = str.length + i;
    if (i < 0) {
      i = 0;
    }
  }
  return str.slice(0, i) + (add || "") + str.slice(i + count);
};
var checkBlacklist = (tokens) => {
  return tokens.length === 1 && BLACKLIST_SINGULAR_WORDS.includes(tokens[0].lowerCaseValue);
};

// src/compiler.ts
var getNumber = (region) => {
  let sum = 0;
  let decimalReached = false;
  const decimalUnits = [];
  region.subRegions.forEach((subRegion) => {
    const { tokens, type } = subRegion;
    let subRegionSum = 0;
    if (type === 3 /* DECIMAL */) {
      decimalReached = true;
      return;
    }
    if (decimalReached) {
      decimalUnits.push(subRegion);
      return;
    }
    switch (type) {
      case 2 /* MAGNITUDE */:
      case 4 /* HUNDRED */: {
        subRegionSum = 1;
        const tokensCount = tokens.length;
        tokens.reduce((acc, token, i) => {
          if (token.type === 4 /* HUNDRED */) {
            let tokensToAdd = tokensCount - 1 ? tokens.slice(i + 1) : [];
            tokensToAdd = tokensToAdd.filter((tokenToAdd, j) => {
              if (j === 0) {
                return true;
              }
              const previousTokenToAddType = tokensToAdd[j - 1].type;
              const tokenToAddType = tokenToAdd.type;
              return typeof previousTokenToAddType == "number" && typeof tokenToAddType === "number" && previousTokenToAddType > tokenToAddType;
            });
            const tokensToAddSum = tokensToAdd.reduce(
              (acc2, tokenToAdd) => acc2 + NUMBER[tokenToAdd.lowerCaseValue],
              0
            );
            acc.push(tokensToAddSum + NUMBER[token.lowerCaseValue] * 100);
            return acc;
          }
          if (i > 0 && tokens[i - 1].type === 4 /* HUNDRED */) {
            return acc;
          }
          if (i > 1 && tokens[i - 1].type === 1 /* TEN */ && tokens[i - 2].type === 4 /* HUNDRED */) {
            return acc;
          }
          acc.push(NUMBER[token.lowerCaseValue]);
          return acc;
        }, []).forEach((numberValue) => {
          subRegionSum *= numberValue;
        });
        break;
      }
      case 0 /* UNIT */:
      case 1 /* TEN */: {
        tokens.forEach((token) => {
          subRegionSum += NUMBER[token.lowerCaseValue];
        });
        break;
      }
    }
    sum += subRegionSum;
  });
  let currentDecimalPlace = 1;
  decimalUnits.forEach(({ tokens }) => {
    tokens.forEach(({ lowerCaseValue }) => {
      sum += NUMBER[lowerCaseValue] / 10 ** currentDecimalPlace;
      currentDecimalPlace += 1;
    });
  });
  return sum;
};
var replaceRegionsInText = (regions, text) => {
  let replaced = text;
  let offset = 0;
  regions.forEach((region) => {
    if (!checkBlacklist(region.tokens)) {
      const length = region.end - region.start + 1;
      const replaceWith = getNumber(region).toString();
      replaced = splice(replaced, region.start + offset, length, replaceWith);
      offset -= length - replaceWith.length;
    }
  });
  return replaced;
};
var compiler = ({ regions, text }) => {
  if (regions[0].end - regions[0].start === text.length - 1) {
    return getNumber(regions[0]);
  }
  return replaceRegionsInText(regions, text);
};
var compiler_default = compiler;
var fuzzyMatch = (word) => {
  const allMatches = ALL_WORDS.map((numberWord) => ({
    word: numberWord,
    score: jaroWinkler(numberWord, word)
  }));
  const bestMatch = allMatches.reduce(
    (best, current) => current.score > best.score ? current : best,
    { word: "", score: 0 }
  );
  return bestMatch.word;
};
var fuzzy_match_default = fuzzyMatch;

// src/parser.ts
var canAddTokenToEndOfSubRegion = (subRegion, currentToken, { impliedHundreds }) => {
  const { tokens } = subRegion;
  const prevToken = tokens[0];
  if (!prevToken) {
    return true;
  }
  if (prevToken.type === 2 /* MAGNITUDE */ && currentToken.type === 0 /* UNIT */) {
    return true;
  }
  if (prevToken.type === 2 /* MAGNITUDE */ && currentToken.type === 1 /* TEN */) {
    return true;
  }
  if (impliedHundreds && subRegion.type === 2 /* MAGNITUDE */ && prevToken.type === 1 /* TEN */ && currentToken.type === 0 /* UNIT */) {
    return true;
  }
  if (impliedHundreds && subRegion.type === 2 /* MAGNITUDE */ && prevToken.type === 0 /* UNIT */ && currentToken.type === 1 /* TEN */) {
    return true;
  }
  if (prevToken.type === 1 /* TEN */ && currentToken.type === 0 /* UNIT */) {
    return true;
  }
  if (!impliedHundreds && prevToken.type === 1 /* TEN */ && currentToken.type === 0 /* UNIT */) {
    return true;
  }
  if (prevToken.type === 2 /* MAGNITUDE */ && currentToken.type === 2 /* MAGNITUDE */) {
    return true;
  }
  if (!impliedHundreds && prevToken.type === 1 /* TEN */ && currentToken.type === 1 /* TEN */) {
    return false;
  }
  if (impliedHundreds && prevToken.type === 1 /* TEN */ && currentToken.type === 1 /* TEN */) {
    return true;
  }
  return false;
};
var getSubRegionType = (subRegion, currentToken) => {
  if (!subRegion) {
    return { type: currentToken.type, isHundred: false };
  }
  const prevToken = subRegion.tokens[0];
  const isHundred = prevToken.type === 1 /* TEN */ && currentToken.type === 0 /* UNIT */ || prevToken.type === 1 /* TEN */ && currentToken.type === 1 /* TEN */ || prevToken.type === 0 /* UNIT */ && currentToken.type === 1 /* TEN */ && NUMBER[prevToken.lowerCaseValue] > 9 || prevToken.type === 0 /* UNIT */ && currentToken.type === 0 /* UNIT */ || prevToken.type === 1 /* TEN */ && currentToken.type === 0 /* UNIT */ && subRegion.type === 2 /* MAGNITUDE */;
  if (subRegion.type === 2 /* MAGNITUDE */) {
    return { type: 2 /* MAGNITUDE */, isHundred };
  }
  if (isHundred) {
    return { type: 4 /* HUNDRED */, isHundred };
  }
  return { type: currentToken.type, isHundred };
};
var checkIfTokenFitsSubRegion = (subRegion, token, options) => {
  const { type, isHundred } = getSubRegionType(subRegion, token);
  if (!subRegion) {
    return { action: 2 /* START_NEW_REGION */, type, isHundred };
  }
  if (canAddTokenToEndOfSubRegion(subRegion, token, options)) {
    return { action: 1 /* ADD */, type, isHundred };
  }
  return { action: 2 /* START_NEW_REGION */, type, isHundred };
};
var getSubRegions = (region, options) => {
  const subRegions = [];
  let currentSubRegion = null;
  const tokensCount = region.tokens.length;
  let i = tokensCount - 1;
  while (i >= 0) {
    const token = region.tokens[i];
    const { action, type, isHundred } = checkIfTokenFitsSubRegion(
      currentSubRegion,
      token,
      options
    );
    token.type = isHundred ? 4 /* HUNDRED */ : token.type;
    switch (action) {
      case 1 /* ADD */: {
        if (currentSubRegion) {
          currentSubRegion.type = type;
          currentSubRegion.tokens.unshift(token);
        }
        break;
      }
      case 2 /* START_NEW_REGION */: {
        currentSubRegion = {
          tokens: [token],
          type
        };
        subRegions.unshift(currentSubRegion);
        break;
      }
    }
    i -= 1;
  }
  return subRegions;
};
var canAddTokenToEndOfRegion = (region, currentToken, { impliedHundreds }) => {
  const { tokens } = region;
  const prevToken = tokens[tokens.length - 1];
  if (!impliedHundreds && prevToken.type === 0 /* UNIT */ && currentToken.type === 0 /* UNIT */ && !region.hasDecimal) {
    return false;
  }
  if (!impliedHundreds && prevToken.type === 0 /* UNIT */ && currentToken.type === 1 /* TEN */) {
    return false;
  }
  if (!impliedHundreds && prevToken.type === 1 /* TEN */ && currentToken.type === 1 /* TEN */) {
    return false;
  }
  return true;
};
var checkIfTokenFitsRegion = (region, token, options) => {
  const isDecimal = DECIMALS.includes(token.lowerCaseValue);
  if ((!region || !region.tokens.length) && isDecimal) {
    return 2 /* START_NEW_REGION */;
  }
  const isPunctuation = PUNCTUATION.includes(token.lowerCaseValue);
  if (isPunctuation) {
    return 0 /* SKIP */;
  }
  const isJoiner = JOINERS.includes(token.lowerCaseValue);
  if (isJoiner) {
    return 0 /* SKIP */;
  }
  if (isDecimal && !region?.hasDecimal) {
    return 1 /* ADD */;
  }
  const isNumberWord = NUMBER_WORDS.includes(token.lowerCaseValue);
  if (isNumberWord) {
    if (!region) {
      return 2 /* START_NEW_REGION */;
    }
    if (canAddTokenToEndOfRegion(region, token, options)) {
      return 1 /* ADD */;
    }
    return 2 /* START_NEW_REGION */;
  }
  return 3 /* NOPE */;
};
var matchRegions = (tokens, options) => {
  const regions = [];
  if (checkBlacklist(tokens)) {
    return regions;
  }
  let i = 0;
  let currentRegion = null;
  const tokensCount = tokens.length;
  while (i < tokensCount) {
    const token = tokens[i];
    const tokenFits = checkIfTokenFitsRegion(currentRegion, token, options);
    switch (tokenFits) {
      case 0 /* SKIP */: {
        break;
      }
      case 1 /* ADD */: {
        if (currentRegion) {
          currentRegion.end = token.end;
          currentRegion.tokens.push(token);
          if (token.type === 3 /* DECIMAL */) {
            currentRegion.hasDecimal = true;
          }
        }
        break;
      }
      case 2 /* START_NEW_REGION */: {
        currentRegion = {
          start: token.start,
          end: token.end,
          tokens: [token],
          type: void 0,
          hasDecimal: token.type === 3 /* DECIMAL */ ? true : false,
          subRegions: []
        };
        regions.push(currentRegion);
        break;
      }
      case 3 /* NOPE */:
      default: {
        currentRegion = null;
        break;
      }
    }
    i += 1;
  }
  return regions.map((region) => ({
    ...region,
    subRegions: getSubRegions(region, options)
  }));
};
var getTokenType = (chunk) => {
  if (UNIT_KEYS.includes(chunk.toLowerCase())) {
    return 0 /* UNIT */;
  }
  if (TEN_KEYS.includes(chunk.toLowerCase())) {
    return 1 /* TEN */;
  }
  if (MAGNITUDE_KEYS.includes(chunk.toLowerCase())) {
    return 2 /* MAGNITUDE */;
  }
  if (DECIMALS.includes(chunk.toLowerCase())) {
    return 3 /* DECIMAL */;
  }
  return void 0;
};
var parser = (text, options) => {
  const splitText = text.split(/(\w+|\s|[[:punct:]])/i).filter(Boolean);
  const tokens = splitText.reduce((acc, chunk) => {
    const unfuzzyChunk = !!options.fuzzy && !PUNCTUATION.includes(chunk) ? fuzzy_match_default(chunk) : chunk;
    const start = acc.length ? acc[acc.length - 1].end + 1 : 0;
    const end = start + chunk.length - 1;
    acc.push({
      start,
      end,
      value: unfuzzyChunk,
      lowerCaseValue: unfuzzyChunk.toLowerCase(),
      type: getTokenType(unfuzzyChunk)
    });
    return acc;
  }, []);
  const regions = matchRegions(tokens, options);
  return regions;
};
var parser_default = parser;

// src/index.ts
var wordsToNumbers = (text, options = {}) => {
  const regions = parser_default(text, options);
  if (!regions.length) {
    return text;
  }
  return compiler_default({ text, regions });
};
var src_default = wordsToNumbers;

export { src_default as default, wordsToNumbers };
