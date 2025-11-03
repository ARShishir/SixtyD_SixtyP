    const textInput = document.getElementById('textInput');
    const genBtn = document.getElementById('genBtn');
    const clearBtn = document.getElementById('clearBtn');
    const qrCanvas = document.getElementById('qrCanvas');
    const qrMeta = document.getElementById('qrMeta');
    const downloadBtn = document.getElementById('downloadBtn');

    let qr;

    function drawQR(data){
      qr = new QRious({
        element: qrCanvas,
        value: data,
        size: 240,
        level: 'H',
        background: 'white',
        foreground: '#000000'
      });
    }

    //Author: Abdur Rahaman Shishir

    genBtn.addEventListener('click', () => {
      const txt = (textInput.value || '').trim();
      if (!txt) { alert('Please enter some text or link.'); return; }
      drawQR(txt);
      // show only first 25 chars for user display, but encode full text
      const display = txt.length > 25 ? txt.slice(0,25)+"..." : txt;
      qrMeta.textContent = `QR generated Ready To Download:`;
      downloadBtn.disabled = false;
    });

    clearBtn.addEventListener('click', () => {
      textInput.value = '';
      const ctx = qrCanvas.getContext('2d');
      ctx.clearRect(0,0,qrCanvas.width,qrCanvas.height);
      qrMeta.textContent = 'No QR yet';
      downloadBtn.disabled = true;
    });

    downloadBtn.addEventListener('click', () => {
      if (!qr) return;
      const a = document.createElement('a');
      a.href = qrCanvas.toDataURL('image/png');
      a.download = 'qr.png';
      a.click();
    });

    // Initial placeholder QR
    drawQR('Welcome to QR Generator Made By Abdur Rahaman Shishir');
    qrMeta.textContent = 'QR ready — enter text to replace.';
