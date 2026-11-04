// Звук создаётся только после нажатия «Начать».
window.MorseAudio = (function () {
  let context = null;
  let oscillator = null;

  async function prepare() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) throw new Error('Этот браузер не поддерживает Web Audio. Отключите звук для визуального проигрывания.');
    if (!context || context.state === 'closed') context = new AudioContextClass();
    await context.resume();
    if (context.state !== 'running') throw new Error('Браузер заблокировал звук. Разрешите звук для сайта или отключите его в настройках Морзе.');
  }

  function stop() {
    if (oscillator) {
      try { oscillator.stop(); } catch (error) { /* Сигнал уже завершился. */ }
      oscillator = null;
    }
  }

  function tone(milliseconds) {
    if (!context || context.state !== 'running') return;
    stop();
    const sound = context.createOscillator();
    const gain = context.createGain();
    const now = context.currentTime;
    const duration = milliseconds / 1000;
    sound.type = 'sine';
    sound.frequency.value = 600;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.1, now + 0.005);
    gain.gain.setValueAtTime(0.1, now + Math.max(0.005, duration - 0.005));
    gain.gain.linearRampToValueAtTime(0, now + duration);
    sound.connect(gain);
    gain.connect(context.destination);
    oscillator = sound;
    sound.onended = function () {
      sound.disconnect();
      gain.disconnect();
      if (oscillator === sound) oscillator = null;
    };
    sound.start(now);
    sound.stop(now + duration);
  }
  return { prepare, tone, stop };
})();
