/**
 * ===== OOGCYCLE APP - MAIN SCRIPT =====
 * 
 * Enhanced Period Tracking App with Blood Flow Indicators, Mood Logging, and Notes
 * 
 * Features:
 * - Daily logging with visual calendar indicators
 * - Blood flow tracking (1-3 drops for light/medium/heavy)
 * - Enhanced mood tracking with 9 mood options
 * - Notes for symptoms and observations
 * - Period and ovulation tracking with predictions
 * - Modern, mobile-friendly UI with pastel colors
 * - Local storage with fast retrieval
 * 
 * Data Structure:
 * cycleData[dateStr] = {
 *   period: boolean,
 *   ovulation: boolean,
 *   flow: number (1-3, only if period=true),
 *   mood: string (happy/sad/anxious/etc),
 *   notes: string
 * }
 */

class OogCycleApp {
    constructor() {
        this.currentDate = new Date();
        this.selectedDate = null;
        this.cycleData = this.loadCycleData();
        this.predictions = this.calculatePredictions();
        this.notesTimeout = null; // For debouncing notes saves
        this.init();
    }

    /**
     * Initialize the application
     * Sets up event listeners, renders the initial calendar, and handles loading screen
     */
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
            this.quickLogToday();
        });

        document.getElementById('track-mood-btn').addEventListener('click', () => {
            this.quickTrackTodayMood();
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
    /**
     * Renders the main calendar with all days, indicators, and predictions
     * Shows visual indicators for period, ovulation, mood, flow, and notes
     * Handles both current month days and adjacent month days for context
     */
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
                <div class="calendar-day-content">
                    <span class="day-number">${day}</span>
                    ${this.renderDayIndicators(dayData)}
                </div>
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

    // ===== DAY INDICATORS RENDERING =====
    renderDayIndicators(dayData) {
        if (!dayData) return '';
        
        const indicators = [];
        
        // Add flow indicator
        if (dayData.flow) {
            const flowLevel = dayData.flow;
            let flowIcon = '';
            if (flowLevel === 1) flowIcon = '💧';
            else if (flowLevel === 2) flowIcon = '💧💧';
            else if (flowLevel === 3) flowIcon = '💧💧💧';
            
            if (flowIcon) {
                indicators.push(`<span class="flow-indicator" title="Flow: ${flowLevel} drops">${flowIcon}</span>`);
            }
        }
        
        // Add mood indicator
        if (dayData.mood) {
            const moodEmojis = {
                'happy': '😊',
                'excited': '🤩', 
                'calm': '😌',
                'sad': '😢',
                'anxious': '😰',
                'angry': '😠',
                'tired': '😴',
                'energetic': '⚡',
                'cranky': '😤'
            };
            
            const moodEmoji = moodEmojis[dayData.mood] || '💭';
            indicators.push(`<span class="mood-indicator" title="Mood: ${dayData.mood}">${moodEmoji}</span>`);
        }
        
        // Add notes indicator
        if (dayData.notes && dayData.notes.trim()) {
            indicators.push(`<span class="notes-indicator" title="Has notes">📝</span>`);
        }
        
        if (indicators.length > 0) {
            return `<div class="day-indicators">${indicators.join('')}</div>`;
        }
        
        return '';
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
        // Correctly parse the date string to avoid timezone issues.
        const [year, month, day] = dateStr.split('-').map(Number);
        this.selectedDate = new Date(year, month - 1, day);
        
        // Show enhanced daily log modal for the selected day
        this.showDailyLogModal(dateStr);
    }

    // ===== MODAL FUNCTIONS =====
    showPeriodModal() {
        const today = new Date();
        const todayStr = this.formatDate(today);
        
        // Get last period end to suggest start date
        const lastPeriodEnd = this.getLastPeriodEnd();
        const suggestedStart = lastPeriodEnd ? new Date(lastPeriodEnd) : today;
        if (lastPeriodEnd) {
            // Suggest based on average cycle length or 28 days default
            const avgCycle = this.getAverageCycleLength() || 28;
            suggestedStart.setDate(suggestedStart.getDate() + avgCycle);
        }
        
        const modal = this.createModal('Period Tracking', `
            <div class="modal-content">
                <h3>🩸 Log Your Period</h3>
                <p class="modal-subtitle">Choose how you'd like to log your period:</p>
                
                <div class="period-options">
                    <button class="modal-btn primary" onclick="app.showPeriodRangeModal()">
                        📅 Log Period Range (Start - End)
                    </button>
                    <button class="modal-btn secondary" onclick="app.quickLogPeriod('today')">
                        ⚡ Quick Log Today
                    </button>
                </div>
                
                <div class="recent-periods">
                    <h4>Recent Periods:</h4>
                    <div id="recent-periods-list">
                        ${this.getRecentPeriodsHTML()}
                    </div>
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

    showDailyLogModal(dateStr) {
        // Parse date correctly to avoid timezone offset issues
        const [year, month, day] = dateStr.split('-').map(Number);
        const date = new Date(year, month - 1, day);
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
        
        const modal = this.createModal('Daily Log', `
            <div class="modal-content">
                <h3>📅 ${date.toDateString()}</h3>
                ${predictionInfo}
                
                <div class="daily-log-sections">
                    <!-- Period & Flow Section -->
                    <div class="log-section">
                        <div class="section-title">
                            🩸 Period & Flow
                        </div>
                        
                        <div style="margin-bottom: 1rem;">
                            <button class="modal-btn ${dayData.period ? 'active' : ''}" 
                                    onclick="app.togglePeriod('${dateStr}')">
                                ${dayData.period ? '✓ Period Day' : 'Mark as Period Day'}
                            </button>
                        </div>
                        
                        ${dayData.period ? `
                            <div class="flow-indicators">
                                <div class="flow-option ${dayData.flow === 1 ? 'selected' : ''}" 
                                     onclick="app.setFlow('${dateStr}', 1)">
                                    <div class="flow-drops">💧</div>
                                    <div class="flow-label">Light</div>
                                </div>
                                <div class="flow-option ${dayData.flow === 2 ? 'selected' : ''}" 
                                     onclick="app.setFlow('${dateStr}', 2)">
                                    <div class="flow-drops">💧💧</div>
                                    <div class="flow-label">Medium</div>
                                </div>
                                <div class="flow-option ${dayData.flow === 3 ? 'selected' : ''}" 
                                     onclick="app.setFlow('${dateStr}', 3)">
                                    <div class="flow-drops">💧💧💧</div>
                                    <div class="flow-label">Heavy</div>
                                </div>
                            </div>
                        ` : ''}
                    </div>
                    
                    <!-- Mood Section -->
                    <div class="log-section">
                        <div class="section-title">
                            💭 How are you feeling?
                        </div>
                        
                        <div class="mood-grid">
                            ${this.renderMoodOptions(dateStr, dayData.mood)}
                        </div>
                    </div>
                    
                    <!-- Notes Section -->
                    <div class="log-section">
                        <div class="section-title">
                            📝 Notes
                        </div>
                        <div class="notes-section">
                            <textarea class="notes-input" 
                                      placeholder="Any symptoms, thoughts, or observations..."
                                      onchange="app.saveNotes('${dateStr}', this.value)">${dayData.notes || ''}</textarea>
                        </div>
                    </div>
                    
                    <!-- Ovulation Tracking -->
                    <div class="log-section">
                        <div class="section-title">
                            🥚 Ovulation Tracking
                        </div>
                        <button class="modal-btn ${dayData.ovulation ? 'active' : ''}" 
                                onclick="app.toggleOvulation('${dateStr}')">
                            ${dayData.ovulation ? '✅ Ovulation Day' : '🥚 Mark as Ovulation Day'}
                        </button>
                        ${dayData.ovulation ? '<p style="font-size: 0.85rem; color: #4A7C59; margin-top: 0.5rem; text-align: center;">📈 This helps predict your fertile window</p>' : ''}
                    </div>
                </div>
                
                ${(dayData.period || dayData.ovulation || dayData.mood || (dayData.notes && dayData.notes.trim())) ? `
                    <div class="danger-zone" style="margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid #F0E6F7;">
                        <button class="modal-btn danger" onclick="app.clearDayData('${dateStr}')">
                            🗑️ Clear All Data
                        </button>
                    </div>
                ` : ''}
                
                ${predictionInfo ? '<p class="prediction-note">💡 Predictions are based on your cycle history</p>' : ''}
            </div>
        `);
        this.showModal(modal);
    }
    
    // Legacy method for compatibility
    showDayModal(dateStr) {
        this.showDailyLogModal(dateStr);
    }

    renderMoodOptions(dateStr, currentMood) {
        const moods = [
            { id: 'happy', emoji: '😊', label: 'Happy' },
            { id: 'excited', emoji: '🤩', label: 'Excited' },
            { id: 'calm', emoji: '😌', label: 'Calm' },
            { id: 'sad', emoji: '😢', label: 'Sad' },
            { id: 'anxious', emoji: '😰', label: 'Anxious' },
            { id: 'angry', emoji: '😠', label: 'Angry' },
            { id: 'tired', emoji: '😴', label: 'Tired' },
            { id: 'energetic', emoji: '⚡', label: 'Energetic' },
            { id: 'cranky', emoji: '😤', label: 'Cranky' }
        ];
        
        return moods.map(mood => `
            <div class="mood-option ${currentMood === mood.id ? 'selected' : ''}" 
                 onclick="app.setMood('${dateStr}', '${mood.id}')">
                <div class="mood-emoji">${mood.emoji}</div>
                <div class="mood-label">${mood.label}</div>
            </div>
        `).join('');
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
                max-height: 90vh;
                overflow: hidden;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
                display: flex;
                flex-direction: column;
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
                overflow-y: auto;
                flex: 1;
                max-height: calc(90vh - 80px);
                -webkit-overflow-scrolling: touch;
                scrollbar-width: thin;
                scrollbar-color: #E8B4E3 #F5E8F7;
            }
            .modal-body::-webkit-scrollbar {
                width: 6px;
            }
            .modal-body::-webkit-scrollbar-track {
                background: #F5E8F7;
                border-radius: 3px;
            }
            .modal-body::-webkit-scrollbar-thumb {
                background: #E8B4E3;
                border-radius: 3px;
            }
            .modal-body::-webkit-scrollbar-thumb:hover {
                background: #D4A5D4;
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
            .modal-subtitle {
                color: #666;
                font-size: 0.9rem;
                margin-bottom: 1rem;
                text-align: center;
            }
            .current-data {
                background: #F8F8F8;
                padding: 1rem;
                border-radius: 10px;
                margin: 1rem 0;
            }
            .current-data h4 {
                margin: 0 0 0.5rem 0;
                color: #333;
                font-size: 0.9rem;
            }
            .data-tag {
                display: inline-block;
                padding: 0.25rem 0.5rem;
                border-radius: 15px;
                font-size: 0.8rem;
                margin-right: 0.5rem;
                margin-bottom: 0.25rem;
            }
            .data-tag.period-tag {
                background: #FFE5F1;
                color: #FF69B4;
            }
            .data-tag.ovulation-tag {
                background: #E5F5E5;
                color: #228B22;
            }
            .data-tag.mood-tag {
                background: #E5F3FF;
                color: #4682B4;
            }
            .danger-zone {
                border-top: 1px solid #FFEBEB;
                padding-top: 1rem;
                margin-top: 1rem;
            }
            .modal-btn.danger {
                background: #FFE5E5;
                color: #DC3545;
                border: 1px solid #FFB6B6;
            }
            .modal-btn.danger:hover {
                background: #DC3545;
                color: white;
            }
            .date-inputs {
                margin: 1rem 0;
            }
            .date-input-group {
                margin-bottom: 1rem;
            }
            .date-input-group label {
                display: block;
                margin-bottom: 0.5rem;
                color: #333;
                font-weight: 600;
            }
            .date-input-group input[type="date"] {
                width: 100%;
                padding: 0.75rem;
                border: 2px solid #FFE5E5;
                border-radius: 10px;
                font-size: 1rem;
                background: white;
            }
            .date-input-group input[type="date"]:focus {
                outline: none;
                border-color: #FF69B4;
                box-shadow: 0 0 0 3px rgba(255, 105, 180, 0.1);
            }
            .help-text {
                background: #F0F8FF;
                padding: 0.75rem;
                border-radius: 8px;
                font-size: 0.85rem;
                color: #4682B4;
                margin-top: 1rem;
                text-align: center;
            }
            .recent-periods {
                margin-top: 1.5rem;
                padding-top: 1rem;
                border-top: 1px solid #F0F0F0;
            }
            .recent-periods h4 {
                margin: 0 0 0.75rem 0;
                color: #333;
                font-size: 0.9rem;
            }
            .recent-period-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 0.5rem 0.75rem;
                background: #FFF8F8;
                border-radius: 8px;
                margin-bottom: 0.5rem;
            }
            .period-date {
                font-weight: 600;
                color: #FF69B4;
            }
            .period-length {
                font-size: 0.85rem;
                color: #666;
            }
            .delete-period-btn {
                background: none;
                border: none;
                font-size: 1rem;
                cursor: pointer;
                padding: 0.25rem;
                border-radius: 4px;
                transition: all 0.2s ease;
            }
            .delete-period-btn:hover {
                background: #FFE5E5;
                transform: scale(1.1);
            }
            .no-data {
                text-align: center;
                color: #999;
                font-style: italic;
                padding: 1rem;
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

    // ===== ENHANCED PERIOD LOGGING =====
    showPeriodRangeModal() {
        const today = new Date();
        const todayStr = this.formatDate(today);
        
        // Suggest dates based on cycle history
        const lastPeriodEnd = this.getLastPeriodEnd();
        const avgCycle = this.getAverageCycleLength() || 28;
        
        let suggestedStartStr = todayStr;
        if (lastPeriodEnd) {
            const suggestedStart = new Date(lastPeriodEnd);
            suggestedStart.setDate(suggestedStart.getDate() + avgCycle);
            suggestedStartStr = this.formatDate(suggestedStart);
        }
        
        const modal = this.createModal('Log Period Range', `
            <div class="modal-content">
                <h3>📅 Log Period Range</h3>
                <p class="modal-subtitle">Select the start and end dates of your period:</p>
                
                <div class="date-inputs">
                    <div class="date-input-group">
                        <label for="period-start">Start Date:</label>
                        <input type="date" id="period-start" value="${suggestedStartStr}" />
                    </div>
                    <div class="date-input-group">
                        <label for="period-end">End Date (optional):</label>
                        <input type="date" id="period-end" />
                    </div>
                </div>
                
                <div class="period-actions">
                    <button class="modal-btn primary" onclick="app.logPeriodRange()">
                        💾 Save Period
                    </button>
                    <button class="modal-btn secondary" onclick="app.showPeriodModal()">
                        ← Back
                    </button>
                </div>
                
                <p class="help-text">💡 If you only select a start date, you can add the end date later!</p>
            </div>
        `);
        this.showModal(modal);
    }

    logPeriodRange() {
        const startInput = document.getElementById('period-start');
        const endInput = document.getElementById('period-end');
        
        const startDate = startInput.value;
        const endDate = endInput.value;
        
        if (!startDate) {
            alert('Please select at least a start date!');
            return;
        }
        
        // Clear any existing period data in the range first
        if (endDate && endDate >= startDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            
            // Log period for each day in the range
            for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                const dateStr = this.formatDate(d);
                if (!this.cycleData[dateStr]) {
                    this.cycleData[dateStr] = {};
                }
                this.cycleData[dateStr].period = true;
            }
        } else {
            // Just log the start date
            if (!this.cycleData[startDate]) {
                this.cycleData[startDate] = {};
            }
            this.cycleData[startDate].period = true;
        }
        
        this.saveCycleData();
        this.recalculatePredictions();
        this.closeModal();
        
        // Show success message
        this.showSuccessMessage('Period logged successfully! 🩸');
    }

    quickLogPeriod(when = 'today') {
        const today = this.formatDate(new Date());
        
        if (!this.cycleData[today]) {
            this.cycleData[today] = {};
        }
        
        this.cycleData[today].period = true;
        this.saveCycleData();
        this.recalculatePredictions();
        this.closeModal();
        
        this.showSuccessMessage('Today marked as period day! 🩸');
    }

    showMoodModalForDate(dateStr) {
        this.selectedDate = dateStr;
        this.showMoodModal();
    }

    clearDayData(dateStr) {
        if (confirm('Are you sure you want to clear all data for this day?')) {
            delete this.cycleData[dateStr];
            this.saveCycleData();
            this.recalculatePredictions();
            this.renderCalendar();
            this.showDailyLogModal(dateStr); // Refresh the modal to show empty state
            this.showSuccessMessage('Day data cleared! 🗑️');
        }
    }

    getLastPeriodEnd() {
        const sortedDates = Object.keys(this.cycleData).sort().reverse();
        
        for (const dateStr of sortedDates) {
            const dayData = this.cycleData[dateStr];
            if (dayData && dayData.period) {
                // Find the end of this period
                let endDate = dateStr;
                const currentDate = new Date(dateStr);
                
                // Look forward to find the end
                for (let i = 1; i <= 10; i++) {  // Max 10 days
                    const nextDate = new Date(currentDate);
                    nextDate.setDate(nextDate.getDate() + i);
                    const nextDateStr = this.formatDate(nextDate);
                    
                    if (this.cycleData[nextDateStr] && this.cycleData[nextDateStr].period) {
                        endDate = nextDateStr;
                    } else {
                        break;
                    }
                }
                
                return endDate;
            }
        }
        
        return null;
    }

    getAverageCycleLength() {
        const periodDates = this.getPeriodDates();
        
        if (periodDates.length < 2) {
            return null;
        }
        
        const cycleLengths = [];
        for (let i = 1; i < periodDates.length; i++) {
            const prevDate = new Date(periodDates[i-1]);
            const currentDate = new Date(periodDates[i]);
            const diffTime = currentDate - prevDate;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            cycleLengths.push(diffDays);
        }
        
        return Math.round(cycleLengths.reduce((sum, length) => sum + length, 0) / cycleLengths.length);
    }

    getRecentPeriodsHTML() {
        const periodDates = this.getPeriodDates().slice(-3).reverse(); // Last 3 periods
        
        if (periodDates.length === 0) {
            return '<p class="no-data">No periods logged yet</p>';
        }
        
        return periodDates.map(dateStr => {
            const date = new Date(dateStr);
            const periodLength = this.getPeriodLength(dateStr);
            return `<div class="recent-period-item">
                <span class="period-date">${date.toLocaleDateString()}</span>
                <span class="period-length">${periodLength} days</span>
                <button class="delete-period-btn" onclick="app.deletePeriod('${dateStr}')" title="Delete this period">
                    🗑️
                </button>
            </div>`;
        }).join('');
    }

    getPeriodLength(startDateStr) {
        let length = 1;
        const startDate = new Date(startDateStr);
        
        for (let i = 1; i <= 10; i++) {
            const nextDate = new Date(startDate);
            nextDate.setDate(nextDate.getDate() + i);
            const nextDateStr = this.formatDate(nextDate);
            
            if (this.cycleData[nextDateStr] && this.cycleData[nextDateStr].period) {
                length = i + 1;
            } else {
                break;
            }
        }
        
        return length;
    }

    deletePeriod(startDateStr) {
        if (confirm('Delete this entire period? This will remove all period days for this cycle.')) {
            const startDate = new Date(startDateStr);
            
            // Remove this period and consecutive period days
            for (let i = 0; i < 10; i++) {
                const currentDate = new Date(startDate);
                currentDate.setDate(currentDate.getDate() + i);
                const currentDateStr = this.formatDate(currentDate);
                
                if (this.cycleData[currentDateStr] && this.cycleData[currentDateStr].period) {
                    if (Object.keys(this.cycleData[currentDateStr]).length === 1) {
                        // Only period data, delete the whole entry
                        delete this.cycleData[currentDateStr];
                    } else {
                        // Other data exists, just remove period
                        delete this.cycleData[currentDateStr].period;
                    }
                } else {
                    break;
                }
            }
            
            this.saveCycleData();
            this.recalculatePredictions();
            this.showPeriodModal(); // Refresh the modal
            this.showSuccessMessage('Period deleted! 🗑️');
        }
    }

    showSuccessMessage(message) {
        // Create a temporary success message
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.textContent = message;
        successDiv.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: #4CAF50;
            color: white;
            padding: 1rem 2rem;
            border-radius: 25px;
            z-index: 10000;
            font-weight: 600;
            box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
            animation: slideDown 0.3s ease;
        `;
        
        document.body.appendChild(successDiv);
        
        setTimeout(() => {
            successDiv.style.animation = 'slideUp 0.3s ease forwards';
            setTimeout(() => successDiv.remove(), 300);
        }, 2500);
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
        const targetDate = this.selectedDate || this.formatDate(new Date());
        
        if (!this.cycleData[targetDate]) {
            this.cycleData[targetDate] = {};
        }
        
        this.cycleData[targetDate].mood = mood;
        this.saveCycleData();
        this.renderCalendar();
        this.closeModal();
        this.showSuccessMessage(`Mood logged: ${mood} 💭`);
    }



    toggleOvulation(dateStr) {
        if (!this.cycleData[dateStr]) {
            this.cycleData[dateStr] = {};
        }
        
        this.cycleData[dateStr].ovulation = !this.cycleData[dateStr].ovulation;
        this.saveCycleData();
        this.renderCalendar();
        this.showDailyLogModal(dateStr); // Refresh the modal
    }

    // ===== NEW ENHANCED LOGGING METHODS =====
    
    /**
     * Set blood flow level for a specific date
     * @param {string} dateStr - Date in YYYY-MM-DD format
     * @param {number} flowLevel - Flow level (1=light, 2=medium, 3=heavy)
     */
    setFlow(dateStr, flowLevel) {
        if (!this.cycleData[dateStr]) {
            this.cycleData[dateStr] = {};
        }
        
        // Toggle flow level - if same level is selected, remove it
        if (this.cycleData[dateStr].flow === flowLevel) {
            delete this.cycleData[dateStr].flow;
        } else {
            this.cycleData[dateStr].flow = flowLevel;
        }
        
        this.saveCycleData();
        this.renderCalendar();
        this.showDailyLogModal(dateStr); // Refresh the modal
        
        const flowLabels = { 1: 'Light', 2: 'Medium', 3: 'Heavy' };
        const label = this.cycleData[dateStr].flow ? flowLabels[flowLevel] : 'None';
        this.showSuccessMessage(`Flow updated: ${label} 💧`);
    }
    
    /**
     * Set mood for a specific date
     * @param {string} dateStr - Date in YYYY-MM-DD format
     * @param {string} mood - Mood identifier
     */
    setMood(dateStr, mood) {
        if (!this.cycleData[dateStr]) {
            this.cycleData[dateStr] = {};
        }
        
        // Toggle mood - if same mood is selected, remove it
        if (this.cycleData[dateStr].mood === mood) {
            delete this.cycleData[dateStr].mood;
            this.showSuccessMessage('Mood cleared 💭');
        } else {
            this.cycleData[dateStr].mood = mood;
            const moodLabels = {
                'happy': 'Happy', 'excited': 'Excited', 'calm': 'Calm',
                'sad': 'Sad', 'anxious': 'Anxious', 'angry': 'Angry',
                'tired': 'Tired', 'energetic': 'Energetic', 'cranky': 'Cranky'
            };
            this.showSuccessMessage(`Mood logged: ${moodLabels[mood]} 😊`);
        }
        
        this.saveCycleData();
        this.renderCalendar();
        this.showDailyLogModal(dateStr); // Refresh the modal
    }
    
    /**
     * Save notes for a specific date
     * @param {string} dateStr - Date in YYYY-MM-DD format
     * @param {string} notes - Notes text
     */
    saveNotes(dateStr, notes) {
        if (!this.cycleData[dateStr]) {
            this.cycleData[dateStr] = {};
        }
        
        if (notes && notes.trim()) {
            this.cycleData[dateStr].notes = notes.trim();
            this.debounceSuccessMessage('Notes saved 📝');
        } else {
            delete this.cycleData[dateStr].notes;
            this.debounceSuccessMessage('Notes cleared 📝');
        }
        
        this.saveCycleData();
        this.renderCalendar();
    }
    
    /**
     * Debounced success message to avoid spam while typing
     */
    debounceSuccessMessage(message) {
        if (this.notesTimeout) {
            clearTimeout(this.notesTimeout);
        }
        
        this.notesTimeout = setTimeout(() => {
            this.showSuccessMessage(message);
        }, 1000);
    }
    
    /**
     * Enhanced togglePeriod that refreshes the modal
     */
    togglePeriod(dateStr) {
        if (!this.cycleData[dateStr]) {
            this.cycleData[dateStr] = {};
        }
        
        this.cycleData[dateStr].period = !this.cycleData[dateStr].period;
        
        // If period is turned off, also remove flow data
        if (!this.cycleData[dateStr].period && this.cycleData[dateStr].flow) {
            delete this.cycleData[dateStr].flow;
        }
        
        this.saveCycleData();
        this.recalculatePredictions();
        this.showDailyLogModal(dateStr); // Refresh the modal
        
        const action = this.cycleData[dateStr].period ? 'marked' : 'unmarked';
        this.showSuccessMessage(`Period ${action} 🩸`);
    }

    // ===== QUICK ACTION METHODS =====
    
    /**
     * Quick log for today - opens today's daily log modal
     */
    quickLogToday() {
        const today = this.formatDate(new Date());
        this.showDailyLogModal(today);
    }
    
    /**
     * Quick mood tracking for today - opens today's daily log modal with focus on mood
     */
    quickTrackTodayMood() {
        const today = this.formatDate(new Date());
        this.showDailyLogModal(today);
        
        // Small delay to ensure modal is rendered, then scroll to mood section
        setTimeout(() => {
            const moodSection = document.querySelector('.log-section:nth-child(2)');
            if (moodSection) {
                moodSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 100);
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
        // Create timezone-safe date string to avoid UTC conversion issues
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
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