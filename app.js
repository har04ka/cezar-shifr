
      (() => {
        const { russianAlphabet, englishAlphabet } = window.CaesarCipher;
        let cipherType = 'caesar';
        const transformText = (text, shift) => cipherType === 'atbash'
          ? window.AtbashCipher.transformText(text)
          : window.CaesarCipher.transformText(text, shift, direction);

        const source = document.querySelector('#source');
        const result = document.querySelector('#result');
        const range = document.querySelector('#range');
        const number = document.querySelector('#number');
        const status = document.querySelector('#status');
        const encryptButton = document.querySelector('#encrypt');
        const decryptButton = document.querySelector('#decrypt');

        let direction = 1;
        let animationVersion = 0;
        const animation = document.createElement('div');
        animation.classList.add('animation-animation');
        const play = document.querySelector('#start');
        play.type = 'button';
        play.textContent = 'Начать';
        play.classList.add('animation-play');
        const frame = document.createElement('div');
        frame.classList.add('animation-frame');
        frame.setAttribute('role', 'status');

        function makeRow(text) {
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
        function caption(text) {
          const label = document.createElement('div');
          label.className = 'cipher-caption';
          label.textContent = text;
          return label;
        }
        const russianRow = makeRow(russianAlphabet);
        russianRow.className = 'alphabet-grid';
        const englishRow = makeRow(englishAlphabet);
        englishRow.className = 'alphabet-grid latin';
        for (const [row, alphabet] of [[russianRow, russianAlphabet], [englishRow, englishAlphabet]]) {
          Array.from(row.children).forEach((tile, index) => {
            tile.dataset.mirror = alphabet[alphabet.length - 1 - index];
          });
        }
        function clearAlphabetHighlight() {
          [...russianRow.children, ...englishRow.children].forEach(tile => tile.classList.remove('current', 'origin', 'transit', 'destination', 'pair-target'));
        }
        const controls = document.createElement('div');
        controls.className = 'animation-controls';
        const speedLabel = document.createElement('label');
        speedLabel.className = 'animation-speed';
        const speed = document.createElement('input');
        speed.type = 'range';
        speed.min = '0.25';
        speed.max = '3';
        speed.step = '0.25';
        speed.value = '1';
        speed.setAttribute('aria-label', 'Скорость анимации');
        const speedValue = document.createElement('output');
        speedValue.textContent = '1×';
        speed.addEventListener('input', () => {
          speedValue.textContent = `${Number(speed.value)}×`;
        });
        speedLabel.append('Скорость', speed, speedValue);
        controls.append(speedLabel, play);
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
        const animationDelay = (milliseconds) => new Promise(resolve => setTimeout(resolve, milliseconds / Number(speed.value)));
        animation.append(legend, caption('Русский алфавит'), russianRow, caption('Латинский алфавит'), englishRow, frame);
        document.querySelector('section').append(animation);
        let running = false;

        play.addEventListener('click', async () => {
          const version = ++animationVersion;
          if (running) {
            running = false;
            clearAlphabetHighlight();
            play.textContent = 'Начать';
            return;
          }
          running = true;
          play.textContent = 'Остановить';
          let completed = '';
          const characters = Array.from(source.value);
          const progress = document.createElement('span');
          frame.replaceChildren(progress);
          for (let i = 0; i < characters.length; i++) {
            if (version !== animationVersion) return;
            const character = characters[i];
            const upper = character.toLocaleUpperCase('ru');
            const alphabet = russianAlphabet.includes(upper) ? russianAlphabet : englishAlphabet.includes(upper) ? englishAlphabet : '';
            const steps = alphabet ? Number(range.value) % alphabet.length : 0;
            clearAlphabetHighlight();
            const alphabetRow = alphabet === russianAlphabet ? russianRow : englishRow;
            const originIndex = alphabet.indexOf(upper);
            if (cipherType === 'atbash') {
              if (alphabet) alphabetRow.children[originIndex].classList.add('origin');
              progress.textContent = alphabet ? `${character} — ищем букву в верхнем алфавите` : `${character === ' ' ? 'Пробел' : character} — символ не изменяется`;
              await animationDelay(450);
              if (version !== animationVersion) return;
              if (alphabet) {
                alphabetRow.children[originIndex].classList.add('pair-target');
              }
              const replacement = transformText(character);
              progress.textContent = alphabet ? `${character} → ${replacement} · зеркальная пара: ${originIndex + 1} ↔ ${alphabet.length - originIndex}` : 'Этот символ остаётся без изменений';
              completed += replacement;
              await animationDelay(800);
              continue;
            }
            for (let step = 0; step <= steps; step++) {
              if (version !== animationVersion) return;
              const index = alphabet ? (alphabet.indexOf(upper) + direction * step + alphabet.length) % alphabet.length : 0;
              const current = alphabet ? alphabet[index] : character;
              Array.from(alphabetRow.children).forEach((tile, tileIndex) => {
                tile.classList.toggle('origin', Boolean(alphabet) && tileIndex === originIndex);
                tile.classList.toggle('transit', Boolean(alphabet) && tileIndex === index && step > 0 && step < steps);
                tile.classList.toggle('destination', Boolean(alphabet) && tileIndex === index && step === steps);
              });
              progress.textContent = alphabet ? `${character} → ${current} · шаг ${step} из ${steps}` : 'Этот символ остаётся без изменений';
              await animationDelay(steps ? Math.max(150, 900 / steps) : 250);
            }
            if (version !== animationVersion) return;
            completed += transformText(character, Number(range.value));
            await animationDelay(450);
          }
          if (version !== animationVersion) return;
          progress.textContent = completed ? 'Готово — все буквы заменены' : 'Введите текст для анимации';
          clearAlphabetHighlight();
          running = false;
          play.textContent = 'Начать';
        });

        function update() {
          clearAlphabetHighlight();
          animationVersion++;
          running = false;
          frame.textContent = '';
          play.disabled = !source.value;
          play.textContent = 'Начать';
          const shift = Math.max(
            0,
            Math.min(32, Math.trunc(Number(range.value) || 0)),
          );

          range.value = number.value = shift;
          result.value = transformText(source.value, shift);
          status.textContent = '';
        }

        function setMode(value) {
          direction = value;
          encryptButton.setAttribute('aria-pressed', String(value === 1));
          decryptButton.setAttribute('aria-pressed', String(value === -1));
          update();
        }

        range.addEventListener('input', () => {
          number.value = range.value;
          update();
        });

        number.addEventListener('input', () => {
          if (number.value === '') {
            return;
          }

          range.value = String(
            Math.max(0, Math.min(32, Math.trunc(Number(number.value) || 0))),
          );
          update();
        });

        number.addEventListener('change', () => {
          range.value = String(
            Math.max(0, Math.min(32, Math.trunc(Number(number.value) || 0))),
          );
          update();
        });

        source.addEventListener('input', update);
        encryptButton.addEventListener('click', () => setMode(1));
        decryptButton.addEventListener('click', () => setMode(-1));

        function selectCipher(type) {
          cipherType = type;
          const isAtbash = type === 'atbash';
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
          update();
        }

        document.querySelector('#caesar-choice').addEventListener('click', () => selectCipher('caesar'));
        document.querySelector('#atbash-choice').addEventListener('click', () => selectCipher('atbash'));

        document.querySelector('#clear').addEventListener('click', () => {
          source.value = '';
          update();
          source.focus();
        });


        update();
      })();
    
