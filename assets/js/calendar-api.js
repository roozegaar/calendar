/*
 * Copyright (c) 2025 Mehdi Dimyadi (https://github.com/MEHDIMYADI)
 * Project: Roozegaar Calendar (https://dimyadi.ir/roozegaar-calendar/)
 *
 * If you use or get inspiration from this project,
 * please kindly mention my name or this project in your work.
 * It took a lot of effort to build, and I’d really appreciate your acknowledgment.
 *
 * Licensed under no specific open-source license — all rights reserved unless stated otherwise.
 */

// ======================= CALENDAR API MANAGEMENT =======================
class CalendarAPI {
    constructor() {
        this.baseURL = 'https://roozegaar.mehdimyadi.workers.dev/monthly';
        this.cache = new Map();
        this.cacheTimeout = 24 * 60 * 60 * 1000; // 24 hours cache
    }

    /**
     * Fetches calendar events for a specific month
     * @param {string} calendar - Calendar type ('persian' or 'gregorian')
     * @param {string} yearMonth - Year and month in format 'YYYY/MM' or 'YYYY/M'
     * @param {string} lang - Language ('fa' or 'en')
     * @returns {Promise<Object>} Calendar events data
     */
    async fetchCalendarEvents(calendar, yearMonth, lang) {
        const cacheKey = `${calendar}-${yearMonth}-${lang}`;
        
        // Check cache first
        const cached = this.getFromCache(cacheKey);
        if (cached) {
            console.log(`📅 Using cached events for ${cacheKey}`);
            return cached;
        }

        try {
            const url = `${this.baseURL}?calendar=${calendar}&yearMonth=${yearMonth}&lang=${lang}`;
            console.log(`📅 Fetching calendar events from: ${url}`);
            
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.success) {
                // Cache the successful response
                this.setToCache(cacheKey, data);
                return data;
            } else {
                throw new Error('API returned unsuccessful response');
            }
            
        } catch (error) {
            console.error('❌ Error fetching calendar events:', error);
            
            // Return empty events object on error
            return {
                success: false,
                calendar: calendar,
                yearMonth: yearMonth,
                language: lang,
                events_by_day: {},
                total_events: 0,
                total_holidays: 0,
                days_with_events: 0
            };
        }
    }

    /**
     * Gets events from cache if valid
     * @param {string} key - Cache key
     * @returns {Object|null} Cached data or null
     */
    getFromCache(key) {
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.data;
        }
        return null;
    }

    /**
     * Sets data to cache
     * @param {string} key - Cache key
     * @param {Object} data - Data to cache
     */
    setToCache(key, data) {
        this.cache.set(key, {
            data: data,
            timestamp: Date.now()
        });
    }

    /**
     * Clears the cache
     */
    clearCache() {
        this.cache.clear();
        console.log('🗑️ Calendar API cache cleared');
    }

    /**
     * Gets formatted year/month for API
     * @param {number} year - Year
     * @param {number} month - Month
     * @param {string} calendarType - Calendar type
     * @returns {string} Formatted year/month string
     */
    getYearMonthString(year, month, calendarType) {
        if (calendarType === 'persian') {
            return `${year}/${month.toString().padStart(2, '0')}`;
        } else {
            return `${year}/${month.toString().padStart(2, '0')}`;
        }
    }

    getApiLanguage(calendarType) {
        if (calendarType === 'persian' && currentLang === 'fa') {
            return 'fa';
        }
        if (calendarType === 'gregorian' && currentLang === 'en') {
            return 'en';
        }
        return currentLang === 'fa' ? 'fa' : 'en';
    }
    
    /**
     * Gets events for current displayed month
     * @returns {Promise<Object>} Combined events data
     */
    async getCurrentMonthEvents() {
        let mainCalendarEvents, secondaryCalendarEvents;
        
        // Get main calendar events with proper language
        if (currentCalendar === 'persian') {
            const yearMonth = this.getYearMonthString(currentPersianDate.year, currentPersianDate.month, 'persian');
            const lang = this.getApiLanguage('persian');
            mainCalendarEvents = await this.fetchCalendarEvents('persian', yearMonth, lang);
        } else {
            const yearMonth = this.getYearMonthString(currentDate.getFullYear(), currentDate.getMonth() + 1, 'gregorian');
            const lang = this.getApiLanguage('gregorian');
            mainCalendarEvents = await this.fetchCalendarEvents('gregorian', yearMonth, lang);
        }

        // Get secondary calendar events for display with opposite language
        if (currentCalendar === 'persian') {
            const gregDate = persianToGregorian(currentPersianDate);
            const yearMonth = this.getYearMonthString(gregDate.getFullYear(), gregDate.getMonth() + 1, 'gregorian');
            const lang = this.getApiLanguage('gregorian');
            secondaryCalendarEvents = await this.fetchCalendarEvents('gregorian', yearMonth, lang);
        } else {
            const persDate = gregorianToPersian(currentDate);
            const yearMonth = this.getYearMonthString(persDate.year, persDate.month, 'persian');
            const lang = this.getApiLanguage('persian');
            secondaryCalendarEvents = await this.fetchCalendarEvents('persian', yearMonth, lang);
        }

        return {
            main: mainCalendarEvents,
            secondary: secondaryCalendarEvents
        };
    }
}

// Create global instance
const calendarAPI = new CalendarAPI();