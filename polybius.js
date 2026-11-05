window.PolybiusCipher = (function () {
  const alphabet = 'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ';
  // Три разных служебных символа занимают пустые клетки квадрата.
  // Они могут появиться в шифротексте после перемешивания координат.
  const square = alphabet + '123';

  function coordinates(letter) {
    const index = square.indexOf(letter.toUpperCase());
    return [index % 6 + 1, Math.floor(index / 6) + 1];
  }

  function run(text, options) {
    const tools = window.CipherTools;
    const cells = [tools.cell('↓ / →', '', true)];
    for (let column = 1; column <= 6; column++) cells.push(tools.cell(column, '', true));
    for (let row = 1; row <= 6; row++) {
      cells.push(tools.cell(row, '', true));
      for (let column = 1; column <= 6; column++) {
        const letter = square[(row - 1) * 6 + column - 1];
        cells.push(tools.cell(letter, `p-${column}${row}`));
      }
    }
    const steps = [];
    let result = '';
    // Каждый непрерывный фрагмент кодируется целиком.
    const fragments = text.match(/[А-ЯЁа-яё123]+|[^А-ЯЁа-яё123]+/gu) || [];
    for (const fragment of fragments) {
      if (!square.includes(fragment[0].toUpperCase())) {
        result += fragment;
        continue;
      }
      const letters = Array.from(fragment);
      const first = [];
      const second = [];
      const flat = [];
      for (const letter of letters) {
        const pair = coordinates(letter);
        first.push(pair[0]);
        second.push(pair[1]);
        flat.push(...pair);
      }
      const stream = options.decrypt ? flat : first.concat(second);
      steps.push({ origin: letters.map(function (letter) { return 'p-' + coordinates(letter).join(''); }),
        detail: options.decrypt
          ? `Пары шифротекста: ${flat.join(' ')}. Делим поток на две строки по ${letters.length} координат.`
          : `${fragment.toUpperCase()}: столбцы ${first.join(' ')}, строки ${second.join(' ')}. Читаем сначала все столбцы, затем все строки: ${stream.join(' ')}.` });
      for (let index = 0; index < letters.length; index++) {
        const column = options.decrypt ? stream[index] : stream[index * 2];
        const row = options.decrypt ? stream[index + letters.length] : stream[index * 2 + 1];
        const replacement = square[(row - 1) * 6 + column - 1];
        result += replacement;
        steps.push({ destination: [`p-${column}${row}`], detail: `Столбец ${column}, строка ${row} → ${replacement}`, output: result });
      }
    }
    return { text: result, steps, table: { columns: 7, cells, label: 'Квадрат Полибия 6 × 6' },
      note: 'Координаты считаются от 1: сначала столбец, затем строка. Служебные символы 1, 2, 3 заполняют последние клетки, чтобы преобразование было обратимым. Регистр не сохраняется.' };
  }
  return { run };
})();
