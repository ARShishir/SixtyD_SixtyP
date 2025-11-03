 const fileInput = document.getElementById('audioFileInput');
    const playPauseBtn = document.getElementById('playPauseBtn');
    const currentTimeElem = document.getElementById('currentTime');
    const durationElem = document.getElementById('duration');
    const canvas = document.getElementById('visualizer');
    const ctx = canvas.getContext('2d');

    let audioContext;
    let audioElement;
    let sourceNode;
    let analyser;
    let dataArray;
    let animationId;
    let isPlaying = false;

    // Resize canvas to fit container
    function resizeCanvas() {
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    function formatTime(seconds) {
      const min = Math.floor(seconds / 60);
      const sec = Math.floor(seconds % 60);
      return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
    }

    fileInput.addEventListener('change', () => {
      const files = fileInput.files;
      if (!files.length) return;

      if (audioContext) {
        // Cleanup previous audio context & element if any
        cancelAnimationFrame(animationId);
        if (audioElement) {
          audioElement.pause();
          audioElement.src = '';
        }
        audioContext.close().catch((err) => console.error('Error closing AudioContext:', err));
      }

      audioElement = new Audio(URL.createObjectURL(files[0]));
      audioElement.crossOrigin = "anonymous";

      try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
      } catch (err) {
        console.error('Error creating AudioContext:', err);
        return;
      }

      try {
        sourceNode = audioContext.createMediaElementSource(audioElement);
        analyser = audioContext.createAnalyser();

        analyser.fftSize = 256;
        const bufferLength = analyser.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);

        sourceNode.connect(analyser);
        analyser.connect(audioContext.destination);

        playPauseBtn.disabled = false;
        playPauseBtn.textContent = 'Play';

        audioElement.addEventListener('loadedmetadata', () => {
          durationElem.textContent = formatTime(audioElement.duration);
          currentTimeElem.textContent = '00:00';
        });

        audioElement.addEventListener('timeupdate', () => {
          currentTimeElem.textContent = formatTime(audioElement.currentTime);
        });

        audioElement.addEventListener('ended', () => {
          playPauseBtn.textContent = 'Play';
          isPlaying = false;
          cancelAnimationFrame(animationId);
          clearCanvas();
        });

        audioElement.addEventListener('error', (err) => {
          console.error('Audio error:', err);
          playPauseBtn.disabled = true;
          playPauseBtn.textContent = 'Play';
          isPlaying = false;
          cancelAnimationFrame(animationId);
          clearCanvas();
        });
      } catch (err) {
        console.error('Error setting up audio nodes:', err);
        playPauseBtn.disabled = true;
      }
    });

    playPauseBtn.addEventListener('click', () => {
      if (!audioContext) return;

      if (audioContext.state === 'suspended') {
        audioContext.resume().catch((err) => console.error('Error resuming AudioContext:', err));
      }

      if (!isPlaying) {
        audioElement.play().catch((err) => {
          console.error('Error playing audio:', err);
          playPauseBtn.textContent = 'Play';
          isPlaying = false;
        });
        isPlaying = true;
        playPauseBtn.textContent = 'Pause';
        drawVisualizer();
      } else {
        audioElement.pause();
        isPlaying = false;
        playPauseBtn.textContent = 'Play';
        cancelAnimationFrame(animationId);
      }
    });

    function clearCanvas() {
      ctx.fillStyle = '#222';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    function drawVisualizer() {
      animationId = requestAnimationFrame(drawVisualizer);

      analyser.getByteFrequencyData(dataArray);
// Author: Abdur Rahaman Shishir
      clearCanvas();

      const barWidth = (canvas.width / dataArray.length) * 2.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < dataArray.length; i++) {
        barHeight = dataArray[i];

        // Color based on height: from blue to red
        const red = Math.min(255, barHeight + 100);
        const green = 50;
        const blue = Math.max(0, 255 - barHeight);

        ctx.fillStyle = `rgb(${red}, ${green}, ${blue})`;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

        x += barWidth + 1;
      }
    }

    // Initial canvas background
    clearCanvas();