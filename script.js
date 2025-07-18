// ===== OOGCYCLE APP - MAIN SCRIPT =====

class OogCycleApp {
    constructor() {
        this.currentDate = new Date();
        this.selectedDate = null;
        this.cycleData = this.loadCycleData();
        this.predictions = this.calculatePredictions();
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.renderCalendar();
        this.hideLoadingScreen();
    }

    // ===== EVENT LISTENERS =====
    setupEventListeners() {
        // Calendar navigation
        document.getElementById('prev-month').addEventListener('click', () => {
            this.changeMonth(-1);
        });

        document.getElementById('next-month').addEventListener('click', () => {
            this.changeMonth(1);
        });

        // Quick actions
        document.getElementById('log-period-btn').addEventListener('click', () => {
            this.showPeriodModal();
        });

        document.getElementById('track-mood-btn').addEventListener('click', () => {
            this.showMoodModal();
        });

        // Bottom navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => {
                this.switchView(item.dataset.view);
            });
        });

        // Settings button
        document.getElementById('settings-btn').addEventListener('click', () => {
            this.showSettingsModal();
        });

        // Calendar day clicks
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('calendar-day')) {
                this.handleDayClick(e.target);
            }
        });
    }

    // ===== CALENDAR RENDERING =====
    renderCalendar() {
        const calendar = document.getElementById('calendar-grid');
        const monthTitle = document.getElementById('current-month');
        
        // Clear existing calendar
        calendar.innerHTML = '';
        
        // Set month title
        const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        monthTitle.textContent = `${monthNames[this.currentDate.getMonth()]} ${this.currentDate.getFullYear()}`;
        
        // Add day headers
        const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        dayHeaders.forEach(day => {
            const dayHeader = document.createElement('div');
            dayHeader.className = 'calendar-day-header';
            dayHeader.textContent = day;
            dayHeader.style.cssText = `
                background: #FFE5E5;
                color: #FF69B4;
                font-weight: 600;
                font-size: 0.8rem;
                padding: 0.5rem;
                text-align: center;
            `;
            calendar.appendChild(dayHeader);
        });
        
        // Get first day of month and number of days
        const firstDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 1);
        const lastDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();
        
        // Add empty cells for days before the first day of the month
        for (let i = 0; i < startingDayOfWeek; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'calendar-day other-month';
            const prevMonth = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() - 1, 0);
            const dayNumber = prevMonth.getDate() - startingDayOfWeek + i + 1;
            emptyDay.innerHTML = `<span class="day-number">${dayNumber}</span>`;
            calendar.appendChild(emptyDay);
        }
        
        // Add days of the current month
        for (let day = 1; day <= daysInMonth; day++) {
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day';
            dayElement.dataset.date = this.formatDate(new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), day));
            
            // Check if it's today
            const today = new Date();
            if (this.currentDate.getFullYear() === today.getFullYear() &&
                this.currentDate.getMonth() === today.getMonth() &&
                day === today.getDate()) {
                dayElement.classList.add('today');
            }
            
            // Check for cycle data
            const dateStr = this.formatDate(new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), day));
            const dayData = this.cycleData[dateStr];
            const predictions = this.predictions[dateStr];
            
            if (dayData) {
                if (dayData.period) {
                    dayElement.classList.add('period');
                }
                if (dayData.ovulation) {
                    dayElement.classList.add('ovulation');
                }
                if (dayData.fertile) {
                    dayElement.classList.add('fertile');
                }
            }
            
            // Add predictions
            if (predictions) {
                if (predictions.predictedOvulation) {
                    dayElement.classList.add('predicted-ovulation');
                }
                if (predictions.fertileWindow) {
                    dayElement.classList.add('fertile-window');
                }
                if (predictions.predictedPeriod) {
                    dayElement.classList.add('predicted-period');
                }
            }
            
            dayElement.innerHTML = `
                <span class="day-number">${day}</span>
                ${dayData && dayData.mood ? `<span class="day-indicator"></span>` : ''}
            `;
            
            calendar.appendChild(dayElement);
        }
        
        // Add empty cells for days after the last day of the month
        const remainingCells = 42 - (startingDayOfWeek + daysInMonth);
        for (let day = 1; day <= remainingCells; day++) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'calendar-day other-month';
            emptyDay.innerHTML = `<span class="day-number">${day}</span>`;
            calendar.appendChild(emptyDay);
        }
    }

    // ===== NAVIGATION =====
    changeMonth(direction) {
        this.currentDate.setMonth(this.currentDate.getMonth() + direction);
        this.renderCalendar();
    }

    switchView(view) {
        // Update navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-view="${view}"]`).classList.add('active');
        
        // Handle view switching logic here
        console.log(`Switching to ${view} view`);
    }

    // ===== DAY INTERACTION =====
    handleDayClick(dayElement) {
        if (dayElement.classList.contains('other-month')) return;
        
        const dateStr = dayElement.dataset.date;
        this.selectedDate = new Date(dateStr);
        
        // Show quick action modal for the selected day
        this.showDayModal(dateStr);
    }

    // ===== MODAL FUNCTIONS =====
    showPeriodModal() {
        const modal = this.createModal('Period Tracking', `
            <div class="modal-content">
                <h3>🩸 Log Your Period</h3>
                <div class="period-options">
                    <button class="modal-btn primary" onclick="app.logPeriod('start')">
                        Start Period
                    </button>
                    <button class="modal-btn secondary" onclick="app.logPeriod('end')">
                        End Period
                    </button>
                </div>
            </div>
        `);
        this.showModal(modal);
    }

    showMoodModal() {
        const modal = this.createModal('Mood Tracking', `
            <div class="modal-content">
                <h3>💭 How are you feeling?</h3>
                <div class="mood-options">
                    <button class="mood-btn" onclick="app.logMood('happy')">😊 Happy</button>
                    <button class="mood-btn" onclick="app.logMood('sad')">😢 Sad</button>
                    <button class="mood-btn" onclick="app.logMood('anxious')">😰 Anxious</button>
                    <button class="mood-btn" onclick="app.logMood('energetic')">⚡ Energetic</button>
                    <button class="mood-btn" onclick="app.logMood('tired')">😴 Tired</button>
                    <button class="mood-btn" onclick="app.logMood('cranky')">😤 Cranky</button>
                </div>
            </div>
        `);
        this.showModal(modal);
    }

    showDayModal(dateStr) {
        const date = new Date(dateStr);
        const dayData = this.cycleData[dateStr] || {};
        const predictions = this.predictions[dateStr] || {};
        
        let predictionInfo = '';
        if (predictions.predictedPeriod) {
            predictionInfo += '<p class="prediction-info">📅 Predicted period start</p>';
        }
        if (predictions.predictedOvulation) {
            predictionInfo += '<p class="prediction-info">🥚 Predicted ovulation</p>';
        }
        if (predictions.fertileWindow) {
            predictionInfo += '<p class="prediction-info">🌟 Fertile window</p>';
        }
        
        const modal = this.createModal('Day Details', `
            <div class="modal-content">
                <h3>📅 ${date.toDateString()}</h3>
                ${predictionInfo}
                <div class="day-actions">
                    <button class="modal-btn ${dayData.period ? 'active' : ''}" 
                            onclick="app.togglePeriod('${dateStr}')">
                        🩸 Period
                    </button>
                    <button class="modal-btn ${dayData.ovulation ? 'active' : ''}" 
                            onclick="app.toggleOvulation('${dateStr}')">
                        🥚 Ovulation
                    </button>
                    <button class="modal-btn" onclick="app.showMoodModal()">
                        💭 Mood
                    </button>
                </div>
                ${predictionInfo ? '<p class="prediction-note">💡 Predictions are based on your cycle history</p>' : ''}
            </div>
        `);
        this.showModal(modal);
    }

    showSettingsModal() {
        console.log('Settings modal - to be implemented');
    }

    // ===== MODAL HELPERS =====
    createModal(title, content) {
        return `
            <div class="modal-overlay" onclick="app.closeModal()">
                <div class="modal" onclick="event.stopPropagation()">
                    <div class="modal-header">
                        <h2>${title}</h2>
                        <button class="modal-close" onclick="app.closeModal()">×</button>
                    </div>
                    <div class="modal-body">
                        ${content}
                    </div>
                </div>
            </div>
        `;
    }

    showModal(modalHTML) {
        const modalContainer = document.getElementById('modal-container');
        modalContainer.innerHTML = modalHTML;
        
        // Add modal styles
        const modalStyles = `
            .modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 1000;
            }
            .modal {
                background: white;
                border-radius: 20px;
                max-width: 90%;
                max-height: 90%;
                overflow: hidden;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
            }
            .modal-header {
                background: linear-gradient(135deg, #FFB6C1 0%, #FFC0CB 100%);
                color: white;
                padding: 1rem;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .modal-close {
                background: none;
                border: none;
                color: white;
                font-size: 1.5rem;
                cursor: pointer;
            }
            .modal-body {
                padding: 1.5rem;
            }
            .modal-btn {
                display: block;
                width: 100%;
                padding: 0.75rem;
                margin: 0.5rem 0;
                border: none;
                border-radius: 10px;
                cursor: pointer;
                font-size: 1rem;
                transition: all 0.3s ease;
            }
            .modal-btn.primary {
                background: #FF69B4;
                color: white;
            }
            .modal-btn.secondary {
                background: #FFE5E5;
                color: #FF69B4;
            }
            .modal-btn.active {
                background: #FF1493;
                color: white;
            }
            .mood-options {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 0.5rem;
            }
            .mood-btn {
                padding: 0.75rem;
                border: none;
                border-radius: 10px;
                background: #FFE5E5;
                color: #FF69B4;
                cursor: pointer;
                transition: all 0.3s ease;
            }
            .mood-btn:hover {
                background: #FFB6C1;
                color: white;
            }
            .prediction-info {
                background: #F0F8FF;
                padding: 0.5rem;
                border-radius: 8px;
                margin: 0.5rem 0;
                font-size: 0.9rem;
                color: #4682B4;
                text-align: center;
            }
            .prediction-note {
                font-size: 0.8rem;
                color: #888;
                text-align: center;
                margin-top: 1rem;
                font-style: italic;
            }
            .welcome-content {
                text-align: center;
                padding: 1rem;
            }
            .welcome-steps {
                background: #FFF8F8;
                padding: 1rem;
                border-radius: 10px;
                margin: 1rem 0;
                text-align: left;
            }
            .welcome-steps ol {
                margin: 0.5rem 0;
                padding-left: 1.5rem;
            }
            .welcome-steps li {
                margin: 0.5rem 0;
                line-height: 1.4;
            }
            .welcome-privacy {
                background: #F0FFF0;
                padding: 1rem;
                border-radius: 10px;
                margin: 1rem 0;
            }
            .welcome-privacy h4 {
                margin-bottom: 0.5rem;
                color: #228B22;
            }
            .welcome-privacy p {
                margin: 0;
                color: #555;
            }
        `;
        
        if (!document.getElementById('modal-styles')) {
            const styleSheet = document.createElement('style');
            styleSheet.id = 'modal-styles';
            styleSheet.textContent = modalStyles;
            document.head.appendChild(styleSheet);
        }
    }

    closeModal() {
        const modalContainer = document.getElementById('modal-container');
        modalContainer.innerHTML = '';
    }

    // ===== CYCLE PREDICTIONS =====
    calculatePredictions() {
        const predictions = {};
        const periodDates = this.getPeriodDates();
        
        if (periodDates.length < 2) {
            return predictions; // Need at least 2 periods for predictions
        }
        
        // Calculate average cycle length
        const cycleLengths = [];
        for (let i = 1; i < periodDates.length; i++) {
            const prevDate = new Date(periodDates[i-1]);
            const currentDate = new Date(periodDates[i]);
            const diffTime = currentDate - prevDate;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            cycleLengths.push(diffDays);
        }
        
        const avgCycleLength = cycleLengths.reduce((sum, length) => sum + length, 0) / cycleLengths.length;
        const cycleLength = Math.round(avgCycleLength);
        
        // Predict next periods (3 months ahead)
        const lastPeriod = new Date(periodDates[periodDates.length - 1]);
        for (let i = 1; i <= 3; i++) {
            const predictedDate = new Date(lastPeriod);
            predictedDate.setDate(predictedDate.getDate() + (cycleLength * i));
            const dateStr = this.formatDate(predictedDate);
            
            // Add 5-day period prediction
            for (let j = 0; j < 5; j++) {
                const periodDate = new Date(predictedDate);
                periodDate.setDate(periodDate.getDate() + j);
                const periodDateStr = this.formatDate(periodDate);
                predictions[periodDateStr] = {
                    ...predictions[periodDateStr],
                    predictedPeriod: true
                };
            }
            
            // Calculate ovulation (typically 14 days before next period)
            const ovulationDate = new Date(predictedDate);
            ovulationDate.setDate(ovulationDate.getDate() - 14);
            const ovulationDateStr = this.formatDate(ovulationDate);
            predictions[ovulationDateStr] = {
                ...predictions[ovulationDateStr],
                predictedOvulation: true
            };
            
            // Calculate fertile window (5 days before ovulation + ovulation day)
            for (let k = -5; k <= 0; k++) {
                const fertileDate = new Date(ovulationDate);
                fertileDate.setDate(fertileDate.getDate() + k);
                const fertileDateStr = this.formatDate(fertileDate);
                predictions[fertileDateStr] = {
                    ...predictions[fertileDateStr],
                    fertileWindow: true
                };
            }
        }
        
        return predictions;
    }
    
    getPeriodDates() {
        const periodDates = [];
        const sortedDates = Object.keys(this.cycleData).sort();
        
        for (const dateStr of sortedDates) {
            const dayData = this.cycleData[dateStr];
            if (dayData && dayData.period) {
                // Only add start dates (avoid duplicates for consecutive period days)
                const prevDate = new Date(dateStr);
                prevDate.setDate(prevDate.getDate() - 1);
                const prevDateStr = this.formatDate(prevDate);
                
                if (!this.cycleData[prevDateStr] || !this.cycleData[prevDateStr].period) {
                    periodDates.push(dateStr);
                }
            }
        }
        
        return periodDates;
    }
    
    recalculatePredictions() {
        this.predictions = this.calculatePredictions();
        this.renderCalendar();
    }

    // ===== DATA MANAGEMENT =====
    logPeriod(action) {
        const today = this.formatDate(new Date());
        
        if (!this.cycleData[today]) {
            this.cycleData[today] = {};
        }
        
        this.cycleData[today].period = action === 'start';
        this.saveCycleData();
        this.recalculatePredictions();
        this.closeModal();
    }

    logMood(mood) {
        const today = this.formatDate(new Date());
        
        if (!this.cycleData[today]) {
            this.cycleData[today] = {};
        }
        
        this.cycleData[today].mood = mood;
        this.saveCycleData();
        this.renderCalendar();
        this.closeModal();
    }

    togglePeriod(dateStr) {
        if (!this.cycleData[dateStr]) {
            this.cycleData[dateStr] = {};
        }
        
        this.cycleData[dateStr].period = !this.cycleData[dateStr].period;
        this.saveCycleData();
        this.recalculatePredictions();
        this.closeModal();
    }

    toggleOvulation(dateStr) {
        if (!this.cycleData[dateStr]) {
            this.cycleData[dateStr] = {};
        }
        
        this.cycleData[dateStr].ovulation = !this.cycleData[dateStr].ovulation;
        this.saveCycleData();
        this.renderCalendar();
        this.closeModal();
    }

    // ===== STORAGE =====
    loadCycleData() {
        try {
            const data = localStorage.getItem('oogcycle-data');
            return data ? JSON.parse(data) : {};
        } catch (error) {
            console.error('Error loading cycle data:', error);
            return {};
        }
    }

    saveCycleData() {
        try {
            localStorage.setItem('oogcycle-data', JSON.stringify(this.cycleData));
        } catch (error) {
            console.error('Error saving cycle data:', error);
        }
    }

    // ===== UTILITIES =====
    formatDate(date) {
        return date.toISOString().split('T')[0];
    }

    hideLoadingScreen() {
        setTimeout(() => {
            const loadingScreen = document.getElementById('loading-screen');
            loadingScreen.classList.add('hidden');
            
            // Show welcome message for first-time users
            if (Object.keys(this.cycleData).length === 0) {
                this.showWelcomeModal();
            }
        }, 1000);
    }
    
    showWelcomeModal() {
        const modal = this.createModal('Welcome to OogCycle! 🌸', `
            <div class="modal-content">
                <div class="welcome-content">
                    <h3>🌸 Welcome to OogCycle!</h3>
                    <p>Your cute and private period tracking companion.</p>
                    
                    <div class="welcome-steps">
                        <h4>Getting Started:</h4>
                        <ol>
                            <li>🩸 <strong>Log your period</strong> - Click "Log Period" or tap any day</li>
                            <li>📅 <strong>Track regularly</strong> - Add data for a few cycles</li>
                            <li>🔮 <strong>Get predictions</strong> - We'll predict your next period & ovulation</li>
                            <li>💭 <strong>Track mood</strong> - Optional mood tracking with cute emojis</li>
                        </ol>
                    </div>
                    
                    <div class="welcome-privacy">
                        <h4>🔒 Your Privacy:</h4>
                        <p>All data stays on your device. No accounts, no cloud, no sharing.</p>
                    </div>
                    
                    <button class="modal-btn primary" onclick="app.closeModal()">
                        Let's Start! 🌟
                    </button>
                </div>
            </div>
        `);
        this.showModal(modal);
    }
}

// ===== APP INITIALIZATION =====
let app;

document.addEventListener('DOMContentLoaded', () => {
    app = new OogCycleApp();
});

// ===== PWA INSTALLATION =====
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
} 