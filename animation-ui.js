// Presentation of the active letter; cipher algorithms stay independent.
window.CipherDemonstration = (() => {
  function create() {
    const element = document.createElement('div');
    element.className = 'demonstration';
    const top = document.createElement('div');
    top.className = 'demo-top';
    const label = document.createElement('span');
    const counter = document.createElement('span');
    top.append(label, counter);
    const pair = document.createElement('div');
    pair.className = 'demo-pair';
    const from = document.createElement('span');
    from.className = 'demo-letter demo-from';
    const connector = document.createElement('span');
    connector.className = 'demo-connector';
    connector.setAttribute('aria-hidden', 'true');
    connector.textContent = '→';
    const to = document.createElement('span');
    to.className = 'demo-letter demo-to';
    pair.append(from, connector, to);
    const meter = document.createElement('progress');
    meter.className = 'demo-progress';
    meter.setAttribute('aria-label', 'Прогресс преобразования текста');
    element.append(top, pair, meter);
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let activeMotion;

    function reset() {
      activeMotion?.cancel();
      element.classList.remove('is-playing', 'is-complete', 'has-result');
      label.textContent = 'Посмотрите, как меняется каждая буква';
      counter.textContent = '';
      from.textContent = to.textContent = '—';
      meter.max = 1;
      meter.value = 0;
    }
    reset();
    return {
      element,
      reset,
      begin(total) {
        reset();
        element.classList.add('is-playing');
        meter.max = Math.max(total, 1);
      },
      character(letter, index, total, description) {
        element.classList.remove('has-result');
        label.textContent = description;
        counter.textContent = `${index + 1} / ${total}`;
        from.textContent = letter === ' ' ? '␣' : letter === '\n' ? '↵' : letter;
        to.textContent = '·';
      },
      replacement(letter, complete) {
        const display = letter === ' ' ? '␣' : letter === '\n' ? '↵' : letter;
        if (to.textContent !== display && !reducedMotion.matches) {
          activeMotion?.cancel();
          activeMotion = to.animate([
            { opacity: 0.35, transform: 'translateY(5px) scale(.94)' },
            { opacity: 1, transform: 'translateY(0) scale(1)' },
          ], { duration: 180, easing: 'cubic-bezier(.2,.7,.2,1)' });
        }
        to.textContent = display;
        element.classList.toggle('has-result', complete);
      },
      advance(count) { meter.value = count; },
      pause() {
        element.classList.remove('is-playing');
        label.textContent = 'Остановлено · «Начать» запустит заново';
      },
      finish() {
        element.classList.remove('is-playing');
        element.classList.add('is-complete');
        label.textContent = 'Готово — текст преобразован';
      },
    };
  }
  return { create };
})();
