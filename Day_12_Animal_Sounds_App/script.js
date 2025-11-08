
        // Animal data
        const animals = [
            { id: 1, name: "Cat", emoji: "🐱", sound: "meow", key: "1" },
            { id: 2, name: "Dog", emoji: "🐶", sound: "woof", key: "2" },
            { id: 3, name: "Cow", emoji: "🐮", sound: "moo", key: "3" },
            { id: 4, name: "Lion", emoji: "🦁", sound: "roar", key: "4" },
            { id: 5, name: "Duck", emoji: "🦆", sound: "quack", key: "5" },
            { id: 6, name: "Sheep", emoji: "🐑", sound: "baa", key: "6" },
            { id: 7, name: "Frog", emoji: "🐸", sound: "ribbit", key: "7" },
            { id: 8, name: "Elephant", emoji: "🐘", sound: "trumpet", key: "8" },
            { id: 9, name: "Monkey", emoji: "🐵", sound: "ooh-ooh", key: "9" },
            { id: 10, name: "Rooster", emoji: "🐔", sound: "cock-a-doodle-doo", key: "0" },
            { id: 11, name: "Owl", emoji: "🦉", sound: "hoot", key: "q" },
            { id: 12, name: "Wolf", emoji: "🐺", sound: "howl", key: "w" }
        ];

        // Audio context for sound generation
        let audioContext;
        let oscillators = {}; // To track active oscillators for stopping

        // Initialize the app
        function init() {
            createAnimalCards();
            setupEventListeners();
            setupAudioContext();
        }

        // Create animal cards dynamically
        function createAnimalCards() {
            const container = document.getElementById('animals-container');
            
            animals.forEach(animal => {
                const card = document.createElement('div');
                card.className = 'animal-card';
                card.dataset.id = animal.id;
                card.dataset.key = animal.key;
                
                card.innerHTML = `
                    <div class="animal-emoji">${animal.emoji}</div>
                    <div class="animal-name">${animal.name}</div>
                    <div class="key-shortcut">Press "${animal.key.toUpperCase()}"</div>
                `;
                
                container.appendChild(card);
            });
        }
        
        // Set up event listeners
        function setupEventListeners() {
            // Click events for animal cards
            document.querySelectorAll('.animal-card').forEach(card => {
                card.addEventListener('click', function() {
                    const animalId = parseInt(this.dataset.id);
                    playAnimalSound(animalId);
                });
            });
            //         Author:Abdur Rahaman Shishir

            // Keyboard events
            document.addEventListener('keydown', function(event) {
                const key = event.key.toLowerCase();
                const animal = animals.find(a => a.key === key);
                
                if (animal) {
                    playAnimalSound(animal.id);
                }
            });
            
            // Control buttons
            document.getElementById('play-all-btn').addEventListener('click', playAllSounds);
            document.getElementById('stop-all-btn').addEventListener('click', stopAllSounds);
        }

        // Set up audio context for sound generation
        function setupAudioContext() {
            try {
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
            } catch (e) {
                console.error('Web Audio API is not supported in this browser');
            }
        }

        // Play animal sound
        function playAnimalSound(animalId) {
            const animal = animals.find(a => a.id === animalId);
            if (!animal) return;
            
            // Visual feedback
            const card = document.querySelector(`.animal-card[data-id="${animalId}"]`);
            card.classList.add('playing');
            setTimeout(() => card.classList.remove('playing'), 500);
            
            // Generate sound based on animal type
            generateAnimalSound(animal);
        }

        // Generate animal sound using Web Audio API
        function generateAnimalSound(animal) {
            if (!audioContext) return;
            
            // Stop any existing oscillator for this animal
            if (oscillators[animal.id]) {
                oscillators[animal.id].stop();
            }
            
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            // Set oscillator type and frequency based on animal
            let frequency = 200;
            let type = 'sine';
            
            switch(animal.sound) {
                case 'meow':
                    frequency = 500;
                    type = 'sawtooth';
                    break;
                case 'woof':
                    frequency = 100;
                    type = 'square';
                    break;
                case 'moo':
                    frequency = 150;
                    type = 'sawtooth';
                    break;
                case 'roar':
                    frequency = 80;
                    type = 'sawtooth';
                    break;
                case 'quack':
                    frequency = 800;
                    type = 'square';
                    break;
                case 'baa':
                    frequency = 300;
                    type = 'sine';
                    break;
                case 'ribbit':
                    frequency = 400;
                    type = 'triangle';
                    break;
                case 'trumpet':
                    frequency = 250;
                    type = 'sawtooth';
                    break;
                case 'ooh-ooh':
                    frequency = 600;
                    type = 'sine';
                    break;
                case 'cock-a-doodle-doo':
                    frequency = 700;
                    type = 'sawtooth';
                    break;
                case 'hoot':
                    frequency = 350;
                    type = 'sine';
                    break;
                case 'howl':
                    frequency = 200;
                    type = 'sawtooth';
                    break;
            }
            
            oscillator.type = type;
            oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
            
            // Set gain envelope
            gainNode.gain.setValueAtTime(0, audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.5, audioContext.currentTime + 0.1);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 1);
            
            // Store oscillator for potential stopping
            oscillators[animal.id] = oscillator;
            
            // Remove from oscillators object when done
            oscillator.onended = () => {
                delete oscillators[animal.id];
            };
        }

        // Play all animal sounds in sequence
        function playAllSounds() {
            animals.forEach((animal, index) => {
                setTimeout(() => {
                    playAnimalSound(animal.id);
                }, index * 1200); // 1.2 seconds between each sound
            });
        }

        // Stop all currently playing sounds
        function stopAllSounds() {
            Object.values(oscillators).forEach(oscillator => {
                try {
                    oscillator.stop();
                } catch(e) {
                    // Oscillator might have already stopped
                }
            });
            oscillators = {};
        }

        // Initialize the app when the page loads
        window.addEventListener('DOMContentLoaded', init);
