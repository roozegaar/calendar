/*
 * Copyright (c) 2025 Mehdi Dimyadi (https://github.com/MEHDIMYADI)
 * Project: Roozegaar Calendar (https://roozegaar.ir/)
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
        this.baseURL = 'https://roozegaar.mehdimyadi.workers.dev';
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
    async fetchMonthlyEvents(calendar, yearMonth, lang) {
        const cacheKey = `monthly-${calendar}-${yearMonth}-${lang}`;
        
        // Check cache first
        const cached = this.getFromCache(cacheKey);
        if (cached) {
            console.log(`📅 Using cached monthly events for ${cacheKey}`);
            return cached;
        }

        try {
            const url = `${this.baseURL}/monthly?calendar=${calendar}&yearMonth=${yearMonth}&lang=${lang}`;
            console.log(`📅 Fetching monthly calendar events from: ${url}`);
            
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
            console.error('❌ Error fetching monthly calendar events:', error);
            
            // Return empty events object on error
            return {
                success: false,
                type: 'monthly',
                calendar: calendar,
                yearMonth: yearMonth,
                language: lang,
                events_by_day: {},
                total_events: 0,
                total_holidays: 0,
                days_with_events: 0,
                fixed_events_count: 0,
                floating_events_count: 0
            };
        }
    }

    /**
     * Fetches calendar events for a specific day
     * @param {string} calendar - Calendar type ('persian' or 'gregorian')
     * @param {string} date - Date in format 'YYYY/MM/DD'
     * @param {string} lang - Language ('fa' or 'en')
     * @returns {Promise<Object>} Daily events data
     */
    async fetchDailyEvents(calendar, date, lang) {
        const cacheKey = `daily-${calendar}-${date}-${lang}`;
        
        // Check cache first
        const cached = this.getFromCache(cacheKey);
        if (cached) {
            console.log(`📅 Using cached daily events for ${cacheKey}`);
            return cached;
        }

        try {
            const url = `${this.baseURL}/daily?calendar=${calendar}&date=${date}&lang=${lang}`;
            console.log(`📅 Fetching daily calendar events from: ${url}`);
            
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
            console.error('❌ Error fetching daily calendar events:', error);
            
            // Return empty events object on error
            return {
                success: false,
                type: 'daily',
                calendar: calendar,
                date: date,
                language: lang,
                events: [],
                count: 0,
                holidays: 0,
                fixed_events_count: 0,
                floating_events_count: 0
            };
        }
    }
    
    /**
     * Fetches calendar events for a date range
     * @param {string} calendar - Calendar type ('persian' or 'gregorian')
     * @param {string} start - Start date in format 'YYYY/MM/DD'
     * @param {string} end - End date in format 'YYYY/MM/DD'
     * @param {string} lang - Language ('fa' or 'en')
     * @returns {Promise<Object>} Range events data
     */
    async fetchRangeEvents(calendar, start, end, lang) {
        const cacheKey = `range-${calendar}-${start}-${end}-${lang}`;

        // Check cache first
        const cached = this.getFromCache(cacheKey);
        if (cached) {
            console.log(`📅 Using cached range events for ${cacheKey}`);
            return cached;
        }

        try {
            const url = `${this.baseURL}/range?calendar=${calendar}&start=${start}&end=${end}&lang=${lang}`;
            console.log(`📅 Fetching range calendar events from: ${url}`);

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
            console.error('❌ Error fetching range calendar events:', error);

            // Return empty events object on error
            return {
                success: false,
                type: 'range',
                calendar: calendar,
                range: { start, end },
                language: lang,
                events_by_month: {},
                total_events: 0,
                total_holidays: 0
            };
        }
    }

    /**
     * Gets events for current displayed month range (for secondary calendar)
     * @returns {Promise<Object>} Combined events data for range
     */
    async getCurrentMonthRangeEvents() {
        let mainCalendarEvents, secondaryCalendarEvents;

        // Calculate date range for current month
        let startDate, endDate;

        if (currentCalendar === 'persian') {
            // For Persian calendar - current month range
            const year = currentPersianDate.year;
            const month = currentPersianDate.month;
            const daysInMonth = jalaaliMonthLength(year, month);

            startDate = this.getDateString(year, month, 1, 'persian');
            endDate = this.getDateString(year, month, daysInMonth, 'persian');
        } else {
            // For Gregorian calendar - current month range
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth() + 1;
            const daysInMonth = new Date(year, month, 0).getDate();

            startDate = this.getDateString(year, month, 1, 'gregorian');
            endDate = this.getDateString(year, month, daysInMonth, 'gregorian');
        }

        // Get main calendar events with proper language
        const mainLang = this.getApiLanguage(currentCalendar);
        mainCalendarEvents = await this.fetchRangeEvents(currentCalendar, startDate, endDate, mainLang);

        // Get secondary calendar events for display with proper language
        const secondaryCalendar = currentCalendar === 'persian' ? 'gregorian' : 'persian';
        let secondaryStartDate, secondaryEndDate;

        if (currentCalendar === 'persian') {
            // Convert Persian range to Gregorian range
            const startGreg = persianToGregorian({
                year: currentPersianDate.year,
                month: currentPersianDate.month,
                day: 1
            });
            const endGreg = persianToGregorian({
                year: currentPersianDate.year,
                month: currentPersianDate.month,
                day: jalaaliMonthLength(currentPersianDate.year, currentPersianDate.month)
            });

            secondaryStartDate = this.getDateString(
                startGreg.getFullYear(), 
                startGreg.getMonth() + 1, 
                startGreg.getDate(), 
                'gregorian'
            );
            secondaryEndDate = this.getDateString(
                endGreg.getFullYear(), 
                endGreg.getMonth() + 1, 
                endGreg.getDate(), 
                'gregorian'
            );
        } else {
            // Convert Gregorian range to Persian range
            const startPersian = gregorianToPersian(new Date(
                currentDate.getFullYear(),
                currentDate.getMonth(),
                1
            ));
            const endPersian = gregorianToPersian(new Date(
                currentDate.getFullYear(),
                currentDate.getMonth() + 1,
                0
            ));

            secondaryStartDate = this.getDateString(
                startPersian.year,
                startPersian.month,
                startPersian.day,
                'persian'
            );
            secondaryEndDate = this.getDateString(
                endPersian.year,
                endPersian.month,
                endPersian.day,
                'persian'
            );
        }

        const secondaryLang = this.getApiLanguage(secondaryCalendar);
        secondaryCalendarEvents = await this.fetchRangeEvents(
            secondaryCalendar, 
            secondaryStartDate, 
            secondaryEndDate, 
            secondaryLang
        );

        return {
            main: mainCalendarEvents,
            secondary: secondaryCalendarEvents
        };
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

    /**
     * Gets formatted date string for API
     * @param {number} year - Year
     * @param {number} month - Month
     * @param {number} day - Day
     * @param {string} calendarType - Calendar type
     * @returns {string} Formatted date string
     */
    getDateString(year, month, day, calendarType) {
        if (calendarType === 'persian') {
            return `${year}/${month.toString().padStart(2, '0')}/${day.toString().padStart(2, '0')}`;
        } else {
            return `${year}/${month.toString().padStart(2, '0')}/${day.toString().padStart(2, '0')}`;
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
     * Gets events for current displayed month (main calendar monthly, secondary calendar range)
     * @returns {Promise<Object>} Combined events data
     */
    async getCurrentMonthEvents() {
        let mainCalendarEvents, secondaryCalendarEvents;

        // Get main calendar events with proper language (monthly)
        if (currentCalendar === 'persian') {
            const yearMonth = this.getYearMonthString(currentPersianDate.year, currentPersianDate.month, 'persian');
            const lang = this.getApiLanguage('persian');
            mainCalendarEvents = await this.fetchMonthlyEvents('persian', yearMonth, lang);
        } else {
            const yearMonth = this.getYearMonthString(currentDate.getFullYear(), currentDate.getMonth() + 1, 'gregorian');
            const lang = this.getApiLanguage('gregorian');
            mainCalendarEvents = await this.fetchMonthlyEvents('gregorian', yearMonth, lang);
        }

        // Get secondary calendar events for display with EXACT range conversion
        if (currentCalendar === 'persian') {
            // Main: Persian, Secondary: Gregorian - use EXACT range conversion
            const startGreg = persianToGregorian({
                year: currentPersianDate.year,
                month: currentPersianDate.month,
                day: 1
            });

            // Calculate exact end date of Persian month in Gregorian
            const persianMonthDays = jalaaliMonthLength(currentPersianDate.year, currentPersianDate.month);
            const endGreg = persianToGregorian({
                year: currentPersianDate.year,
                month: currentPersianDate.month,
                day: persianMonthDays
            });

            const startDate = this.getDateString(
                startGreg.getFullYear(), 
                startGreg.getMonth() + 1, 
                startGreg.getDate(), 
                'gregorian'
            );
            const endDate = this.getDateString(
                endGreg.getFullYear(), 
                endGreg.getMonth() + 1, 
                endGreg.getDate(), 
                'gregorian'
            );

            console.log(`🔄 Persian month ${currentPersianDate.month} (${currentPersianDate.year}) converted to Gregorian range: ${startDate} to ${endDate}`);

            const lang = this.getApiLanguage('gregorian');
            secondaryCalendarEvents = await this.fetchRangeEvents('gregorian', startDate, endDate, lang);
        } else {
            // Main: Gregorian, Secondary: Persian - use EXACT range conversion
            const startPersian = gregorianToPersian(new Date(
                currentDate.getFullYear(),
                currentDate.getMonth(),
                1
            ));

            // Calculate exact end date of Gregorian month in Persian
            const gregorianMonthDays = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
            const endPersian = gregorianToPersian(new Date(
                currentDate.getFullYear(),
                currentDate.getMonth(),
                gregorianMonthDays
            ));

            const startDate = this.getDateString(
                startPersian.year,
                startPersian.month,
                startPersian.day,
                'persian'
            );
            const endDate = this.getDateString(
                endPersian.year,
                endPersian.month,
                endPersian.day,
                'persian'
            );

            console.log(`🔄 Gregorian month ${currentDate.getMonth() + 1} (${currentDate.getFullYear()}) converted to Persian range: ${startDate} to ${endDate}`);

            const lang = this.getApiLanguage('persian');
            secondaryCalendarEvents = await this.fetchRangeEvents('persian', startDate, endDate, lang);
        }

        return {
            main: mainCalendarEvents,
            secondary: secondaryCalendarEvents
        };
    }

    /**
     * Gets events for a specific day
     * @param {Object} dateObj - Date object (either Persian or Gregorian)
     * @param {string} calendarType - Calendar type ('persian' or 'gregorian')
     * @returns {Promise<Object>} Daily events data
     */
    async getDailyEvents(dateObj, calendarType) {
        let dateString, lang;
        
        if (calendarType === 'persian') {
            dateString = this.getDateString(dateObj.year, dateObj.month, dateObj.day, 'persian');
            lang = this.getApiLanguage('persian');
            return await this.fetchDailyEvents('persian', dateString, lang);
        } else {
            dateString = this.getDateString(dateObj.getFullYear(), dateObj.getMonth() + 1, dateObj.getDate(), 'gregorian');
            lang = this.getApiLanguage('gregorian');
            return await this.fetchDailyEvents('gregorian', dateString, lang);
        }
    }

    /**
     * Gets events for today
     * @returns {Promise<Object>} Today's events data
     */
    async getTodayEvents() {
        if (currentCalendar === 'persian') {
            const todayPersian = gregorianToPersian(new Date());
            return await this.getDailyEvents(todayPersian, 'persian');
        } else {
            return await this.getDailyEvents(new Date(), 'gregorian');
        }
    }
}

// ======================= JALAALI UTILITY FUNCTIONS =======================
/**
 * Gets number of days in Persian month
 * @param {number} year - Persian year
 * @param {number} month - Persian month
 * @returns {number} Number of days in month
 */
function jalaaliMonthLength(year, month) {
    if (month <= 6) return 31;
    if (month <= 11) return 30;
    
    // For Esfand (month 12), check if it's a leap year
    return isLeapJalaaliYear(year) ? 30 : 29;
}

/**
 * Checks if a Persian year is leap
 * @param {number} year - Persian year
 * @returns {boolean} True if leap year
 */
function isLeapJalaaliYear(year) {
    // Jalaali leap years formula
    return (year - 474) % 128 === 0 || ((year - 474) % 128 === 30 && (year - 474) % 128 < 30);
}

// Create global instance
const calendarAPI = new CalendarAPI();