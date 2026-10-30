// Формула Атбаша: y = N - 1 - x. Повторная замена возвращает исходный текст.
window.AtbashCipher = (function () {
  function transformText(text) {
    let result = '';
    for (const letter of text) {
      const alphabet = window.CaesarCipher.findAlphabet(letter);
      if (alphabet === '') {
        result += letter;
        continue;
      }
      const oldIndex = alphabet.indexOf(letter.toLocaleUpperCase('ru'));
      const newIndex = alphabet.length - 1 - oldIndex;
      result += window.CaesarCipher.keepLetterCase(letter, alphabet[newIndex]);
    }
    return result;
  }

  return { transformText };
})();
