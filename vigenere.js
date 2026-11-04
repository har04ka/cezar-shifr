window.VigenereCipher = (function () {
  function run(text, options) {
    const tools = window.CipherTools;
    const key = options.key.toUpperCase().replaceAll('Ё', 'Е');
    if (!key || !(/^([А-Я]+|[A-Z]+)$/u.test(key))) throw new Error('Ключ Виженера: непустое слово одного алфавита, без цифр и пробелов.');
    const alphabet = tools.russian32.includes(key[0]) ? tools.russian32 : tools.english;
    const cells = [tools.cell('Ключ ↓ / текст →', '', true)];
    for (let column = 0; column < alphabet.length; column++) cells.push(tools.cell(alphabet[column], `v-col-${column}`, true));
    for (let row = 0; row < alphabet.length; row++) {
      cells.push(tools.cell(alphabet[row], `v-row-${row}`, true));
      for (let column = 0; column < alphabet.length; column++) {
        // На фото первая строка начинается с Б: дополнительный сдвиг +1.
        cells.push(tools.cell(alphabet[(column + row + 1) % alphabet.length], `v-${row}-${column}`));
      }
    }
    const steps = [];
    let result = '';
    let keyPosition = 0;
    let expandedKey = '';
    const input = text.replaceAll('Ё', 'Е').replaceAll('ё', 'е');
    for (const letter of input) {
      const index = alphabet.indexOf(letter.toUpperCase());
      if (index < 0) {
        if (tools.alphabetFor(letter)) throw new Error('Текст и ключ Виженера должны быть одного алфавита.');
        result += letter;
        expandedKey += letter === ' ' ? ' ' : '·';
        continue;
      }
      const keyLetter = key[keyPosition % key.length];
      const keyIndex = alphabet.indexOf(keyLetter);
      const outputIndex = options.decrypt
        ? (index - keyIndex - 1 + alphabet.length) % alphabet.length
        : (index + keyIndex + 1) % alphabet.length;
      const plainIndex = options.decrypt ? outputIndex : index;
      const replacement = tools.sameCase(letter, alphabet[outputIndex]);
      result += replacement;
      expandedKey += keyLetter;
      keyPosition++;
      steps.push({ origin: [`v-col-${plainIndex}`, `v-row-${keyIndex}`], destination: [`v-${keyIndex}-${plainIndex}`],
        row: keyIndex + 1, column: plainIndex + 1,
        detail: options.decrypt
          ? `В строке ключа ${keyLetter} ищем ${letter.toUpperCase()}, заголовок столбца ${alphabet[plainIndex]} — исходная буква.`
          : `Текст ${letter.toUpperCase()}, ключ ${keyLetter}: (${index} + ${keyIndex} + 1) mod ${alphabet.length} = ${outputIndex} → ${replacement}`,
        output: result });
    }
    return { text: result, steps, table: { columns: alphabet.length + 1, cells, label: 'Таблица Виженера со слайда', large: true },
      alignment: [['Текст', input], ['Ключ', expandedKey]],
      note: 'Вариант со слайда: y = (x + k + 1) mod N. Русский алфавит без Ё (Ё → Е). АФРИКА + МАМА → НХЭЙЧБ. Пробелы не расходуют буквы ключа.' };
  }
  return { run };
})();
