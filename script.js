class Stopwatch {
    constructor() {
        this.nextPlayerPhrases = [
            "Next up,",
            "Your turn,",
            "Get ready,",
            "Let's go,"
        ];

        this.display = document.querySelector('.display');
        this.recordDisplay = document.querySelector('.record');
        this.toggleBtn = document.getElementById('toggleBtn');
        this.deleteBtn = document.getElementById('deleteBtn');
        
        // Preload all sounds
        this.startSound = new Audio('sounds/start.mp3?v=1.0');
        this.runningSound = new Audio('sounds/running.mp3?v=1.0');
        this.recordBrokenSound = new Audio('sounds/record-broken.mp3?v=1.0');
        this.recordSetSound = new Audio('sounds/record-set.mp3?v=1.0');
        this.recordNotBrokenSounds = [
            new Audio('sounds/record-not-broken-1.mp3?v=1.0'),
            new Audio('sounds/record-not-broken-2.mp3?v=1.0')
        ];
        this.resetSound = new Audio('sounds/reset.mp3?v=1.0');
        
        // Add loading overlay reference
        this.loadingOverlay = document.querySelector('.loading-overlay');
        
        // Track loading status of all sounds
        this.soundsLoaded = 0;
        this.totalSounds = 7; // Updated to 7 to include record-set sound
        
        // Add load event listeners to all sounds
        this.startSound.addEventListener('canplaythrough', () => this.handleSoundLoaded());
        this.runningSound.addEventListener('canplaythrough', () => this.handleSoundLoaded());
        this.recordBrokenSound.addEventListener('canplaythrough', () => this.handleSoundLoaded());
        this.recordSetSound.addEventListener('canplaythrough', () => this.handleSoundLoaded());
        this.recordNotBrokenSounds.forEach(sound => {
            sound.addEventListener('canplaythrough', () => this.handleSoundLoaded());
        });
        this.resetSound.addEventListener('canplaythrough', () => this.handleSoundLoaded());
        
        // Trigger loads
        this.startSound.load();
        this.runningSound.load();
        this.recordBrokenSound.load();
        this.recordSetSound.load();
        this.resetSound.load();
        this.recordNotBrokenSounds.forEach(sound => sound.load());
        
        this.time = 0;
        this.interval = null;
        this.isRunning = false;
        
        this.bestTime = null;
        
        this.initializeEventListeners();
        // Add keyboard controls
        document.addEventListener('keydown', (e) => {
            // Check if options dialog is open
            if (this.optionsDialog.classList.contains('active')) {
                return; // Exit early if options dialog is open
            }

            // Check if the pressed key is spacebar and not inside an input field
            if (e.code === 'Space' && e.target.tagName !== 'INPUT') {
                e.preventDefault(); // Prevent page scrolling
                if (this.isRunning) {
                    this.stop();
                } else {
                    this.start();
                }
            }
            // Add "r" key shortcut for deleting record
            if (e.code === 'KeyR' && !this.isRunning && this.bestTime !== null) {
                this.resetRecord();
            }
            // Add "o" key shortcut for opening options
            if (e.code === 'KeyO' && !this.isRunning && e.target.tagName !== 'INPUT') {
                this.optionsDialog.classList.add('active');
            }
        });

        // Add timeout for loading
        this.loadingTimeout = setTimeout(() => {
            console.log('Loading timed out - forcing start');
            this.forceStart();
        }, 5000); // 5 second timeout

        // Add error handlers to sounds
        const handleError = (e) => {
            console.error('Error loading sound:', e);
            this.handleSoundLoaded(); // Count error as "loaded" to prevent infinite loading
        };

        this.startSound.addEventListener('error', handleError);
        this.runningSound.addEventListener('error', handleError);
        this.recordBrokenSound.addEventListener('error', handleError);
        this.recordSetSound.addEventListener('error', handleError);
        this.recordNotBrokenSounds.forEach(sound => {
            sound.addEventListener('error', handleError);
        });
        this.resetSound.addEventListener('error', handleError);

        // Challenge suggestions - alternating between endurance and speed challenges
        this.challenges = [
            // Endurance
            "Watch how long your friend can stand on one foot! 🦶",
            // Speed
            "Track them racing to tie their shoes! 👟",
            // Endurance
            "See how long they can hold a plank! 💪",
            // Speed
            "Clock them solving a Rubik's cube! 🎲",
            // Endurance
            "Measure their hula hooping streak! 🔄",
            // Speed
            "Count how fast they can stack 10 cups! 🥤",
            // Endurance
            "Challenge someone to balance a spoon! 🥄",
            // Speed
            "Record their origami crane folding speed! 🦢",
            // Endurance
            "Test who can whistle the longest! 😙",
            // Speed
            "Measure how quickly they sort cards! 🃏",
            // Endurance
            "Track their underwater breath hold! 🌊",
            // Speed
            "Count how fast they do 20 jumping jacks! 🏃‍♂️",
            // Endurance
            "See how long they keep a balloon afloat! 🎈"
        ];
        
        this.currentChallengeIndex = -1;
        this.challengeText = document.querySelector('.challenge-text');
        this.rotateChallenges();
        
        // Start challenge rotation
        this.challengeInterval = setInterval(() => this.rotateChallenges(), 5000);

        // Set default value BEFORE loading preferences
        this.shorterIsBetter = false;  // Default to "Higher time wins"
        
        // Options dialog elements
        this.optionsBtn = document.getElementById('optionsBtn');
        this.optionsDialog = document.getElementById('optionsDialog');
        this.closeOptionsBtn = document.getElementById('closeOptionsBtn');
        
        // Initialize options dialog events
        this.initializeOptionsDialog();
        
        // Initialize the DOM elements first
        this.initialsInput = document.getElementById('playerInitials');
        
        // Load saved initials before loading other preferences
        const savedInitials = localStorage.getItem('playerInitials');
        this.playerInitials = savedInitials || '';
        
        // Set the input value immediately if element exists
        if (this.initialsInput) {
            this.initialsInput.value = this.playerInitials;
        }

        // Initialize the initials input handlers
        this.initializeInitialsInput();

        // Load additional players
        this.additionalPlayers = JSON.parse(localStorage.getItem('additionalPlayers') || '[]');
        this.maxPlayers = 5; // Maximum total players (including main player)
        
        // Add new properties for player turn tracking
        this.currentPlayerIndex = 0; // Start with main player
        this.allPlayers = []; // Will hold main player + additional players
        
        // Load preferences (including record type)
        this.loadPreferences();
        
        // Initialize additional players UI
        this.initializeAdditionalPlayers();
        
        // Update players list and next player display
        this.updatePlayersList();
        this.updateNextPlayerVisibility();

        // Initialize shortcuts dialog elements
        this.shortcutsDialog = document.getElementById('shortcutsDialog');
        this.closeShortcutsBtn = document.getElementById('closeShortcutsBtn');
        
        // Initialize shortcuts dialog events
        this.initializeShortcutsDialog();

        this.initializeAboutDialog();

        // Add mute button reference
        this.muteBtn = document.getElementById('muteBtn');
        
        // Add muted state (load from localStorage if available)
        this.muted = localStorage.getItem('muted') === 'true';
        this.updateMuteButton();
        
        // Initialize mute button click handler
        this.muteBtn.addEventListener('click', () => {
            this.muted = !this.muted;
            localStorage.setItem('muted', this.muted);
            this.updateMuteButton();
            this.updateRunningSoundState();
        });
    }

    initializeEventListeners() {
        this.toggleBtn.addEventListener('click', () => {
            if (this.isRunning) {
                this.stop();
            } else {
                this.start();
            }
        });

        this.deleteBtn.addEventListener('click', () => {
            if (!this.isRunning) {
                this.resetRecord();
            }
        });
    }

    formatTime(ms) {
        const minutes = Math.floor(ms / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        const milliseconds = Math.floor((ms % 1000) / 10);
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
    }

    async start() {
        if (this.isRunning) return;
        
        // Hide challenge banner
        const challengeBanner = document.querySelector('.challenge-banner');
        if (challengeBanner) {
            challengeBanner.style.opacity = '0';
            setTimeout(() => {
                challengeBanner.style.display = 'none';
            }, 500); // Match the fade transition time
        }

        // Hide footer when stopwatch starts
        const footer = document.querySelector('.footer');
        if (footer) {
            footer.style.opacity = '0';
            setTimeout(() => {
                footer.style.display = 'none';
            }, 500); // Match transition time
        }

        // Hide next player text when running
        const nextPlayerDiv = document.querySelector('.next-player');
        if (nextPlayerDiv) {
            nextPlayerDiv.style.display = 'none';
        }

        // Clear the challenge rotation interval
        if (this.challengeInterval) {
            clearInterval(this.challengeInterval);
            this.challengeInterval = null;
        }

        // Hide spacebar hint before starting animations
        const spacebarHint = document.querySelector('.spacebar-hint');
        if (spacebarHint) {
            spacebarHint.style.opacity = '0';
            spacebarHint.style.display = 'none';
        }

        this.time = 0;
        this.display.textContent = this.formatTime(this.time);
        
        this.isRunning = true;
        this.toggleBtn.textContent = 'stop';
        this.toggleBtn.classList.add('stop');

        // Add starting effects
        const container = document.querySelector('.container');
        const stopwatch = document.querySelector('.stopwatch');
        
        container.classList.add('starting');
        stopwatch.classList.add('starting');
        
        // Remove classes after animation completes
        setTimeout(() => {
            container.classList.remove('starting');
            stopwatch.classList.remove('starting');
        }, 500);

        // Play the preloaded start sound
        this.playSound(this.startSound);

        // Start running sound loop only if not muted
        if (!this.muted) {
            this.runningSound.loop = true;
            this.runningSound.play();
        }

        const startTime = Date.now() - this.time;
        this.interval = setInterval(() => {
            this.time = Date.now() - startTime;
            this.display.textContent = this.formatTime(this.time);
        }, 10);

        document.querySelector('.stopwatch').classList.add('running');

        // Close options dialog if it's open when starting
        if (this.optionsDialog.classList.contains('active')) {
            this.optionsDialog.classList.remove('active');
        }
    }

    async stop() {
        if (!this.isRunning) return;
        
        clearInterval(this.interval);
        this.isRunning = false;
        this.toggleBtn.textContent = 'start';
        this.toggleBtn.classList.remove('stop');

        // Show footer when stopwatch stops
        const footer = document.querySelector('.footer');
        if (footer) {
            footer.style.display = 'block';
            setTimeout(() => {
                footer.style.opacity = '1';
            }, 10);
        }

        // Stop running sound
        this.runningSound.pause();
        this.runningSound.currentTime = 0;

        // Get current player's initials
        const currentPlayer = this.allPlayers[this.currentPlayerIndex];

        // Play appropriate sound based on record
        if (this.bestTime === null) {
            this.bestTime = this.time;
            const recordText = document.querySelector('.record-text');
            recordText.textContent = this.formatTime(this.bestTime);
            this.recordDisplay.classList.add('has-record');
            
            // Update avatar with current player's initials
            this.playerInitials = currentPlayer;
            this.updateAvatarInitials();
            
            this.playSound(this.recordSetSound);
        } else {
            // Compare based on record type
            const isNewRecord = this.shorterIsBetter ? 
                this.time < this.bestTime : 
                this.time > this.bestTime;

            if (isNewRecord) {
                this.playSound(this.recordBrokenSound);
                
                const effectElement = document.querySelector('.record-break-effect');
                const recordElement = document.querySelector('.record');
                
                effectElement.classList.add('active');
                recordElement.classList.add('new-record');
                
                this.bestTime = this.time;
                const recordText = document.querySelector('.record-text');
                recordText.textContent = this.formatTime(this.bestTime);
                this.recordDisplay.classList.add('has-record');
                
                // Update avatar with current player's initials when they break the record
                this.playerInitials = currentPlayer;
                this.updateAvatarInitials();
                
                setTimeout(() => {
                    effectElement.classList.remove('active');
                    recordElement.classList.remove('new-record');
                }, 3000);
            } else {
                // Randomly select one of the not broken sounds
                const randomSound = this.recordNotBrokenSounds[Math.floor(Math.random() * this.recordNotBrokenSounds.length)];
                this.playSound(randomSound);
                
                // Add red effect for not breaking record
                const notBrokenEffect = document.querySelector('.record-not-broken-effect');
                notBrokenEffect.classList.add('active');
                
                setTimeout(() => {
                    notBrokenEffect.classList.remove('active');
                }, 1000);
            }
        }

        document.querySelector('.stopwatch').classList.remove('running');

        // After stopping, move to next player and show next player display
        if (this.allPlayers.length > 1) {
            this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.allPlayers.length;
            this.updateNextPlayerDisplay();
            // Show next player text after stopping
            const nextPlayerDiv = document.querySelector('.next-player');
            if (nextPlayerDiv) {
                nextPlayerDiv.style.display = 'block';
            }
        }
    }

    handleSoundLoaded() {
        this.soundsLoaded++;
        if (this.soundsLoaded === this.totalSounds) {
            clearTimeout(this.loadingTimeout); // Clear timeout if all sounds loaded normally
            this.loadingOverlay.style.display = 'none';
            document.querySelector('.stopwatch').style.visibility = 'visible';
        }
    }

    forceStart() {
        clearTimeout(this.loadingTimeout);
        this.loadingOverlay.style.display = 'none';
        document.querySelector('.stopwatch').style.visibility = 'visible';
    }

    resetRecord() {
        // Play reset sound
        this.playSound(this.resetSound);

        // Clear best time (but don't clear initials)
        this.bestTime = null;
        
        const recordElement = document.querySelector('.record');
        const recordText = document.querySelector('.record-text');
        const avatar = document.querySelector('.avatar');
        
        if (recordElement && recordText) {
            recordElement.classList.remove('has-record');
            recordElement.classList.remove('has-initials');
            recordText.textContent = 'No record set';
            if (avatar) {
                avatar.textContent = '';
            }
        }
    }

    rotateChallenges() {
        this.challengeText.classList.add('fade');
        
        setTimeout(() => {
            this.currentChallengeIndex = (this.currentChallengeIndex + 1) % this.challenges.length;
            this.challengeText.textContent = this.challenges[this.currentChallengeIndex];
            this.challengeText.classList.remove('fade');
        }, 500);
    }

    initializeOptionsDialog() {
        this.optionsBtn.addEventListener('click', () => {
            // Only show options if stopwatch is not running
            if (!this.isRunning) {
                this.optionsDialog.classList.add('active');
            }
        });

        this.closeOptionsBtn.addEventListener('click', () => {
            this.optionsDialog.classList.remove('active');
        });

        // Close dialog when clicking outside
        this.optionsDialog.addEventListener('click', (e) => {
            if (e.target === this.optionsDialog) {
                this.optionsDialog.classList.remove('active');
            }
        });

        // Close dialog with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.optionsDialog.classList.contains('active')) {
                this.optionsDialog.classList.remove('active');
            }
        });

        // Add handler for record type changes
        const radioButtons = document.querySelectorAll('input[name="recordType"]');
        radioButtons.forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.shorterIsBetter = e.target.value === 'shorter';
                localStorage.setItem('recordType', e.target.value);
                
                // Reset record when changing type
                if (this.bestTime !== null) {
                    this.resetRecord();
                }
            });
        });
    }

    // Add new method to load preferences
    loadPreferences() {
        const savedType = localStorage.getItem('recordType');
        console.log('Saved type:', savedType);
        
        // Get radio button references
        const longerRadio = document.querySelector('input[name="recordType"][value="longer"]');
        const shorterRadio = document.querySelector('input[name="recordType"][value="shorter"]');
        
        if (!savedType) {
            // Set default if no saved preference
            localStorage.setItem('recordType', 'longer');
            this.shorterIsBetter = false;
            if (longerRadio) longerRadio.checked = true;
            if (shorterRadio) shorterRadio.checked = false;
            console.log('No saved preference, setting default longer');
        } else {
            // Apply saved preference
            this.shorterIsBetter = savedType === 'shorter';
            console.log('Setting shorterIsBetter to:', this.shorterIsBetter);
            
            // Update radio button
            if (savedType === 'shorter') {
                if (shorterRadio) shorterRadio.checked = true;
                if (longerRadio) longerRadio.checked = false;
            } else {
                if (longerRadio) longerRadio.checked = true;
                if (shorterRadio) shorterRadio.checked = false;
            }
        }

        // Load only additional players here since main player initials are already handled
        this.additionalPlayers = JSON.parse(localStorage.getItem('additionalPlayers') || '[]');
        
        // Update next player visibility based on loaded preferences
        this.updateNextPlayerVisibility();
    }

    initializeInitialsInput() {
        if (!this.initialsInput) return;

        // Set initial value from localStorage
        this.initialsInput.value = this.playerInitials;

        // Add input event listener
        this.initialsInput.addEventListener('input', (e) => {
            // Force uppercase
            let value = e.target.value.toUpperCase();
            
            // Remove any non-letter characters
            value = value.replace(/[^A-Z]/g, '');
            
            // Update the input value
            e.target.value = value;
            
            // Save to localStorage and update class property
            this.playerInitials = value;
            localStorage.setItem('playerInitials', value);

            // Reset record when main player changes
            if (this.bestTime !== null) {
                this.resetRecord();
            }

            // Update the avatar immediately
            const avatar = document.querySelector('.avatar');
            const recordElement = document.querySelector('.record');
            
            if (avatar && recordElement) {
                if (value && this.bestTime !== null) {
                    avatar.textContent = value;
                    recordElement.classList.add('has-record');
                    recordElement.classList.add('has-initials');
                } else {
                    avatar.textContent = '';
                    recordElement.classList.remove('has-initials');
                }
            }

            // Update players list when main player changes
            this.updatePlayersList();
        });
    }

    updateAvatarInitials() {
        const avatar = document.querySelector('.avatar');
        const recordElement = document.querySelector('.record');
        
        if (avatar && recordElement) {
            const hasInitials = Boolean(this.playerInitials && this.playerInitials.length > 0);
            const hasRecord = this.bestTime !== null;
            
            // Debug log
            console.log('Updating avatar:', {
                hasInitials,
                hasRecord,
                initials: this.playerInitials,
                bestTime: this.bestTime
            });

            if (hasInitials && hasRecord) {
                avatar.textContent = this.playerInitials;
                recordElement.classList.add('has-initials');
                recordElement.classList.add('has-record');
            } else {
                if (!hasInitials) {
                    avatar.textContent = '';
                    recordElement.classList.remove('has-initials');
                }
                if (!hasRecord) {
                    recordElement.classList.remove('has-record');
                }
            }
        }
    }

    // Update the setRecord method to include initials
    setRecord(time) {
        this.bestTime = time;
        localStorage.setItem('bestTime', time);
        
        const recordElement = document.querySelector('.record');
        const recordText = document.querySelector('.record-text');
        
        if (recordElement && recordText) {
            recordElement.classList.add('has-record');
            recordText.textContent = this.formatTime(time);
            this.updateAvatarInitials();
        }
    }

    initializeAdditionalPlayers() {
        const addPlayerBtn = document.getElementById('addPlayerBtn');
        const additionalPlayersContainer = document.querySelector('.additional-players');

        if (!addPlayerBtn || !additionalPlayersContainer) return;

        // Restore saved additional players
        this.additionalPlayers.forEach(initials => {
            this.createPlayerInput(initials);
        });

        // Update add player button state
        this.updateAddPlayerButtonState();

        // Add click handler for add player button
        addPlayerBtn.addEventListener('click', () => {
            this.createPlayerInput();
            this.updateAddPlayerButtonState();
        });
    }

    createPlayerInput(initialValue = '') {
        const additionalPlayersContainer = document.querySelector('.additional-players');
        
        const playerGroup = document.createElement('div');
        playerGroup.className = 'player-input-group';

        const input = document.createElement('input');
        input.type = 'text';
        input.maxLength = 2;
        input.pattern = '[A-Z]{1,2}';
        input.placeholder = 'A';
        input.title = 'Enter 1-2 capital letters';
        input.style.textTransform = 'uppercase';
        input.value = initialValue;

        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-player-button';
        removeBtn.innerHTML = '×';
        removeBtn.title = 'Remove player';

        playerGroup.appendChild(input);
        playerGroup.appendChild(removeBtn);
        additionalPlayersContainer.appendChild(playerGroup);

        // Add input handler
        input.addEventListener('input', (e) => {
            let value = e.target.value.toUpperCase();
            value = value.replace(/[^A-Z]/g, '');
            e.target.value = value;
            this.saveAdditionalPlayers();
            checkPlayerInputs();
            // Reset record when player initials change
            if (this.bestTime !== null) {
                this.resetRecord();
            }
        });

        // Add remove handler
        removeBtn.addEventListener('click', () => {
            playerGroup.remove();
            this.saveAdditionalPlayers();
            this.updateAddPlayerButtonState();
            checkPlayerInputs();
            // Reset record when player is removed
            if (this.bestTime !== null) {
                this.resetRecord();
            }
        });

        // Reset record when new player is added
        if (this.bestTime !== null) {
            this.resetRecord();
        }

        // Immediately check player inputs after adding new input field
        setTimeout(() => checkPlayerInputs(), 0);
    }

    updateAddPlayerButtonState() {
        const addPlayerBtn = document.getElementById('addPlayerBtn');
        const currentPlayerCount = document.querySelectorAll('.player-input-group').length + 1; // +1 for main player
        
        if (addPlayerBtn) {
            addPlayerBtn.disabled = currentPlayerCount >= this.maxPlayers;
        }
    }

    saveAdditionalPlayers() {
        const inputs = document.querySelectorAll('.additional-players input');
        this.additionalPlayers = Array.from(inputs)
            .map(input => input.value)
            .filter(value => value.length >= 1 && value.length <= 2); // Save valid 1-2 letter initials
        
        localStorage.setItem('additionalPlayers', JSON.stringify(this.additionalPlayers));
        
        // Reset current player index when all additional players are removed
        if (this.additionalPlayers.length === 0) {
            this.currentPlayerIndex = 0;
        }
        
        // Update players list and next player visibility
        this.updatePlayersList();
        this.updateNextPlayerVisibility();
    }

    // Add new method to update players list
    updatePlayersList() {
        this.allPlayers = [this.playerInitials, ...this.additionalPlayers].filter(Boolean);
        this.updateNextPlayerDisplay();
    }

    // Add new method to update next player display
    updateNextPlayerDisplay() {
        if (this.allPlayers.length <= 1) return;
        
        const nextPlayerSpan = document.querySelector('.next-player-initial');
        const nextPlayerPhrase = document.querySelector('.next-player-phrase');
        const nextPlayerDiv = document.querySelector('.next-player');
        
        if (nextPlayerSpan && nextPlayerDiv && nextPlayerPhrase) {
            const nextPlayer = this.allPlayers[this.currentPlayerIndex];
            console.log('Updating next player display:', {
                phrases: this.nextPlayerPhrases,
                selectedPhrase: this.nextPlayerPhrases[Math.floor(Math.random() * this.nextPlayerPhrases.length)],
                nextPlayer
            });
            
            const randomPhrase = this.nextPlayerPhrases[Math.floor(Math.random() * this.nextPlayerPhrases.length)];
            nextPlayerSpan.textContent = nextPlayer || '...';
            nextPlayerPhrase.textContent = randomPhrase;
            nextPlayerDiv.style.display = 'block';
        }
    }

    // Update the existing updateNextPlayerVisibility method
    updateNextPlayerVisibility() {
        const nextPlayerDiv = document.querySelector('.next-player');
        if (!nextPlayerDiv) return; // Guard clause if element doesn't exist
        
        console.log('Players count:', this.allPlayers.length); // Debug log
        
        if (this.allPlayers.length > 1) {
            nextPlayerDiv.style.display = 'block';
            this.updateNextPlayerDisplay();
        } else {
            nextPlayerDiv.style.display = 'none';
        }
    }

    initializeShortcutsDialog() {
        if (!this.shortcutsDialog || !this.closeShortcutsBtn) return;

        // Show dialog when "/" is pressed
        document.addEventListener('keydown', (e) => {
            // Don't trigger if user is typing in an input field
            if (e.target.tagName === 'INPUT') return;
            
            if (e.key === '/') {
                e.preventDefault(); // Prevent "/" from being typed
                this.shortcutsDialog.classList.add('active');
            }
        });

        // Close with close button
        this.closeShortcutsBtn.addEventListener('click', () => {
            this.shortcutsDialog.classList.remove('active');
        });

        // Close when clicking outside
        this.shortcutsDialog.addEventListener('click', (e) => {
            if (e.target === this.shortcutsDialog) {
                this.shortcutsDialog.classList.remove('active');
            }
        });

        // Close with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.shortcutsDialog.classList.contains('active')) {
                this.shortcutsDialog.classList.remove('active');
            }
        });
    }

    initializeAboutDialog() {
        const aboutDialog = document.getElementById('aboutDialog');
        const readMoreLink = document.getElementById('readMoreLink');
        const closeAboutBtn = document.getElementById('closeAboutBtn');

        if (!aboutDialog || !readMoreLink || !closeAboutBtn) return;

        // Show dialog when clicking read more
        readMoreLink.addEventListener('click', (e) => {
            e.preventDefault();
            aboutDialog.classList.add('active');
        });

        // Close with close button
        closeAboutBtn.addEventListener('click', () => {
            aboutDialog.classList.remove('active');
        });

        // Close when clicking outside
        aboutDialog.addEventListener('click', (e) => {
            if (e.target === aboutDialog) {
                aboutDialog.classList.remove('active');
            }
        });

        // Close with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && aboutDialog.classList.contains('active')) {
                aboutDialog.classList.remove('active');
            }
        });
    }

    // Add new method to update mute button appearance
    updateMuteButton() {
        if (this.muted) {
            this.muteBtn.classList.add('muted');
            this.muteBtn.title = 'Unmute sounds';
        } else {
            this.muteBtn.classList.remove('muted');
            this.muteBtn.title = 'Mute sounds';
        }
    }

    // Update the playSound method to respect mute setting
    playSound(sound) {
        if (!this.muted && sound) {
            sound.currentTime = 0;
            sound.play().catch(error => {
                console.log('Error playing sound:', error);
            });
        }
    }

    // Add method to handle running sound when mute state changes
    updateRunningSoundState() {
        if (this.isRunning) {
            if (this.muted) {
                this.runningSound.pause();
            } else {
                this.runningSound.play();
            }
        }
    }
}

