 function appendToDisplay(value) {
      document.getElementById('display').value += value;
    }

    function clearDisplay() {
      document.getElementById('display').value = '';
    }

    function calculate() {
      const display = document.getElementById('display');
      try {
        // Safer evaluation using Function constructor
        const result = Function('return ' + display.value)();
        display.value = isFinite(result) ? result : 'Error';
      } catch (error) {
        display.value = 'Error';
      }
    }
    //Author: Abdur Rahaman Shishir| shishir01022003@gmail.com
