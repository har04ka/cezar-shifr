window.PlayfairCipher = (function () {
  function run(text, options) {
    const tools = window.CipherTools;
    const key = options.key.trim() || 'КЛЮЧ';
    const russian = /[А-ЯЁ]/iu.test(text + key);
    const alphabet = russian ? tools.russian32 : tools.english.replace('J', '');
    const columns = russian ? 8 : 5;
    const rows = alphabet.length / columns;
    const padding = russian ? 'Х' : 'X';
    const alternate = russian ? 'Ф' : 'Z';
    function normalize(letter) {
      const upper = letter.toUpperCase();
      return russian ? upper.replace('Ё', 'Е') : upper.replace('J', 'I');
    }
    const matrix = [...new Set([...Array.from(key, normalize).filter(letter => letter.length === 1 && alphabet.includes(letter)), ...alphabet])];
    const letters = Array.from(text, normalize).filter(letter => letter.length === 1 && alphabet.includes(letter));
    if (text.trim() && !letters.length) throw new Error('Введите буквы выбранного алфавита.');
    const steps = [];
    const pairs = [];
    const delta = options.decrypt ? -1 : 1;
    for (let index = 0; index < letters.length;) {
      const a = letters[index++];
      let b = letters[index];
      let prep = '';
      if (!b || (!options.decrypt && a === b)) {
        prep = b ? 'Повтор разделён заполнителем. ' : 'Добавлен заполнитель. ';
        b = a === padding ? alternate : padding;
      } else index++;

      const first = matrix.indexOf(a);
      const second = matrix.indexOf(b);
      const r1 = Math.floor(first / columns), c1 = first % columns;
      const r2 = Math.floor(second / columns), c2 = second % columns;
      let next1, next2, rule;
      if (r1 === r2) {
        next1 = r1 * columns + (c1 + delta + columns) % columns;
        next2 = r2 * columns + (c2 + delta + columns) % columns;
        rule = options.decrypt ? 'По строке влево' : 'По строке вправо';
      } else if (c1 === c2) {
        next1 = ((r1 + delta + rows) % rows) * columns + c1;
        next2 = ((r2 + delta + rows) % rows) * columns + c2;
        rule = options.decrypt ? 'По столбцу вверх' : 'По столбцу вниз';
      } else {
        next1 = r1 * columns + c2;
        next2 = r2 * columns + c1;
        rule = 'Прямоугольник: меняем столбцы местами';
      }
      const pair = matrix[next1] + matrix[next2];
      pairs.push(pair);
      steps.push({
        origin: ['pf-' + first, 'pf-' + second],
        destination: ['pf-' + next1, 'pf-' + next2],
        detail: prep + a + b + ' → ' + pair + ' · ' + rule,
        output: pairs.join(' '),
      });
    }
    const cells = matrix.map((letter, index) => tools.cell(letter, 'pf-' + index));
    return {
      text: pairs.join(' '), steps,
      table: { columns, cells, label: 'Ключевая матрица ' + rows + ' × ' + columns },
      note: (russian ? 'Ё → Е. Заполнители Х и Ф.' : 'J → I. Заполнители X и Z.') + ' Пробелы и знаки пропускаются; заполнители при расшифровке сохраняются.',
    };
  }
  return { run };
})();