// Initialize the stopwatch when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new Stopwatch();
});

// Update the checkPlayerInputs function to accept 1-2 letters
function checkPlayerInputs() {
    const mainPlayerInput = document.getElementById('playerInitials');
    const additionalPlayerInputs = document.querySelectorAll('.additional-players input');
    const addPlayerBtn = document.getElementById('addPlayerBtn');
    
    // First check if we've hit the maximum players limit
    const currentPlayerCount = additionalPlayerInputs.length + 1; // +1 for main player
    const maxPlayers = 5; // Match the maxPlayers value from the Stopwatch class
    
    if (currentPlayerCount >= maxPlayers) {
        addPlayerBtn.disabled = true;
        return;
    }
    
    // Check if main player input has 1-2 characters
    let allFilled = mainPlayerInput.value.trim().length >= 1 && 
                    mainPlayerInput.value.trim().length <= 2;
    
    // Check if any additional player inputs have 1-2 characters
    additionalPlayerInputs.forEach(input => {
        const length = input.value.trim().length;
        if (length < 1 || length > 2) {
            allFilled = false;
        }
    });
    
    // Enable/disable the add player button
    addPlayerBtn.disabled = !allFilled;
}

// Add event listeners to the main player input
document.getElementById('playerInitials').addEventListener('input', checkPlayerInputs);

// Modify the addPlayer function to add event listeners to new inputs
function addPlayer() {
    // ... existing addPlayer code ...
    
    // Add input event listener to the new player input
    newInput.addEventListener('input', checkPlayerInputs);
    
    // ... rest of existing addPlayer code ...
}

// Initial check when page loads
document.addEventListener('DOMContentLoaded', checkPlayerInputs);

// Add this function to update the next player display
function updateNextPlayerDisplay() {
    const mainPlayerInitial = document.getElementById('playerInitials').value;
    const nextPlayerSpan = document.querySelector('.next-player-initial');
    nextPlayerSpan.textContent = mainPlayerInitial || '...';
}

// Add these event listeners
document.getElementById('playerInitials').addEventListener('input', updateNextPlayerDisplay);
document.addEventListener('DOMContentLoaded', updateNextPlayerDisplay);