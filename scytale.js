window.ScytaleCipher = (function () {
  function run(text, options) {
    const { cell, integer } = window.CipherTools;
    const columns = integer(options.columns, 2, 16);
    const letters = Array.from(text);
    const rows = Math.ceil(letters.length / columns);
    const vertical = [];
    const horizontal = [];

    // Нумеруем занятые клетки в двух порядках. Пустые клетки пропускаем.
    for (let index = 0; index < letters.length; index++) {
      const row = index % rows;
      const column = Math.floor(index / rows);
      vertical.push(row * columns + column);
    }
    for (let row = 0; row < rows; row++) {
      for (let column = 0; column < columns; column++) {
        if (column * rows + row < letters.length) horizontal.push(row * columns + column);
      }
    }

    const writeOrder = options.decrypt ? horizontal : vertical;
    const readOrder = options.decrypt ? vertical : horizontal;
    const matrix = [];
    for (let index = 0; index < letters.length; index++) {
      matrix[writeOrder[index]] = letters[index];
    }

    function display(letter) {
      return letter === undefined ? '—' : letter === ' ' ? '␣' : letter;
    }

    const cells = [cell('', '', true)];
    for (let column = 0; column < columns; column++) {
      cells.push(cell(column + 1, '', true));
    }
    for (let row = 0; row < rows; row++) {
      cells.push(cell(row + 1, '', true));
      for (let column = 0; column < columns; column++) {
        const position = row * columns + column;
        cells.push(cell(display(matrix[position]), 's-' + position));
      }
    }

    const steps = [];
    let result = '';
    for (const position of readOrder) {
      const row = Math.floor(position / columns) + 1;
      const column = position % columns + 1;
      const letter = matrix[position];
      result += letter;
      const direction = options.decrypt ? '↓ По столбцу' : '→ По строке';
      steps.push({
        destination: ['s-' + position],
        detail: direction + ': клетка (' + row + ', ' + column + ') → «' + display(letter) + '»',
        output: result,
      });
    }

    const label = options.decrypt ? 'Запись по строкам →, чтение по столбцам ↓' : 'Запись по столбцам ↓, чтение по строкам →';
    const note = rows
      ? 'Таблица: ' + rows + ' × ' + columns + '. Число строк округляем вверх: длина текста ÷ число столбцов.'
      : 'Число строк получаем, разделив длину текста на число столбцов и округлив вверх.';
    return { text: result, steps, table: { columns: columns + 1, cells, label }, note };
  }

  return { run };
})();
