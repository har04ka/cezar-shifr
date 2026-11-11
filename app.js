// Выбор шифра, параметры и общее управление демонстрацией.
(function () {
  const sourceInput = document.querySelector('#source');
  const resultInput = document.querySelector('#result');
  const startButton = document.querySelector('#start');
  const stepStatus = document.querySelector('#step-status');
  const speedSlider = document.querySelector('#speed');
  const errorMessage = document.querySelector('#error');
  const tables = document.querySelector('#tables');
  const cellElements = new Map();
  const descriptions = {
    caesar: 'Цезарь: сдвиг букв по алфавиту на выбранное число позиций.',
    atbash: 'Атбаш: первая буква заменяется последней. В плитке сверху исходная буква, снизу — её зеркальная пара.',
    scytale: 'Скитала: для шифрования записываем текст по столбцам и читаем по строкам. Для расшифровки меняем порядок. Пустые клетки пропускаем, пробелы сохраняем.',
    morse: 'Морзе: удерживайте ключ для ввода сигналов. Короткое нажатие — точка, длинное — тире. Пауза завершает букву.',
    polybius: 'Полибий: записываем столбцы всех букв слова, затем их строки. Делим полученные цифры на пары и находим новые буквы в квадрате.',
    feistel: 'Сеть Фейстеля: стандартный пример DES, 16 раундов. Следим за обменом половин и операцией XOR.',
    digital: 'Цифровой шифр: буквы разбиты на восемь разделов. Первая цифра обозначает позицию буквы в разделе, вторая — номер раздела.',
    vigenere: 'Виженер: повторяем ключ под текстом. Строка задаётся буквой ключа, столбец — буквой текста, на пересечении находится результат.',
  };
  let selectedCipher = 'caesar';
  let decrypt = false;
  let calculation = null;
  let isRunning = false;
  let animationId = 0;
  let waitTimer = null;
  let finishWait = null;

  function options() {
    return {
      decrypt,
      shift: document.querySelector('#number').value,
      columns: document.querySelector('#columns').value,
      key: document.querySelector(selectedCipher === 'feistel' ? '#des-key' : '#vigenere-key').value,
      language: document.querySelector('#morse-language').value,
      format: document.querySelector('#des-format').value,
    };
  }

  function calculate(text, settings) {
    if (selectedCipher === 'caesar' || selectedCipher === 'atbash') return window.LessonCiphers.run(selectedCipher, text, settings);
    const methods = { scytale: window.ScytaleCipher, morse: window.MorseCipher, polybius: window.PolybiusCipher, feistel: window.FeistelCipher, digital: window.DigitalCipher, vigenere: window.VigenereCipher };
    return methods[selectedCipher].run(text, settings);
  }

  function clearHighlight() {
    for (const cell of cellElements.values()) cell.classList.remove('origin', 'transit', 'destination', 'pair-target', 'cross-highlight');
    for (const signal of document.querySelectorAll('.signal.active')) signal.classList.remove('active');
    document.querySelector('#signal-lamp').classList.remove('on');
  }

  function stopAnimation() {
    animationId++;
    isRunning = false;
    startButton.textContent = 'Начать';
    window.MorseAudio.stop();
    if (waitTimer !== null) clearTimeout(waitTimer);
    if (finishWait) finishWait();
    waitTimer = null;
    finishWait = null;
    clearHighlight();
    document.querySelector('#feistel-diagram').classList.remove('network-input', 'network-output');
    if (calculation) resultInput.value = calculation.text;
  }

  function wait(milliseconds) {
    return new Promise(function (resolve) {
      finishWait = resolve;
      waitTimer = setTimeout(function () {
        waitTimer = null;
        finishWait = null;
        resolve();
      }, milliseconds);
    });
  }

  function renderTable(model) {
    const heading = document.createElement('p');
    heading.className = 'cipher-caption';
    heading.textContent = model.label;
    const scroll = document.createElement('div');
    scroll.className = 'table-scroll';
    if (model.large) scroll.classList.add('large-table');
    const table = document.createElement('table');
    table.className = 'lesson-table';
    if (model.large) table.classList.add('dense-table');
    if (model.grouped) table.classList.add('grouped-table');
    table.setAttribute('aria-label', model.label);
    const body = document.createElement('tbody');
    let row;
    for (let index = 0; index < model.cells.length; index++) {
      if (index % model.columns === 0) {
        row = document.createElement('tr');
        body.append(row);
      }
      const item = model.cells[index];
      const cell = document.createElement(item.header ? 'th' : 'td');
      cell.textContent = item.text;
      if (item.letters) {
        cell.replaceChildren();
        for (const letter of item.letters) {
          const tile = document.createElement('span');
          tile.className = 'group-letter';
          tile.textContent = letter.text;
          tile.title = 'Позиция ' + letter.position;
          cell.append(tile);
          cellElements.set(letter.id, tile);
        }
      }
      cell.dataset.row = Math.floor(index / model.columns);
      cell.dataset.column = index % model.columns;
      if (item.mirror) {
        const mirror = document.createElement('small');
        mirror.className = 'mirror-letter';
        mirror.textContent = item.mirror;
        cell.append(mirror);
      }
      row.append(cell);
      if (item.id) cellElements.set(item.id, cell);
    }
    table.append(body);
    scroll.append(table);
    tables.append(heading, scroll);
  }

  function renderCalculation(data) {
    tables.replaceChildren();
    cellElements.clear();
    document.querySelector('#cipher-description').textContent = descriptions[selectedCipher] + ' ' + data.note;
    for (const model of data.tables || [data.table]) renderTable(model);
    const alignment = document.querySelector('#key-alignment');
    alignment.hidden = !data.alignment;
    alignment.replaceChildren();
    for (const row of data.alignment || []) {
      const line = document.createElement('div');
      line.textContent = row[0] + ': ' + row[1];
      alignment.append(line);
    }
    document.querySelector('#morse-player').hidden = selectedCipher !== 'morse';
    document.querySelector('#feistel-diagram').hidden = selectedCipher !== 'feistel';
    const signals = document.querySelector('#signal-strip');
    signals.replaceChildren();
    for (let index = 0; index < (data.display || []).length; index++) {
      const item = data.display[index];
      const symbol = document.createElement('span');
      symbol.className = item.gap ? 'signal-gap' : 'signal';
      symbol.textContent = item.symbol;
      symbol.dataset.signal = index;
      if (item.letter) symbol.title = item.letter;
      signals.append(symbol);
    }
  }

  function updateResult() {
    stopAnimation();
    errorMessage.hidden = true;
    stepStatus.textContent = 'Введите текст и нажмите «Начать».';
    calculation = null;
    try {
      const limit = selectedCipher === 'feistel' && (decrypt || options().format === 'hex') ? 8192 : 1024;
      if (Array.from(sourceInput.value).length > limit) throw new Error(`Для наглядной демонстрации введите не больше ${limit} символов.`);
      calculation = calculate(sourceInput.value, options());
      resultInput.value = sourceInput.value ? calculation.text : '';
      renderCalculation(calculation);
      startButton.disabled = !sourceInput.value || (selectedCipher === 'morse' ? !calculation.signals.length : !calculation.steps.length);
    } catch (error) {
      resultInput.value = '';
      errorMessage.textContent = error.message;
      errorMessage.hidden = false;
      startButton.disabled = true;
      tables.replaceChildren();
      document.querySelector('#cipher-description').textContent = descriptions[selectedCipher];
      document.querySelector('#signal-strip').replaceChildren();
      document.querySelector('#key-alignment').hidden = true;
    }
  }

  function selectCipher(name) {
    const changed = selectedCipher !== name;
    morseKey.reset();
    if (changed && (name === 'morse' || selectedCipher === 'morse')) sourceInput.value = '';
    if (changed) decrypt = name === 'morse';
    selectedCipher = name;
    const manual = name === 'morse' && decrypt;
    document.querySelector('#manual-morse').hidden = !manual;
    document.querySelector('#example').hidden = manual;
    sourceInput.readOnly = manual;
    document.querySelector('label[for="source"]').textContent = manual ? 'Введённые сигналы' : 'Исходный текст';
    document.querySelector('#encrypt').textContent = name === 'morse' ? 'Текст → Морзе' : 'Зашифровать';
    document.querySelector('#decrypt').textContent = name === 'morse' ? 'Ключ → текст' : 'Расшифровать';
    document.querySelector('#encrypt').setAttribute('aria-pressed', String(!decrypt));
    document.querySelector('#decrypt').setAttribute('aria-pressed', String(decrypt));
    for (const button of document.querySelectorAll('[data-cipher]')) button.setAttribute('aria-pressed', String(button.dataset.cipher === name));
    for (const field of document.querySelectorAll('[data-setting]')) field.hidden = field.dataset.setting !== name;
    document.querySelector('#cipher-description').textContent = descriptions[name];
    sourceInput.placeholder = manual ? 'Нажимайте и удерживайте ключ выше' : decrypt ? 'Введите зашифрованный текст' : 'Введите текст';
    updateResult();
  }

  function setMode(value) {
    if (selectedCipher === 'morse') sourceInput.value = '';
    decrypt = value;
    document.querySelector('#encrypt').setAttribute('aria-pressed', String(!value));
    document.querySelector('#decrypt').setAttribute('aria-pressed', String(value));
    selectCipher(selectedCipher);
  }

  function highlight(ids, className) {
    for (const id of ids || []) cellElements.get(id)?.classList.add(className);
  }

  function updateNetwork(values) {
    if (!values) return;
    for (const [id, value] of [['net-left', values.left], ['net-right', values.right], ['net-key', values.key], ['net-new-left', values.newLeft], ['net-new-right', values.newRight]]) document.getElementById(id).textContent = value;
    document.querySelector('#network-detail').textContent = `E(R) = ${values.expanded}; E(R) XOR K = ${values.mixed}; f(R,K) = ${values.f}. Значения показаны в HEX.`;
  }

  async function playSteps(data, runId) {
    for (let index = 0; index < data.steps.length; index++) {
      if (runId !== animationId) return;
      const step = data.steps[index];
      clearHighlight();
      highlight(step.origin, 'origin');
      highlight(step.transit, 'transit');
      const diagram = document.querySelector('#feistel-diagram');
      diagram.classList.toggle('network-input', !!step.feistel);
      diagram.classList.remove('network-output');
      if (step.row !== undefined) {
        for (const cell of tables.querySelectorAll('td')) {
          if (Number(cell.dataset.row) === step.row || Number(cell.dataset.column) === step.column) cell.classList.add('cross-highlight');
        }
      }
      // Прокручивается только большая таблица, положение страницы сохраняется.
      const target = cellElements.get((step.destination || [])[0]);
      if (target) {
        const scroll = target.closest('.large-table');
        if (scroll) {
          const tableRect = scroll.getBoundingClientRect();
          const targetRect = target.getBoundingClientRect();
          scroll.scrollTop += targetRect.top - tableRect.top - scroll.clientHeight / 2;
          scroll.scrollLeft += targetRect.left - tableRect.left - scroll.clientWidth / 2;
        }
      }
      updateNetwork(step.feistel);
      stepStatus.textContent = `${index + 1} / ${data.steps.length} · ${step.detail}`;

      // Сначала показываем исходные данные, затем результат этого шага.
      await wait(250 / Number(speedSlider.value));
      if (runId !== animationId) return;
      highlight(step.destination, 'destination');
      highlight(step.mirror, 'pair-target');
      diagram.classList.remove('network-input');
      diagram.classList.toggle('network-output', !!step.feistel);
      if (step.output !== undefined) resultInput.value = step.output;
      await wait(450 / Number(speedSlider.value));
    }
  }

  async function playMorse(data, runId, sound) {
    if (sound) await window.MorseAudio.prepare();
    if (runId !== animationId) return;
    const label = document.querySelector('#signal-label');
    for (const signal of data.signals) {
      if (runId !== animationId) return;
      clearHighlight();
      const duration = signal.units * 120 / Number(speedSlider.value);
      if (signal.on) {
        const tile = document.querySelector(`[data-signal="${signal.index}"]`);
        if (tile) tile.classList.add('active');
        document.querySelector('#signal-lamp').classList.add('on');
        highlight([`m-${signal.code}`], 'destination');
        label.textContent = `${signal.letter}: ${signal.symbol === '.' ? 'точка' : 'тире'} · ${signal.units} ед.`;
        stepStatus.textContent = `${signal.letter} → ${signal.code}. Сейчас звучит ${signal.symbol === '.' ? 'точка' : 'тире'}.`;
        if (!sound) stepStatus.textContent = `${signal.letter} → ${signal.code}. Сейчас показана ${signal.symbol === '.' ? 'точка' : 'тире'}.`;
        if (sound) window.MorseAudio.tone(duration);
      } else label.textContent = `Пауза · ${signal.units} ед.`;
      await wait(duration);
    }
    window.MorseAudio.stop();
  }

  async function startAnimation() {
    if (isRunning) {
      stopAnimation();
      stepStatus.textContent = 'Остановлено. Повторный запуск — с начала.';
      return;
    }
    if (selectedCipher === 'morse' && decrypt) {
      morseKey.commit();
      morseKey.cancel();
    }
    if (!calculation || !sourceInput.value) return;
    const data = calculation;
    const runId = ++animationId;
    isRunning = true;
    if (selectedCipher !== 'morse' && data.steps.some(function (step) { return step.output !== undefined; })) resultInput.value = '';
    startButton.textContent = 'Остановить';
    try {
      if (selectedCipher === 'morse') await playMorse(data, runId, document.querySelector('#sound').checked);
      else await playSteps(data, runId);
      if (runId !== animationId) return;
      stopAnimation();
      stepStatus.textContent = 'Готово. Все шаги выполнены.';
    } catch (error) {
      if (runId !== animationId) return;
      stopAnimation();
      errorMessage.hidden = false;
      errorMessage.textContent = error.message;
    }
  }

  function insertExample() {
    const examples = { caesar: 'Привет', atbash: 'Привет', scytale: 'ПЕРЕСТАНОВКА', morse: document.querySelector('#morse-language').value === 'ru' ? 'СОС' : 'SOS', polybius: 'МАМА', feistel: '0123456789ABCDEF', digital: 'АНАНАС', vigenere: 'АФРИКА' };
    if (selectedCipher === 'feistel') {
      document.querySelector('#des-format').value = 'hex';
      document.querySelector('#des-key').value = '133457799BBCDFF1';
    }
    if (selectedCipher === 'vigenere') document.querySelector('#vigenere-key').value = 'МАМА';
    try {
      const settings = options();
      settings.decrypt = false;
      sourceInput.value = decrypt ? calculate(examples[selectedCipher], settings).text : examples[selectedCipher];
      updateResult();
    } catch (error) {
      errorMessage.hidden = false;
      errorMessage.textContent = error.message;
    }
  }

  for (const button of document.querySelectorAll('[data-cipher]')) button.addEventListener('click', function () { selectCipher(button.dataset.cipher); });
  document.querySelector('#encrypt').addEventListener('click', function () { setMode(false); });
  document.querySelector('#decrypt').addEventListener('click', function () { setMode(true); });
  sourceInput.addEventListener('input', updateResult);
  document.querySelector('#range').addEventListener('input', function () {
    document.querySelector('#number').value = this.value;
    updateResult();
  });
  document.querySelector('#number').addEventListener('input', function () {
    if (Number.isInteger(Number(this.value)) && Number(this.value) >= 0 && Number(this.value) <= 32 && this.value !== '') document.querySelector('#range').value = this.value;
    updateResult();
  });
  for (const field of document.querySelectorAll('#settings input:not(#range):not(#number), #settings select')) field.addEventListener('input', function () {
    if (this.id === 'morse-language') { morseKey.reset(); sourceInput.value = ''; }
    if (this.id === 'sound') morseKey.cancel();
    updateResult();
  });
  speedSlider.addEventListener('input', function () { document.querySelector('#speed-value').textContent = Number(this.value) + '×'; });
  document.querySelector('#example').addEventListener('click', insertExample);
  document.querySelector('#clear').addEventListener('click', function () { morseKey.reset(); sourceInput.value = ''; updateResult(); (selectedCipher === 'morse' && decrypt ? document.querySelector('#morse-key') : sourceInput).focus(); });
  startButton.addEventListener('click', startAnimation);
  document.addEventListener('visibilitychange', function () {
    if (document.hidden && isRunning) {
      stopAnimation();
      stepStatus.textContent = 'Проигрывание остановлено при скрытии страницы.';
    }
  });
  const morseKey = window.MorseKey.create({
    onPress: stopAnimation,
    onCode: function (code) { sourceInput.value = code; updateResult(); },
    language: function () { return document.querySelector('#morse-language').value; },
    sound: function () { return document.querySelector('#sound').checked; },
  });
  selectCipher('caesar');
})();
