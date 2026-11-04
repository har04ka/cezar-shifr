// Оборачиваем уже существующие Цезарь и Атбаш в общий формат демонстрации.
window.LessonCiphers = (function () {
  function run(name, text, options) {
    const tools = window.CipherTools;
    const tables = [];
    for (const alphabet of [tools.russian, tools.english]) {
      const prefix = alphabet === tools.russian ? 'ru' : 'en';
      const cells = [];
      for (let index = 0; index < alphabet.length; index++) {
        const letter = alphabet[index];
        const item = tools.cell(letter, `${prefix}-${index}`);
        if (name === 'atbash') item.mirror = alphabet[alphabet.length - 1 - index];
        cells.push(item);
      }
      tables.push({ columns: prefix === 'ru' ? 11 : 13, cells, label: prefix === 'ru' ? 'Русский алфавит' : 'Латинский алфавит' });
    }
    const steps = [];
    const shift = tools.integer(options.shift, 0, 32);
    const direction = options.decrypt ? -1 : 1;
    let result = '';
    for (const letter of text) {
      const alphabet = tools.alphabetFor(letter);
      if (!alphabet) {
        result += letter;
        steps.push({ detail: 'Пробелы, цифры и знаки остаются без изменений.', output: result });
        continue;
      }
      const prefix = alphabet === tools.russian ? 'ru' : 'en';
      const index = alphabet.indexOf(letter.toUpperCase());
      if (name === 'atbash') {
        result += window.AtbashCipher.transformText(letter);
        steps.push({ origin: [`${prefix}-${index}`], mirror: [`${prefix}-${index}`],
          detail: `${letter} → ${tools.sameCase(letter, alphabet[alphabet.length - 1 - index])}: ${alphabet.length} − 1 − ${index} = ${alphabet.length - 1 - index}`, output: result });
      } else {
        const count = shift % alphabet.length;
        for (let step = 0; step <= count; step++) {
          const current = (index + direction * step + alphabet.length) % alphabet.length;
          const item = { origin: [`${prefix}-${index}`], detail: `${letter} → ${tools.sameCase(letter, alphabet[current])} · шаг ${step} из ${count}` };
          if (step === count) {
            result += tools.sameCase(letter, alphabet[current]);
            item.destination = [`${prefix}-${current}`];
            item.output = result;
          } else if (step > 0) item.transit = [`${prefix}-${current}`];
          steps.push(item);
        }
      }
    }
    return { text: result, steps, tables, note: name === 'atbash' ? 'y = N − 1 − x. Номера букв от 0, N — размер алфавита. А (0) → Я (32).' : 'y = (x + k) mod N; при расшифровке вычитаем k. Номера букв от 0. Регистр и знаки сохраняются.' };
  }
  return { run };
})();
