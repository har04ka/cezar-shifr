window.DigitalCipher = (function () {
  const groups = ['АБВГ', 'ДЕЖЗ', 'ИЙКЛ', 'МНОП', 'РСТУ', 'ФХЦЧ', 'ШЩЪЫ', 'ЬЭЮЯ'];

  function run(text, options) {
    const cells = [];
    const tools = window.CipherTools;
    // Верхняя строка — группы букв, нижняя — номера разделов.
    for (let group = 0; group < groups.length; group++) {
      const cell = tools.cell(groups[group], '');
      cell.letters = Array.from(groups[group], function (letter, position) {
        return { text: letter, id: `d-${position + 1}${group + 1}`, position: position + 1 };
      });
      cells.push(cell);
    }
    for (let group = 0; group < groups.length; group++) cells.push(tools.cell(group + 1, `dg-${group + 1}`));

    let result = '';
    const steps = [];
    if (options.decrypt) {
      const words = text.trim() ? text.trim().split(/\s*\/\s*/) : [];
      for (let wordIndex = 0; wordIndex < words.length; wordIndex++) {
        if (wordIndex) result += ' ';
        const codes = words[wordIndex].trim().split(/\s+/);
        for (const code of codes) {
          if (!/^[1-4][1-8]$/.test(code)) throw new Error('Цифровой шифр: пары вида 11…48, пробел между парами, / между словами.');
          const position = Number(code[0]) - 1;
          const group = Number(code[1]) - 1;
          const letter = groups[group][position];
          result += letter;
          steps.push({ origin: [`dg-${group + 1}`], destination: [`d-${code}`], detail: `${code}: позиция ${position + 1}, раздел ${group + 1} → ${letter}`, output: result });
        }
      }
    } else {
      const words = text.toUpperCase().trim() ? text.toUpperCase().trim().split(/\s+/) : [];
      for (let wordIndex = 0; wordIndex < words.length; wordIndex++) {
        if (wordIndex) result += ' / ';
        let first = true;
        for (const letter of words[wordIndex]) {
          const group = groups.findIndex(function (letters) { return letters.includes(letter); });
          if (group < 0) throw new Error('Цифровой шифр принимает русские буквы без Ё и пробелы.');
          const position = groups[group].indexOf(letter);
          const code = `${position + 1}${group + 1}`;
          if (!first) result += ' ';
          first = false;
          result += code;
          steps.push({ origin: [`d-${code}`], destination: [`dg-${group + 1}`], detail: `${letter}: позиция ${position + 1}, раздел ${group + 1} → ${code}`, output: result });
        }
      }
    }
    return { text: result, steps, table: { columns: 8, cells, grouped: true, label: 'Группы букв и номера разделов' }, note: 'Например, Н находится на позиции 2 в разделе 4: Н → 24. Используются русские буквы без Ё; / разделяет слова, регистр не сохраняется.' };
  }
  return { run, groups };
})();
