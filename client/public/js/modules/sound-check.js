/**
 * Module: Sound & Microphone Calibration Check
 */

function initSoundCheckModule(onComplete) {
  const container = document.getElementById('sound-check-screen');
  const btnPlaySound = document.getElementById('btn-play-test-sound');
  const btnGrantMic = document.getElementById('btn-grant-mic');
  const micStatusTag = document.getElementById('mic-status-tag');
  const micBar = document.getElementById('mic-level-fill');
  const btnContinue = document.getElementById('btn-sound-continue');

  container.style.display = 'block';

  let micGranted = false;
  let micMeterInterval = null;

  btnPlaySound.onclick = () => {
    window.audioEngine.playChime('start');
  };

  btnGrantMic.onclick = async () => {
    btnGrantMic.disabled = true;
    btnGrantMic.textContent = 'Requesting access...';

    const granted = await window.audioEngine.requestMicPermission();
    if (granted) {
      micGranted = true;
      micStatusTag.textContent = 'Microphone Connected & Active';
      micStatusTag.style.color = '#28a745';
      btnGrantMic.textContent = 'Mic Calibrated ✓';
      btnContinue.disabled = false;

      // Start VU meter polling
      const dataArray = new Uint8Array(window.audioEngine.analyser.frequencyBinCount);
      micMeterInterval = setInterval(() => {
        window.audioEngine.analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
        const average = sum / dataArray.length;
        const percent = Math.min(100, Math.round((average / 128) * 100));
        micBar.style.width = `${percent}%`;
      }, 50);
    } else {
      micStatusTag.textContent = 'Microphone permission denied. Speaking test requires audio input.';
      micStatusTag.style.color = '#d73a49';
      btnGrantMic.disabled = false;
      btnGrantMic.textContent = 'Retry Mic Permission';
    }
  };

  btnContinue.onclick = () => {
    if (micMeterInterval) clearInterval(micMeterInterval);
    container.style.display = 'none';
    if (onComplete) onComplete();
  };
}

window.initSoundCheckModule = initSoundCheckModule;
