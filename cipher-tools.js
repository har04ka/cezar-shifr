// Общий формат: результат, таблица и шаги для демонстрации.
window.CipherTools = (function () {
  const russian = 'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ';
  const russian32 = russian.replace('Ё', '');
  const english = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  function sameCase(letter, replacement) {
    return letter === letter.toUpperCase() ? replacement : replacement.toLowerCase();
  }

  function alphabetFor(letter) {
    const upper = letter.toUpperCase();
    if (russian.includes(upper)) return russian;
    if (english.includes(upper)) return english;
    return '';
  }

  function cell(text, id, header = false) {
    return { text: String(text), id, header };
  }

  function integer(value, minimum, maximum) {
    const number = Number(value);
    if (!Number.isInteger(number) || number < minimum || number > maximum) {
      throw new Error(`Введите целое число от ${minimum} до ${maximum}.`);
    }
    return number;
  }

  return { russian, russian32, english, sameCase, alphabetFor, cell, integer };
})();
