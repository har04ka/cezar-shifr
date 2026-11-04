window.ScytaleCipher = (function () {
  function run(text, options) {
    const tools = window.CipherTools;
    const columns = tools.integer(options.columns, 2, 16);
    const letters = Array.from(text);
    const rows = Math.ceil(letters.length / columns);
    const order = [];

    // Текст записывается по строкам, а считывается по столбцам.
    for (let column = 0; column < columns; column++) {
      for (let row = 0; row < rows; row++) {
        const index = row * columns + column;
        if (index < letters.length) order.push(index);
      }
    }

    const plain = [];
    let result = '';
    if (options.decrypt) {
      for (let index = 0; index < order.length; index++) plain[order[index]] = letters[index];
      result = plain.join('');
    } else {
      plain.push(...letters);
      for (const index of order) result += letters[index];
    }

    const cells = [];
    for (let column = 0; column < columns; column++) cells.push(tools.cell(column + 1, '', true));
    for (let index = 0; index < rows * columns; index++) {
      cells.push(tools.cell(index < plain.length ? (plain[index] === ' ' ? '␣' : plain[index]) : '·', `s-${index}`));
    }
    const steps = [];
    let accumulated = '';
    for (let index = 0; index < order.length; index++) {
      const position = order[index];
      accumulated += letters[options.decrypt ? index : position];
      steps.push({
        origin: [`s-${position}`], destination: [`s-${position}`],
        detail: options.decrypt
          ? `Символ ${index + 1}: заполняем столбец ${position % columns + 1}, строку ${Math.floor(position / columns) + 1}. После заполнения читаем по строкам.`
          : `Читаем строку ${Math.floor(position / columns) + 1}, столбец ${position % columns + 1}: ${plain[position] === ' ' ? 'пробел' : plain[position]}.`,
        output: options.decrypt ? undefined : accumulated,
      });
    }
    return { text: result, steps, table: { columns, cells, label: 'Развёртка скиталы' },
      note: 'Ключ — число столбцов развёртки. Читаем сверху вниз по столбцам; пустые клетки пропускаем. Пробелы сохраняются, дополнение не используется.' };
  }
  return { run };
})();
