window.VernamCipher = (function () {
  const decoder = new TextDecoder('windows-1251');
  const characters = Array.from({ length: 256 }, (_, byte) => decoder.decode(Uint8Array.of(byte)));
  const codes = new Map(characters.map((letter, byte) => [letter, byte]));
  codes.delete(characters[0x98]);

  function toByte(letter) {
    return codes.get(letter) ?? (letter.codePointAt(0) & 255);
  }

  function hex(byte) {
    return byte.toString(16).toUpperCase().padStart(2, '0');
  }

  function run(text, options) {
    const { cell } = window.CipherTools;
    const key = Array.from(options.key || 'КЛЮЧ');
    const tokens = text.trim().split(/\s+/);
    const hexInput = options.decrypt && tokens.every(token => /^[\da-f]{2}$/i.test(token));
    const input = hexInput ? tokens : Array.from(text);
    const output = [];
    const steps = [];
    const separator = options.decrypt ? '' : ' ';
    const cells = [cell('Бит', '', true)];
    for (let bit = 7; bit >= 0; bit--) cells.push(cell(bit, '', true));
    let bitIndex = 0;
    for (const label of ['Вход', 'Ключ', 'XOR']) {
      cells.push(cell(label, '', true));
      for (let bit = 0; bit < 8; bit++) cells.push(cell('·', 'vn-' + bitIndex++));
    }

    for (let index = 0; index < input.length; index++) {
      const label = input[index];
      const a = hexInput ? parseInt(label, 16) : toByte(label);
      const keyLetter = key[index % key.length];
      const k = toByte(keyLetter);
      const b = a ^ k;
      const decoded = characters[b];
      const printable = b !== 0x98 && (decoded === ' ' || !/[\p{C}\p{Z}]/u.test(decoded));
      const result = options.decrypt ? (printable ? decoded : '0x' + hex(b)) : hex(b);
      output.push(result);
      const bits = [a, k, b].map(byte => byte.toString(2).padStart(8, '0')).join('');
      steps.push({
        bitValues: bits,
        origin: Array.from({ length: 16 }, (_, bit) => 'vn-' + bit),
        destination: Array.from({ length: 8 }, (_, bit) => 'vn-' + (16 + bit)),
        detail: '«' + label + '» (' + hex(a) + ') ⊕ «' + keyLetter + '» (' + hex(k) + ') → ' + result,
        output: output.join(separator),
      });
    }
    return {
      text: output.join(separator), steps,
      table: { columns: 9, cells, label: 'Побитовый XOR для текущего символа' },
      note: 'Используется Windows-1251. Для символов вне этой кодировки берётся младший байт, поэтому они могут не восстановиться. Шифртекст выводится парами HEX.',
    };
  }
  return { run };
})();
