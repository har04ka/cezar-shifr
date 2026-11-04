// Ручной телеграфный ключ: время удержания задаёт точку или тире.
window.MorseKey = (function () {
  function create(settings) {
    const key = document.querySelector('#morse-key');
    const sequence = document.querySelector('#key-sequence');
    const feedback = document.querySelector('#key-feedback');
    const unit = 180;
    let pressed = false;
    let startedAt = 0;
    let pressId = 0;
    let pending = '';
    let message = [];
    let wordGap = false;
    let letterTimer = null;
    let wordTimer = null;
    let clockTimer = null;

    function clearTimers() {
      clearTimeout(letterTimer);
      clearTimeout(wordTimer);
      clearInterval(clockTimer);
    }

    function showPending() {
      sequence.textContent = pending || '—';
    }

    function sendMessage() {
      settings.onCode(message.join(' '));
    }

    function commit() {
      if (!pending) return true;
      const dictionary = window.MorseCipher.dictionary(settings.language());
      const letter = Object.keys(dictionary).find(function (character) { return dictionary[character] === pending; });
      if (!letter) {
        feedback.textContent = `Комбинация ${pending} не найдена. Сотрите букву и повторите.`;
        return false;
      }
      if (wordGap && message.length) message.push('/');
      wordGap = false;
      message.push(pending);
      feedback.textContent = `${pending} → ${letter}. Продолжайте ввод.`;
      pending = '';
      showPending();
      sendMessage();
      return true;
    }

    async function down() {
      if (pressed || key.closest('[hidden]')) return;
      clearTimers();
      pressed = true;
      const currentPress = ++pressId;
      startedAt = performance.now();
      settings.onPress();
      key.classList.add('is-down');
      key.setAttribute('aria-pressed', 'true');
      feedback.textContent = 'Ключ нажат — короткое удержание даст точку.';
      clockTimer = setInterval(function () {
        const elapsed = performance.now() - startedAt;
        key.classList.toggle('is-dash', elapsed >= 2 * unit);
        feedback.textContent = `${(elapsed / 1000).toFixed(2)} с · ${elapsed >= 2 * unit ? 'тире' : 'точка'}`;
      }, 50);
      if (settings.sound()) {
        try {
          await window.MorseAudio.prepare();
          if (pressed && currentPress === pressId) window.MorseAudio.hold();
        } catch (error) {
          if (currentPress === pressId) feedback.textContent = 'Звук недоступен, ввод работает без него.';
        }
      }
    }

    function release(cancelled = false) {
      if (!pressed) return;
      const elapsed = performance.now() - startedAt;
      pressed = false;
      pressId++;
      clearTimers();
      window.MorseAudio.stop();
      key.classList.remove('is-down', 'is-dash');
      key.setAttribute('aria-pressed', 'false');
      if (cancelled) {
        feedback.textContent = 'Нажатие отменено. Продолжайте ввод.';
        return;
      }
      const symbol = elapsed >= 2 * unit ? '-' : '.';
      pending += symbol;
      showPending();
      feedback.textContent = `${symbol === '.' ? 'Точка' : 'Тире'} добавлена. Пауза завершит букву.`;
      letterTimer = setTimeout(commit, 3 * unit);
      wordTimer = setTimeout(function () {
        if (!pending && message.length) {
          wordGap = true;
          feedback.textContent = 'Пауза между словами. Следующая буква начнёт новое слово.';
        }
      }, 7 * unit);
    }

    function reset() {
      release(true);
      pressId++;
      clearTimers();
      pending = '';
      message = [];
      wordGap = false;
      showPending();
      feedback.textContent = 'Нажмите ключ мышью, пальцем или удерживайте пробел на выбранной кнопке.';
    }

    key.addEventListener('pointerdown', function (event) {
      if (event.button !== 0 || pressed) return;
      event.preventDefault();
      key.focus({ preventScroll: true });
      key.setPointerCapture(event.pointerId);
      down();
    });
    key.addEventListener('pointerup', function () { release(); });
    key.addEventListener('pointercancel', function () { release(true); });
    key.addEventListener('lostpointercapture', function () { release(true); });
    key.addEventListener('keydown', function (event) {
      if (event.code !== 'Space' && event.code !== 'Enter') return;
      event.preventDefault();
      if (!event.repeat) down();
    });
    key.addEventListener('keyup', function (event) {
      if (event.code !== 'Space' && event.code !== 'Enter') return;
      event.preventDefault();
      release();
    });
    key.addEventListener('contextmenu', function (event) { event.preventDefault(); });
    key.addEventListener('blur', function () { release(true); });
    document.querySelector('#key-commit').addEventListener('click', function () { clearTimers(); commit(); });
    document.querySelector('#key-space').addEventListener('click', function () {
      clearTimers();
      if (commit()) { wordGap = message.length > 0; feedback.textContent = 'Следующая буква начнёт новое слово.'; }
    });
    document.querySelector('#key-delete').addEventListener('click', function () {
      clearTimers();
      if (pending) pending = '';
      else { message.pop(); if (message[message.length - 1] === '/') message.pop(); }
      wordGap = false;
      showPending();
      sendMessage();
      feedback.textContent = 'Последняя буква удалена.';
    });
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { release(true); clearTimers(); }
    });
    reset();
    return { reset, commit, cancel: function () { release(true); clearTimers(); } };
  }
  return { create };
})();
