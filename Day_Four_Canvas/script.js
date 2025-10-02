    const canvas = document.getElementById("drawCanvas");
    const ctx = canvas.getContext("2d");
    const colorPicker = document.getElementById("colorPicker");
    const brushSize = document.getElementById("brushSize");
    const eraserBtn = document.getElementById("eraserBtn");
    const themeBtn = document.getElementById("themeBtn");
    
    let isDrawing = false;
    let eraserMode = false;
    let history = [];
    let redoStack = [];
    let lastX = 0;
    let lastY = 0;

    // Initialize canvas
    function initializeCanvas() {
      ctx.fillStyle = getComputedStyle(canvas).backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      saveState();
    }

    // Drawing helpers
    function getPos(e) {
      const rect = canvas.getBoundingClientRect();
      if (e.touches) {
        return {
          x: e.touches[0].clientX - rect.left,
          y: e.touches[0].clientY - rect.top
        };
      } else {
        return { 
          x: e.clientX - rect.left, 
          y: e.clientY - rect.top 
        };
      }
    }

    function startDrawing(e) {
      isDrawing = true;
      const pos = getPos(e);
      [lastX, lastY] = [pos.x, pos.y];
      
      // Save state only when starting a new stroke
      saveState();
      
      ctx.beginPath();
      ctx.moveTo(lastX, lastY);
    }
// Author: Abdur Rahaman Shishir 
    function draw(e) {
      if (!isDrawing) return;
      
      const pos = getPos(e);
      
      ctx.lineTo(pos.x, pos.y);
      
      if (eraserMode) {
        // Use the current canvas background color for erasing
        ctx.strokeStyle = getComputedStyle(canvas).backgroundColor;
      } else {
        ctx.strokeStyle = colorPicker.value;
      }
      
      ctx.lineWidth = brushSize.value;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();
      
      [lastX, lastY] = [pos.x, pos.y];
    }

    function stopDrawing() {
      isDrawing = false;
      ctx.closePath();
    }

    // Event listeners
    canvas.addEventListener("mousedown", startDrawing);
    canvas.addEventListener("mousemove", draw);
    canvas.addEventListener("mouseup", stopDrawing);
    canvas.addEventListener("mouseleave", stopDrawing);

    canvas.addEventListener("touchstart", e => {
      e.preventDefault();
      startDrawing(e);
    });
    canvas.addEventListener("touchmove", e => {
      e.preventDefault();
      draw(e);
    });
    canvas.addEventListener("touchend", stopDrawing);

    // Utility functions
    function clearCanvas() {
      saveState();
      ctx.fillStyle = getComputedStyle(canvas).backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    function saveImage() {
      const link = document.createElement("a");
      link.download = "drawing.png";
      link.href = canvas.toDataURL();
      link.click();
    }

    function toggleEraser() {
      eraserMode = !eraserMode;
      eraserBtn.classList.toggle("active", eraserMode);
      eraserBtn.textContent = eraserMode ? "🧽 Eraser On" : "✏️ Eraser";
      
      // Update cursor to indicate eraser mode
      canvas.style.cursor = eraserMode ? "cell" : "crosshair";
    }

    // Undo/Redo
    function saveState() {
      if (history.length >= 20) history.shift(); // limit history
      history.push(canvas.toDataURL());
      redoStack = []; // clear redo on new action
    }

    function undo() {
      if (history.length > 0) {
        redoStack.push(canvas.toDataURL());
        const lastState = history.pop();
        let img = new Image();
        img.onload = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
        };
        img.src = lastState;
      }
    }

    function redo() {
      if (redoStack.length > 0) {
        history.push(canvas.toDataURL());
        const nextState = redoStack.pop();
        let img = new Image();
        img.onload = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
        };
        img.src = nextState;
      }
    }

    function toggleDarkMode() {
      const body = document.body;
      const isDark = body.dataset.theme === "dark";
      body.dataset.theme = isDark ? "light" : "dark";
      themeBtn.textContent = isDark ? "🌙 Dark Mode" : "☀️ Light Mode";
      
      // Update canvas background when theme changes
      if (!isDrawing) {
        ctx.fillStyle = getComputedStyle(canvas).backgroundColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        // Redraw the last state to maintain drawing
        if (history.length > 0) {
          const lastState = history[history.length - 1];
          let img = new Image();
          img.onload = () => {
            ctx.drawImage(img, 0, 0);
          };
          img.src = lastState;
        }
      }
    }

    // Responsive resize
    function resizeCanvas() {
      const container = document.querySelector(".container");
      const width = container.offsetWidth - 40;
      const ratio = canvas.height / canvas.width;
      canvas.width = width;
      canvas.height = width * ratio;
      
      // Redraw the last state after resize
      if (history.length > 0) {
        const lastState = history[history.length - 1];
        let img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 0, 0);
        };
        img.src = lastState;
      } else {
        initializeCanvas();
      }
    }

    // Initialize the app
    window.addEventListener("resize", resizeCanvas);
    window.addEventListener("load", () => {
      initializeCanvas();
      resizeCanvas();
    });