window.CaesarCipher = (() => {
const russianAlphabet = 'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ';
const englishAlphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        function transformText(text, shift, direction = 1) {
          const delta = direction * shift;

          return Array.from(text, (character) => {
            const uppercaseCharacter = character.toLocaleUpperCase('ru');
            let alphabet = russianAlphabet;
            let index = alphabet.indexOf(uppercaseCharacter);

            if (index < 0) {
              alphabet = englishAlphabet;
              index = alphabet.indexOf(uppercaseCharacter);
            }

            if (index < 0) {
              return character;
            }

            const shiftedIndex =
              (index + (delta % alphabet.length) + alphabet.length) %
              alphabet.length;
            const shiftedCharacter = alphabet[shiftedIndex];

            return character === uppercaseCharacter
              ? shiftedCharacter
              : shiftedCharacter.toLocaleLowerCase('ru');
          }).join('');
        }


return { russianAlphabet, englishAlphabet, transformText };
})();
