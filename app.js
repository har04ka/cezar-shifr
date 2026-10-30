// Управление формой и пошаговая демонстрация шифров.
(function () {
  const { russianAlphabet, englishAlphabet } = window.CaesarCipher;
  let cipherType = 'caesar';
  function transformText(text, shift) {
    if (cipherType === 'atbash') {
      return window.AtbashCipher.transformText(text);
    }
    return window.CaesarCipher.transformText(text, shift, direction);
  }

  // Элементы формы.
  const sourceInput = document.querySelector('#source');
  const resultInput = document.querySelector('#result');
  const shiftSlider = document.querySelector('#range');
  const shiftInput = document.querySelector('#number');
  const status = document.querySelector('#status');
  const encryptButton = document.querySelector('#encrypt');
  const decryptButton = document.querySelector('#decrypt');

  let direction = 1;
  // Новый номер отменяет старую анимацию после изменения текста или режима.
  let animationVersion = 0;
  const animation = document.createElement('div');
  animation.classList.add('animation-animation');
  const startButton = document.querySelector('#start');
  startButton.type = 'button';
  startButton.textContent = 'Начать';
  startButton.classList.add('animation-play');
  const animationStatus = document.createElement('div');
  animationStatus.classList.add('animation-frame');
  animationStatus.setAttribute('role', 'status');

  function createLetterRow(text) {
    const row = document.createElement('div');
    row.className = 'cipher-row';
    for (const letter of text) {
      const tile = document.createElement('span');
      tile.className = 'cipher-tile';
      tile.textContent = letter === ' ' ? '␣' : letter;
      row.append(tile);
    }
    return row;
  }
  function createCaption(text) {
    const label = document.createElement('div');
    label.className = 'cipher-caption';
    label.textContent = text;
    return label;
  }
  const russianRow = createLetterRow(russianAlphabet);
  russianRow.className = 'alphabet-grid';
  const englishRow = createLetterRow(englishAlphabet);
  englishRow.className = 'alphabet-grid latin';
  for (const [row, alphabet] of [[russianRow, russianAlphabet], [englishRow, englishAlphabet]]) {
    for (let index = 0; index < row.children.length; index++) {
      const tile = row.children[index];
      tile.dataset.mirror = alphabet[alphabet.length - 1 - index];
    }
  }
  function clearAlphabetHighlight() {
    for (const row of [russianRow, englishRow]) {
      for (const tile of row.children) {
        tile.classList.remove('origin', 'transit', 'destination', 'pair-target', 'visited');
      }
    }
  }
  const controls = document.createElement('div');
  controls.className = 'animation-controls';
  const speedLabel = document.createElement('label');
  speedLabel.className = 'animation-speed';
  const speedSlider = document.createElement('input');
  speedSlider.type = 'range';
  speedSlider.min = '0.25';
  speedSlider.max = '3';
  speedSlider.step = '0.25';
  speedSlider.value = '1';
  speedSlider.setAttribute('aria-label', 'Скорость анимации');
  const speedValue = document.createElement('output');
  speedValue.textContent = '1×';
  speedSlider.addEventListener('input', function () {
    speedValue.textContent = `${Number(speedSlider.value)}×`;
  });
  speedLabel.append('Скорость', speedSlider, speedValue);
  controls.append(speedLabel, startButton);
  document.querySelector('.bottom').append(controls);
  const legend = document.createElement('div');
  legend.className = 'animation-legend';
  for (const [text, color] of [['Начало', '#88a9e8'], ['Промежуточный шаг', '#d9ad51'], ['Результат', '#28664f']]) {
    const item = document.createElement('span');
    const dot = document.createElement('i');
    dot.className = 'legend-' + color.slice(1);
    item.append(dot, text);
    legend.append(item);
  }
  function animationDelay(milliseconds) {
    const speedMultiplier = Number(speedSlider.value);
    return new Promise(function (resolve) {
      setTimeout(resolve, milliseconds / speedMultiplier);
    });
  }
  const alphabetBoard = document.createElement('div');
  alphabetBoard.className = 'alphabet-board';
  alphabetBoard.append(legend, createCaption('Русский алфавит'), russianRow, createCaption('Латинский алфавит'), englishRow, animationStatus);
  animation.append(alphabetBoard);
  document.querySelector('section').append(animation);
  let isRunning = false;

  // Подсвечиваем исходную букву, затем её зеркальную замену.
  async function animateAtbash(character, alphabet, alphabetRow, originIndex, version, progress) {
    if (alphabet) alphabetRow.children[originIndex].classList.add('origin');
    progress.textContent = alphabet ? `${character} — ищем букву в верхнем алфавите` : `${character === ' ' ? 'Пробел' : character} — символ не изменяется`;
    await animationDelay(450);
    if (version !== animationVersion) return;
    if (alphabet) {
      alphabetRow.children[originIndex].classList.add('pair-target');
    }
    const replacement = transformText(character);
    progress.textContent = alphabet ? `${character} → ${replacement} · зеркальная пара: ${originIndex + 1} ↔ ${alphabet.length - originIndex}` : 'Этот символ остаётся без изменений';
    await animationDelay(800);
  }

  // Для Цезаря показываем каждую промежуточную позицию.
  async function animateCaesar(character, upper, alphabet, alphabetRow, originIndex, steps, version, progress) {
    for (let step = 0; step <= steps; step++) {
      if (version !== animationVersion) return;
      const index = alphabet ? (alphabet.indexOf(upper) + direction * step + alphabet.length) % alphabet.length : 0;
      const current = alphabet ? alphabet[index] : character;
      for (let tileIndex = 0; tileIndex < alphabetRow.children.length; tileIndex++) {
        const tile = alphabetRow.children[tileIndex];
        if (alphabet && tileIndex === index && step > 0) tile.classList.add('visited');
        tile.classList.toggle('origin', Boolean(alphabet) && tileIndex === originIndex);
        tile.classList.toggle('transit', Boolean(alphabet) && tileIndex === index && step > 0 && step < steps);
        tile.classList.toggle('destination', Boolean(alphabet) && tileIndex === index && step === steps);
      }
      const displayCurrent = character === upper ? current : current.toLocaleLowerCase('ru');
      progress.textContent = alphabet ? `${character} → ${displayCurrent} · шаг ${step} из ${steps}` : 'Этот символ остаётся без изменений';
      await animationDelay(steps ? Math.max(150, 900 / steps) : 250);
    }
    if (version !== animationVersion) return;
    await animationDelay(450);
  }

  async function startAnimation() {
    const version = ++animationVersion;
    if (isRunning) {
      isRunning = false;
      clearAlphabetHighlight();
      startButton.textContent = 'Начать';
      return;
    }
    isRunning = true;
    startButton.textContent = 'Остановить';
    let completed = '';
    const characters = Array.from(sourceInput.value);
    const progress = document.createElement('span');
    animationStatus.replaceChildren(progress);
    for (let i = 0; i < characters.length; i++) {
      if (version !== animationVersion) return;
      const character = characters[i];
      const upper = character.toLocaleUpperCase('ru');
      const alphabet = window.CaesarCipher.findAlphabet(character);
      const steps = alphabet ? Number(shiftSlider.value) % alphabet.length : 0;
      clearAlphabetHighlight();
      const alphabetRow = alphabet === russianAlphabet ? russianRow : englishRow;
      const originIndex = alphabet.indexOf(upper);
      if (cipherType === 'atbash') {
        await animateAtbash(character, alphabet, alphabetRow, originIndex, version, progress);
      } else {
        await animateCaesar(character, upper, alphabet, alphabetRow, originIndex, steps, version, progress);
      }
      if (version !== animationVersion) return;
      completed += transformText(character, Number(shiftSlider.value));
    }
    if (version !== animationVersion) return;
    progress.textContent = completed ? 'Готово — все буквы заменены' : 'Введите текст для анимации';
    clearAlphabetHighlight();
    isRunning = false;
    startButton.textContent = 'Начать';
  }

  startButton.addEventListener('click', startAnimation);

  // Пересчёт результата и сброс проигрывания.
  function updateResult() {
    clearAlphabetHighlight();
    animationVersion++;
    isRunning = false;
    animationStatus.textContent = '';
    startButton.disabled = !sourceInput.value;
    startButton.textContent = 'Начать';
    const shift = Math.max(
      0,
      Math.min(32, Math.trunc(Number(shiftSlider.value) || 0)),
    );

    shiftSlider.value = shiftInput.value = shift;
    resultInput.value = transformText(sourceInput.value, shift);
    status.textContent = '';
  }

  function setMode(value) {
    direction = value;
    encryptButton.setAttribute('aria-pressed', String(value === 1));
    decryptButton.setAttribute('aria-pressed', String(value === -1));
    updateResult();
  }

  shiftSlider.addEventListener('input', function () {
    shiftInput.value = shiftSlider.value;
    updateResult();
  });

  shiftInput.addEventListener('input', function () {
    if (shiftInput.value === '') {
      return;
    }

    shiftSlider.value = String(
      Math.max(0, Math.min(32, Math.trunc(Number(shiftInput.value) || 0))),
    );
    updateResult();
  });

  shiftInput.addEventListener('change', function () {
    shiftSlider.value = String(
      Math.max(0, Math.min(32, Math.trunc(Number(shiftInput.value) || 0))),
    );
    updateResult();
  });

  sourceInput.addEventListener('input', updateResult);
  encryptButton.addEventListener('click', function () { setMode(1); });
  decryptButton.addEventListener('click', function () { setMode(-1); });

  function selectCipher(type) {
    cipherType = type;
    const isAtbash = type === 'atbash';
    document.querySelector('#atbash-formula').hidden = !isAtbash;
    document.querySelector('#caesar-choice').setAttribute('aria-pressed', String(!isAtbash));
    document.querySelector('#atbash-choice').setAttribute('aria-pressed', String(isAtbash));
    document.querySelector('.shift').hidden = isAtbash;
    document.querySelector('.modes').hidden = isAtbash;
    document.querySelector('.toolbar').hidden = isAtbash;
    animation.classList.toggle('atbash-view', isAtbash);
    legend.children[1].hidden = isAtbash;
    document.querySelector('#cipher-description').textContent = isAtbash
      ? 'Атбаш: первая буква заменяется последней, вторая — предпоследней. В каждой плитке сверху исходная буква, снизу — замена. Повторное преобразование расшифровывает текст.'
      : 'Цезарь: каждая буква сдвигается по алфавиту на выбранное число позиций.';
    updateResult();
  }

  document.querySelector('#caesar-choice').addEventListener('click', function () { selectCipher('caesar'); });
  document.querySelector('#atbash-choice').addEventListener('click', function () { selectCipher('atbash'); });

  document.querySelector('#clear').addEventListener('click', function () {
    sourceInput.value = '';
    updateResult();
    sourceInput.focus();
  });

  updateResult();
})();
