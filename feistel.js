// Конкретный пример стандартной сети Фейстеля: DES, FIPS 46-3.
window.FeistelCipher = (function () {
  const IP = [58,50,42,34,26,18,10,2,60,52,44,36,28,20,12,4,62,54,46,38,30,22,14,6,64,56,48,40,32,24,16,8,57,49,41,33,25,17,9,1,59,51,43,35,27,19,11,3,61,53,45,37,29,21,13,5,63,55,47,39,31,23,15,7];
  const FP = [40,8,48,16,56,24,64,32,39,7,47,15,55,23,63,31,38,6,46,14,54,22,62,30,37,5,45,13,53,21,61,29,36,4,44,12,52,20,60,28,35,3,43,11,51,19,59,27,34,2,42,10,50,18,58,26,33,1,41,9,49,17,57,25];
  const E = [32,1,2,3,4,5,4,5,6,7,8,9,8,9,10,11,12,13,12,13,14,15,16,17,16,17,18,19,20,21,20,21,22,23,24,25,24,25,26,27,28,29,28,29,30,31,32,1];
  const P = [16,7,20,21,29,12,28,17,1,15,23,26,5,18,31,10,2,8,24,14,32,27,3,9,19,13,30,6,22,11,4,25];
  const PC1 = [57,49,41,33,25,17,9,1,58,50,42,34,26,18,10,2,59,51,43,35,27,19,11,3,60,52,44,36,63,55,47,39,31,23,15,7,62,54,46,38,30,22,14,6,61,53,45,37,29,21,13,5,28,20,12,4];
  const PC2 = [14,17,11,24,1,5,3,28,15,6,21,10,23,19,12,4,26,8,16,7,27,20,13,2,41,52,31,37,47,55,30,40,51,45,33,48,44,49,39,56,34,53,46,42,50,36,29,32];
  const SHIFTS = [1,1,2,2,2,2,2,2,1,2,2,2,2,2,2,1];
  const S = [
    [14,4,13,1,2,15,11,8,3,10,6,12,5,9,0,7,0,15,7,4,14,2,13,1,10,6,12,11,9,5,3,8,4,1,14,8,13,6,2,11,15,12,9,7,3,10,5,0,15,12,8,2,4,9,1,7,5,11,3,14,10,0,6,13],
    [15,1,8,14,6,11,3,4,9,7,2,13,12,0,5,10,3,13,4,7,15,2,8,14,12,0,1,10,6,9,11,5,0,14,7,11,10,4,13,1,5,8,12,6,9,3,2,15,13,8,10,1,3,15,4,2,11,6,7,12,0,5,14,9],
    [10,0,9,14,6,3,15,5,1,13,12,7,11,4,2,8,13,7,0,9,3,4,6,10,2,8,5,14,12,11,15,1,13,6,4,9,8,15,3,0,11,1,2,12,5,10,14,7,1,10,13,0,6,9,8,7,4,15,14,3,11,5,2,12],
    [7,13,14,3,0,6,9,10,1,2,8,5,11,12,4,15,13,8,11,5,6,15,0,3,4,7,2,12,1,10,14,9,10,6,9,0,12,11,7,13,15,1,3,14,5,2,8,4,3,15,0,6,10,1,13,8,9,4,5,11,12,7,2,14],
    [2,12,4,1,7,10,11,6,8,5,3,15,13,0,14,9,14,11,2,12,4,7,13,1,5,0,15,10,3,9,8,6,4,2,1,11,10,13,7,8,15,9,12,5,6,3,0,14,11,8,12,7,1,14,2,13,6,15,0,9,10,4,5,3],
    [12,1,10,15,9,2,6,8,0,13,3,4,14,7,5,11,10,15,4,2,7,12,9,5,6,1,13,14,0,11,3,8,9,14,15,5,2,8,12,3,7,0,4,10,1,13,11,6,4,3,2,12,9,5,15,10,11,14,1,7,6,0,8,13],
    [4,11,2,14,15,0,8,13,3,12,9,7,5,10,6,1,13,0,11,7,4,9,1,10,14,3,5,12,2,15,8,6,1,4,11,13,12,3,7,14,10,15,6,8,0,5,9,2,6,11,13,8,1,4,10,7,9,5,0,15,14,2,3,12],
    [13,2,8,4,6,15,11,1,10,9,3,14,5,0,12,7,1,15,13,8,10,3,7,4,12,5,6,11,0,14,9,2,7,11,4,1,9,12,14,2,0,6,10,13,15,3,5,8,2,1,14,7,4,10,8,13,15,12,9,0,3,5,6,11],
  ];

  function permute(bits, table) {
    let result = '';
    for (const position of table) result += bits[position - 1];
    return result;
  }
  function xor(left, right) {
    let result = '';
    for (let index = 0; index < left.length; index++) result += left[index] === right[index] ? '0' : '1';
    return result;
  }
  function fromHex(hex) {
    return Array.from(hex, function (digit) { return parseInt(digit, 16).toString(2).padStart(4, '0'); }).join('');
  }
  function toHex(bits) {
    let result = '';
    for (let index = 0; index < bits.length; index += 4) result += parseInt(bits.slice(index, index + 4), 2).toString(16).toUpperCase();
    return result;
  }
  function roundKeys(key) {
    const bits = permute(fromHex(key), PC1);
    let left = bits.slice(0, 28);
    let right = bits.slice(28);
    const keys = [];
    for (const shift of SHIFTS) {
      left = left.slice(shift) + left.slice(0, shift);
      right = right.slice(shift) + right.slice(0, shift);
      keys.push(permute(left + right, PC2));
    }
    return keys;
  }
  function roundFunction(right, key) {
    const expanded = permute(right, E);
    const mixed = xor(expanded, key);
    let substituted = '';
    for (let box = 0; box < 8; box++) {
      const six = mixed.slice(box * 6, box * 6 + 6);
      const row = parseInt(six[0] + six[5], 2);
      const column = parseInt(six.slice(1, 5), 2);
      substituted += S[box][row * 16 + column].toString(2).padStart(4, '0');
    }
    return { output: permute(substituted, P), expanded, mixed, substituted };
  }

  function block(hex, key, decrypt) {
    const keys = roundKeys(key);
    if (decrypt) keys.reverse();
    const bits = permute(fromHex(hex), IP);
    let left = bits.slice(0, 32);
    let right = bits.slice(32);
    const rounds = [];
    for (let index = 0; index < 16; index++) {
      const f = roundFunction(right, keys[index]);
      const newLeft = right;
      const newRight = xor(left, f.output);
      rounds.push({ left, right, key: keys[index], f, newLeft, newRight, round: index + 1, keyNumber: decrypt ? 16 - index : index + 1 });
      left = newLeft;
      right = newRight;
    }
    return { hex: toHex(permute(right + left, FP)), rounds };
  }

  function run(text, options) {
    const key = options.key.replace(/\s/g, '').toUpperCase();
    if (!/^[0-9A-F]{16}$/.test(key)) throw new Error('DES-ключ должен содержать ровно 16 шестнадцатеричных цифр.');
    const hexMode = options.format === 'hex';
    let input;
    if (options.decrypt || hexMode) {
      input = text.replace(/\s/g, '').toUpperCase();
      if (input && (!/^[0-9A-F]+$/.test(input) || input.length % 16 !== 0)) throw new Error('DES: введите hex-строку длиной, кратной 16 цифрам (блок 64 бита).');
    } else {
      const bytes = Array.from(new TextEncoder().encode(text));
      const padding = 8 - bytes.length % 8;
      for (let index = 0; index < padding; index++) bytes.push(padding);
      input = bytes.map(function (byte) { return byte.toString(16).padStart(2, '0'); }).join('').toUpperCase();
    }
    const cells = ['Блок / раунд', 'L до', 'R до', 'K (48 бит)', 'f(R,K)', 'L после', 'R после'].map(function (label) { return window.CipherTools.cell(label, '', true); });
    const steps = [];
    let result = '';
    for (let offset = 0; offset < input.length; offset += 16) {
      const blockNumber = offset / 16 + 1;
      const current = block(input.slice(offset, offset + 16), key, options.decrypt);
      for (const round of current.rounds) {
        const id = `f-${blockNumber}-${round.round}`;
        const values = [`${blockNumber} / ${round.round}`, toHex(round.left), toHex(round.right), toHex(round.key), toHex(round.f.output), toHex(round.newLeft), toHex(round.newRight)];
        for (let index = 0; index < values.length; index++) cells.push(window.CipherTools.cell(values[index], `${id}-${index}`));
        steps.push({ origin: [`${id}-1`, `${id}-2`, `${id}-3`], destination: [`${id}-5`, `${id}-6`],
          detail: `Блок ${blockNumber}, раунд ${round.round}, K${round.keyNumber}: L′ = R = ${toHex(round.newLeft)}; R′ = ${toHex(round.left)} XOR ${toHex(round.f.output)} = ${toHex(round.newRight)}.`,
          feistel: { left: toHex(round.left), right: toHex(round.right), key: toHex(round.key), f: toHex(round.f.output), newLeft: toHex(round.newLeft), newRight: toHex(round.newRight), expanded: toHex(round.f.expanded), mixed: toHex(round.f.mixed) } });
      }
      result += current.hex;
    }
    if (options.decrypt && !hexMode && result) {
      const bytes = result.match(/../g).map(function (pair) { return parseInt(pair, 16); });
      const padding = bytes[bytes.length - 1];
      if (padding < 1 || padding > 8 || bytes.slice(-padding).some(function (byte) { return byte !== padding; })) throw new Error('Не удалось снять дополнение PKCS#7: проверьте ключ, текст и выбранный формат.');
      try { result = new TextDecoder('utf-8', { fatal: true }).decode(new Uint8Array(bytes.slice(0, -padding))); }
      catch (error) { throw new Error('Расшифрованный блок не является UTF-8 текстом. Проверьте ключ или выберите HEX.'); }
    }
    return { text: result, steps, table: { columns: 7, cells, label: 'Раунды сети Фейстеля DES', large: true },
      note: 'Сеть со слайда реализована на примере DES (FIPS 46-3): 16 раундов, L′ = R; R′ = L XOR f(R,K). f: расширение E → XOR с K → S-блоки → перестановка P. Расшифровка — ключи в обратном порядке. UTF-8: блоки по 8 байт, PKCS#7, ECB; HEX: без дополнения. Учебная демонстрация исторического алгоритма.' };
  }
  return { run, block, roundFunction, roundKeys };
})();
