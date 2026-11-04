window.MorseCipher = (function () {
  const latinLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const latinCodes = '.- -... -.-. -.. . ..-. --. .... .. .--- -.- .-.. -- -. --- .--. --.- .-. ... - ..- ...- .-- -..- -.-- --..'.split(' ');
  const russianLetters = 'АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ';
  const russianCodes = '.- -... .-- --. -.. . ...- --.. .. .--- -.- .-.. -- -. --- .--. .-. ... - ..- ..-. .... -.-. ---. ---- --.- --.-- -.-- -..- ..-.. ..-- .-.-'.split(' ');
  const punctuation = { '0': '-----', '1': '.----', '2': '..---', '3': '...--', '4': '....-', '5': '.....', '6': '-....', '7': '--...', '8': '---..', '9': '----.', '.': '.-.-.-', ',': '--..--', '?': '..--..', '!': '-.-.--', '-': '-....-', '/': '-..-.', '(': '-.--.', ')': '-.--.-', ':': '---...', '=': '-...-', '+': '.-.-.', '@': '.--.-.' };

  function dictionary(language) {
    const letters = language === 'ru' ? russianLetters : latinLetters;
    const codes = language === 'ru' ? russianCodes : latinCodes;
    const map = Object.assign({}, punctuation);
    for (let index = 0; index < letters.length; index++) map[letters[index]] = codes[index];
    return map;
  }

  function run(text, options) {
    const tools = window.CipherTools;
    const map = dictionary(options.language);
    const reverse = {};
    const cells = [];
    for (const letter of Object.keys(map)) {
      reverse[map[letter]] = letter;
      cells.push(tools.cell(`${letter}  ${map[letter]}`, `m-${map[letter]}`));
    }
    let output = '';
    const steps = [];
    const tokens = [];
    const input = text.toUpperCase().replaceAll('Ё', 'Е').trim();
    if (options.decrypt) {
      const words = input ? input.split(/\s*\/\s*/) : [];
      for (let wordIndex = 0; wordIndex < words.length; wordIndex++) {
        if (wordIndex) { output += ' '; tokens.push({ wordGap: true }); }
        for (const code of words[wordIndex].trim().split(/\s+/)) {
          if (!reverse[code]) throw new Error(`Неизвестный сигнал «${code}». Между буквами нужен пробел, между словами — /.`);
          const letter = reverse[code];
          output += letter;
          tokens.push({ letter, code });
          steps.push({ destination: [`m-${code}`], detail: `${code} → ${letter}`, output });
        }
      }
    } else {
      const words = input ? input.split(/\s+/) : [];
      for (let wordIndex = 0; wordIndex < words.length; wordIndex++) {
        if (wordIndex) { output += ' / '; tokens.push({ wordGap: true }); }
        let first = true;
        for (const letter of words[wordIndex]) {
          const code = map[letter];
          if (!code) throw new Error(`Для «${letter}» нет кода в выбранном алфавите. Выберите русский или латинский алфавит.`);
          if (!first) output += ' ';
          first = false;
          output += code;
          tokens.push({ letter, code });
          steps.push({ destination: [`m-${code}`], detail: `${letter} → ${code}`, output });
        }
      }
    }
    const signals = [];
    const display = [];
    for (let tokenIndex = 0; tokenIndex < tokens.length; tokenIndex++) {
      const token = tokens[tokenIndex];
      if (token.wordGap) continue;
      for (let index = 0; index < token.code.length; index++) {
        const symbol = token.code[index];
        const signalIndex = display.length;
        display.push({ symbol, letter: token.letter });
        signals.push({ on: true, units: symbol === '.' ? 1 : 3, index: signalIndex, code: token.code, letter: token.letter, symbol });
        if (index < token.code.length - 1) signals.push({ on: false, units: 1 });
      }
      if (tokenIndex < tokens.length - 1) {
        const gap = tokens[tokenIndex + 1].wordGap ? 7 : 3;
        signals.push({ on: false, units: gap });
        display.push({ symbol: gap === 7 ? '/' : ' ', gap: true });
      }
    }
    return { text: output, steps, signals, display,
      table: { columns: 4, cells, label: 'Азбука Морзе' },
      note: 'Точка — 1 единица, тире — 3; паузы внутри буквы — 1, между буквами — 3, между словами — 7. Русское Ё → Е, регистр не кодируется. Алфавит нужен для однозначной расшифровки.' };
  }
  return { run, dictionary };
})();
