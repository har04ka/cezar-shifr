// Алфавиты содержат только заглавные буквы. Их номера начинаются с нуля.
window.CaesarCipher = (function () {
  const russianAlphabet = 'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ';
  const englishAlphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  function findAlphabet(letter) {
    const upperLetter = letter.toLocaleUpperCase('ru');
    if (russianAlphabet.includes(upperLetter)) return russianAlphabet;
    if (englishAlphabet.includes(upperLetter)) return englishAlphabet;
    return '';
  }

  function keepLetterCase(original, replacement) {
    if (original === original.toLocaleUpperCase('ru')) return replacement;
    return replacement.toLocaleLowerCase('ru');
  }

  // direction = 1 для шифрования, -1 для расшифровки.
  function transformText(text, shift, direction = 1) {
    let result = '';
    for (const letter of text) {
      const alphabet = findAlphabet(letter);
      if (alphabet === '') {
        result += letter;
        continue;
      }
      const oldIndex = alphabet.indexOf(letter.toLocaleUpperCase('ru'));
      const offset = (shift * direction) % alphabet.length;
      // Остаток от деления возвращает нас к началу алфавита при переходе за край.
      const newIndex = (oldIndex + offset + alphabet.length) % alphabet.length;
      result += keepLetterCase(letter, alphabet[newIndex]);
    }
    return result;
  }

  return { russianAlphabet, englishAlphabet, findAlphabet, keepLetterCase, transformText };
})();
