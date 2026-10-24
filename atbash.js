// Atbash reverses each alphabet. Applying it twice restores the original text.
window.AtbashCipher = (() => {
  const { russianAlphabet, englishAlphabet } = window.CaesarCipher;

  function transformText(text) {
    return Array.from(text, (character) => {
      const upper = character.toLocaleUpperCase('ru');
      const alphabet = [russianAlphabet, englishAlphabet].find((letters) =>
        letters.includes(upper),
      );
      if (!alphabet) return character;
      const replacement = alphabet[alphabet.length - 1 - alphabet.indexOf(upper)];
      return character === upper ? replacement : replacement.toLocaleLowerCase('ru');
    }).join('');
  }

  return { transformText };
})();
