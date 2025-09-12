const https = require('https');
const fs = require('fs');
const path = require('path');

class MPLADSApiClient {
    constructor(sessionCookies = null) {
        this.baseUrl = 'https://mplads.sbi/rest/PreLoginDashboardData/getTilesReportData';
        this.loginUrl = 'https://mplads.sbi';
        this.sessionCookies = sessionCookies;
        this.csrfToken = '';
        this.sessionFile = path.join(__dirname, '../data/session.json');
        this.maxRetries = 3;
        this.retryDelay = 1000; // Start with 1 second
        
        this.headers = {
            'Accept': 'application/json, text/javascript, */*; q=0.01',
            'Accept-Language': 'en-US,en;q=0.9',
            'Connection': 'keep-alive',
            'Content-Type': 'application/json; charset=UTF-8',
            'Origin': 'https://mplads.sbi',
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'same-origin',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',
            'X-Requested-With': 'XMLHttpRequest',
            'sec-ch-ua': '"Not)A;Brand";v="8", "Chromium";v="138", "Google Chrome";v="138"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"Windows"'
        };
        
        // Ensure data directory exists
        this.ensureDataDirectory();
        
        // Try to load existing session only if no cookies provided
        if (!sessionCookies) {
            this.loadSession();
        }
    }

    /**
     * Ensure data directory exists for session storage
     */
    ensureDataDirectory() {
        const dataDir = path.dirname(this.sessionFile);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
    }
    
    /**
     * Load existing session from file if available
     */
    loadSession() {
        try {
            if (fs.existsSync(this.sessionFile)) {
                const sessionData = JSON.parse(fs.readFileSync(this.sessionFile, 'utf8'));
                const now = Date.now();
                
                // Check if session is not expired (valid for 4 hours)
                if (sessionData.timestamp && (now - sessionData.timestamp) < 4 * 60 * 60 * 1000) {
                    this.sessionCookies = sessionData.cookies;
                    this.csrfToken = sessionData.csrfToken || '';
                    console.log('📁 Loaded existing session from file');
                    return true;
                } else {
                    console.log('⏰ Existing session expired, will create new one');
                    fs.unlinkSync(this.sessionFile);
                }
            }
        } catch (error) {
            console.warn('⚠️  Failed to load session file:', error.message);
        }
        return false;
    }
    
    /**
     * Save session to file for persistence
     */
    saveSession() {
        try {
            const sessionData = {
                cookies: this.sessionCookies,
                csrfToken: this.csrfToken,
                timestamp: Date.now()
            };
            fs.writeFileSync(this.sessionFile, JSON.stringify(sessionData, null, 2));
            console.log('💾 Session saved to file');
        } catch (error) {
            console.warn('⚠️  Failed to save session file:', error.message);
        }
    }

    /**
     * Initialize session by visiting the main portal page using native HTTPS
     * This gets fresh session cookies that work for API calls
     */
    async initializeSession() {
        return new Promise((resolve, reject) => {
            try {
                console.log('🔑 Initializing MPLADS session...');
                
                const options = {
                    hostname: 'mplads.sbi',
                    port: 443,
                    path: '/',
                    method: 'GET',
                    headers: {
                        'User-Agent': this.headers['User-Agent'],
                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                        'Accept-Language': 'en-US,en;q=0.9',
                        'sec-ch-ua': this.headers['sec-ch-ua'],
                        'sec-ch-ua-mobile': this.headers['sec-ch-ua-mobile'],
                        'sec-ch-ua-platform': this.headers['sec-ch-ua-platform'],
                        'Cache-Control': 'no-cache',
                        'Pragma': 'no-cache'
                    }
                };
                
                const req = https.request(options, (res) => {
                    // Handle redirects manually
                    if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                        console.log('Following redirect to:', res.headers.location);
                        // For simplicity, we'll just continue with the original response
                    }
                    
                    let data = '';
                    res.on('data', (chunk) => {
                        data += chunk;
                    });
                    
                    res.on('end', async () => {
                        try {
                            // Extract cookies from response headers
                            const setCookieHeaders = res.headers['set-cookie'];
                            if (setCookieHeaders && setCookieHeaders.length > 0) {
                                // Extract cookie values and combine them
                                const cookies = setCookieHeaders
                                    .map(cookie => cookie.split(';')[0])
                                    .filter(cookie => cookie.includes('='))
                                    .join('; ');
                                
                                if (cookies) {
                                    this.sessionCookies = cookies;
                                    console.log('✅ Session initialized with cookies:', cookies.substring(0, 50) + '...');
                                    
                                    // Save session for persistence
                                    this.saveSession();
                                    
                                    // Test the session immediately with a quick API call
                                    const sessionWorks = await this.testSession();
                                    resolve(sessionWorks);
                                } else {
                                    console.warn('⚠️  No valid cookies found in response');
                                    resolve(false);
                                }
                            } else {
                                console.warn('⚠️  No set-cookie headers found in response');
                                resolve(false);
                            }
                        } catch (error) {
                            console.error('❌ Error processing session response:', error.message);
                            resolve(false);
                        }
                    });
                });
                
                req.on('error', (error) => {
                    console.error('❌ Failed to initialize session:', error.message);
                    resolve(false);
                });
                
                req.setTimeout(30000, () => {
                    req.destroy();
                    console.error('❌ Session initialization timeout');
                    resolve(false);
                });
                
                req.end();
                
            } catch (error) {
                console.error('❌ Error setting up session request:', error.message);
                resolve(false);
            }
        });
    }

    /**
     * Test if the current session cookies work by making a small API call
     */
    async testSession() {
        try {
            console.log('🧪 Testing session validity...');
            
            const testData = await this.fetchData('lok_sabha', 'works_completed');
            if (testData && testData.length > 0) {
                console.log(`✅ Session working! Test returned ${testData.length} records`);
                return true;
            } else {
                console.warn('⚠️  Session test returned no data - cookies may be invalid');
                return false;
            }
        } catch (error) {
            console.warn('⚠️  Session test failed:', error.message);
            return false;
        }
    }

    /**
     * Validate session before making API calls
     */
    async validateSession() {
        // Check if we have cookies
        if (!this.sessionCookies) {
            console.log('🔍 No session cookies found, need to initialize');
            return false;
        }
        
        // Quick validation with a small test call
        try {
            console.log('🔍 Validating existing session...');
            const testData = await this.makeQuickTestCall();
            
            if (testData) {
                console.log('✅ Session validation successful');
                return true;
            } else {
                console.log('❌ Session validation failed - need to re-authenticate');
                return false;
            }
        } catch (error) {
            console.warn('⚠️  Session validation error:', error.message);
            return false;
        }
    }
    
    /**
     * Make a quick test call to validate session
     */
    async makeQuickTestCall() {
        return new Promise((resolve, reject) => {
            try {
                const postData = 'combo=0%2C0%2C0%2C2&key=Total%20Works%20Completed';
                
                const options = {
                    hostname: 'mplads.sbi',
                    port: 443,
                    path: '/rest/PreLoginDashboardData/getTilesReportData',
                    method: 'POST',
                    headers: {
                        'Accept': this.headers['Accept'],
                        'Accept-Language': this.headers['Accept-Language'],
                        'Connection': 'keep-alive',
                        'Content-Type': 'application/json; charset=UTF-8',
                        'Content-Length': Buffer.byteLength(postData),
                        'Origin': 'https://mplads.sbi',
                        'Sec-Fetch-Dest': 'empty',
                        'Sec-Fetch-Mode': 'cors',
                        'Sec-Fetch-Site': 'same-origin',
                        'User-Agent': this.headers['User-Agent'],
                        'X-Requested-With': 'XMLHttpRequest',
                        'Cookie': this.sessionCookies
                    }
                };
                
                if (this.csrfToken) {
                    options.headers['X-CSRF-Token'] = this.csrfToken;
                }
                
                const req = https.request(options, (res) => {
                    let data = '';
                    
                    res.on('data', (chunk) => {
                        data += chunk;
                    });
                    
                    res.on('end', () => {
                        try {
                            if (res.statusCode === 200) {
                                const response = JSON.parse(data);
                                if (response && typeof response === 'object') {
                                    resolve(true);
                                    return;
                                }
                            }
                            resolve(false);
                        } catch (error) {
                            resolve(false);
                        }
                    });
                });
                
                req.on('error', (error) => {
                    resolve(false);
                });
                
                req.setTimeout(10000, () => {
                    req.destroy();
                    resolve(false);
                });
                
                req.write(postData);
                req.end();
                
            } catch (error) {
                resolve(false);
            }
        });
    }
    
    /**
     * Get or refresh session with comprehensive error handling
     */
    async ensureValidSession() {
        // First try to use existing session
        if (await this.validateSession()) {
            return true;
        }
        
        // If validation fails, try to initialize new session
        console.log('🔄 Current session invalid, initializing new session...');
        return await this.initializeSession();
    }

    /**
     * Fetch data from MPLADS API using native HTTPS
     * @param {string} house - 'lok_sabha' or 'rajya_sabha'
     * @param {string} dataType - 'works_completed', 'works_recommended', 'expenditure', 'allocated_limit'
     * @returns {Promise<Array>} - Array of records
     */
    async fetchData(house, dataType, lsTerm = '18') {
        return new Promise((resolve, reject) => {
            try {
                // Map house to combo parameter
                // Lok Sabha: default (18th) omits term selector; 17th uses an extra ",5" as per request.md
                let houseCombo;
                if (house === 'lok_sabha') {
                    if (String(lsTerm).toLowerCase() === '17') {
                        // 17th LS combo from request.md: 0,0,0,2,5
                        houseCombo = '0%2C0%2C0%2C2%2C5';
                    } else {
                        // 18th LS (current default behavior)
                        houseCombo = '0%2C0%2C0%2C2';
                    }
                } else {
                    // Rajya Sabha unchanged
                    houseCombo = '0%2C0%2C0%2C1';
                }
                
                // Map data type to key parameter
                const dataTypeMap = {
                    'works_completed': 'Total%20Works%20Completed',
                    'works_recommended': 'Total%20Works%20Recommended', 
                    'expenditure': 'Total%20Expenditure',
                    'allocated_limit': 'Allocated%20Limit'
                };
                
                const keyParam = dataTypeMap[dataType];
                if (!keyParam) {
                    reject(new Error(`Invalid data type: ${dataType}`));
                    return;
                }

                console.log(`Fetching ${house} ${dataType} data from API...`);

                // Use the exact format from working native request
                const postData = `combo=${houseCombo}&key=${keyParam}`;
                
                const options = {
                    hostname: 'mplads.sbi',
                    port: 443,
                    path: '/rest/PreLoginDashboardData/getTilesReportData',
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json, text/javascript, */*; q=0.01',
                        'Accept-Language': 'en-US,en;q=0.9',
                        'Connection': 'keep-alive',
                        'Content-Type': 'application/json; charset=UTF-8',
                        'Content-Length': Buffer.byteLength(postData),
                        'Origin': 'https://mplads.sbi',
                        'Sec-Fetch-Dest': 'empty',
                        'Sec-Fetch-Mode': 'cors',
                        'Sec-Fetch-Site': 'same-origin',
                        'User-Agent': this.headers['User-Agent'],
                        'X-Requested-With': 'XMLHttpRequest',
                        'sec-ch-ua': this.headers['sec-ch-ua'],
                        'sec-ch-ua-mobile': this.headers['sec-ch-ua-mobile'],
                        'sec-ch-ua-platform': this.headers['sec-ch-ua-platform']
                    }
                };
                
                // Add session cookies if available
                if (this.sessionCookies) {
                    options.headers['Cookie'] = this.sessionCookies;
                }
                
                const req = https.request(options, (res) => {
                    let data = '';
                    
                    res.on('data', (chunk) => {
                        data += chunk;
                    });
                    
                    res.on('end', () => {
                        try {
                            console.log(`✅ ${house} ${dataType} response: ${data.length} bytes`);
                            
                            const response = JSON.parse(data);
                            
                            // Some responses may be a top-level array or stringified array.
                            if (Array.isArray(response)) {
                                console.log(`✅ Fetched ${response.length} ${house} ${dataType} records`);
                                resolve(response);
                                return;
                            }
                            if (typeof response === 'string') {
                                try {
                                    const parsedTop = JSON.parse(response);
                                    if (Array.isArray(parsedTop)) {
                                        console.log(`✅ Fetched ${parsedTop.length} ${house} ${dataType} records`);
                                        resolve(parsedTop);
                                        return;
                                    }
                                } catch (_) {}
                            }

                            // Otherwise, find the correct data key that matches our request
                            const expectedKey = keyParam.replace(/%20/g, ' '); // Convert URL encoded spaces back
                            const availableKeys = Object.keys(response || {});

                            let dataKey = null;
                            let rawData = null;

                            // Try exact match first
                            if (response && response[expectedKey]) {
                                dataKey = expectedKey;
                                rawData = response[expectedKey];
                            } else if (response) {
                                // Try partial match
                                for (const key of availableKeys) {
                                    if (key.toLowerCase().includes(expectedKey.toLowerCase()) || 
                                        expectedKey.toLowerCase().includes(key.toLowerCase())) {
                                        dataKey = key;
                                        rawData = response[key];
                                        break;
                                    }
                                }
                            }

                            if (rawData === null || rawData === undefined) {
                                console.error(`Available response keys:`, availableKeys);
                                console.error(`Looking for key matching:`, expectedKey);
                                reject(new Error(`No matching data key found in API response`));
                                return;
                            }
                            
                            if (typeof rawData === 'string') {
                                try {
                                    const parsedData = JSON.parse(rawData);
                                    if (!Array.isArray(parsedData)) {
                                        reject(new Error(`Expected array but got ${typeof parsedData}`));
                                        return;
                                    }
                            console.log(`✅ Fetched ${parsedData.length} ${house} ${dataType} records`);
                            resolve(parsedData);
                                } catch (parseError) {
                                    console.error(`JSON parse error for ${house} ${dataType}:`, parseError.message);
                                    reject(new Error(`Failed to parse API response: ${parseError.message}`));
                                }
                            } else if (Array.isArray(rawData)) {
                            console.log(`✅ Fetched ${rawData.length} ${house} ${dataType} records`);
                            resolve(rawData);
                            } else {
                                console.error(`Unexpected data format for ${house} ${dataType}:`, typeof rawData);
                                reject(new Error(`Unexpected data format from API: expected string or array, got ${typeof rawData}`));
                            }
                            
                        } catch (parseError) {
                            console.error(`JSON parse error for ${house} ${dataType}:`, parseError.message);
                            console.error('Raw response:', data.substring(0, 500) + '...');
                            reject(new Error(`Failed to parse API response: ${parseError.message}`));
                        }
                    });
                });
                
                req.on('error', (error) => {
                    console.error(`❌ Error fetching ${house} ${dataType}:`, error.message);
                    if (error.code === 'ENOTFOUND') {
                        console.error('Network error: Unable to reach MPLADS API');
                    }
                    reject(error);
                });
                
                req.setTimeout(120000, () => { // 2 minutes timeout
                    req.destroy();
                    reject(new Error(`Timeout fetching ${house} ${dataType}: API request took too long`));
                });
                
                // Write the request body and send
                req.write(postData);
                req.end();
                
            } catch (error) {
                console.error(`❌ Error setting up request for ${house} ${dataType}:`, error.message);
                reject(error);
            }
        });
    }

    /**
     * Fetch all data types for a specific house
     * @param {string} house - 'lok_sabha' or 'rajya_sabha' 
     * @returns {Promise<Object>} - Object with all data types
     */
    async fetchAllDataForHouse(house, options = {}) {
        const { lsTerm = '18' } = options;
        const dataTypes = ['works_completed', 'works_recommended', 'expenditure', 'allocated_limit'];
        const results = {};

        for (const dataType of dataTypes) {
            try {
                results[dataType] = await this.fetchData(house, dataType, lsTerm);
                // Add small delay to avoid overwhelming the API
                await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (error) {
                console.error(`Failed to fetch ${house} ${dataType}:`, error.message);
                results[dataType] = [];
            }
        }

        return results;
    }

    /**
     * Fetch all data for both houses with proper session management
     * @returns {Promise<Object>} - Complete dataset
     */
    async fetchAllData(lsTermOption = 'both') {
        console.log('🚀 Starting complete MPLADS data fetch...\n');
        
        try {
            // Ensure we have a valid session before starting
            const sessionReady = await this.ensureValidSession();
            if (!sessionReady) {
                throw new Error('Failed to establish session for data fetch');
            }
            
            console.log('📊 Session ready, proceeding with data fetch...');
            
            // Fetch data sequentially to be respectful to the API
            const option = (lsTermOption || 'both').toString().toLowerCase();
            let lok18 = { works_completed: [], works_recommended: [], expenditure: [], allocated_limit: [] };
            let lok17 = { works_completed: [], works_recommended: [], expenditure: [], allocated_limit: [] };

            if (option === '18' || option === 'both') {
                console.log('🏛️  Fetching Lok Sabha (18th) data...');
                lok18 = await this.fetchAllDataForHouse('lok_sabha', { lsTerm: '18' });
            } else {
                console.log('⏭️  Skipping Lok Sabha (18th)');
            }

            if (option === '17' || option === 'both') {
                console.log('🏛️  Fetching Lok Sabha (17th) data...');
                lok17 = await this.fetchAllDataForHouse('lok_sabha', { lsTerm: '17' });
            } else {
                console.log('⏭️  Skipping Lok Sabha (17th)');
            }
            
            console.log('🏛️  Fetching Rajya Sabha data...');
            const rajyaSabhaData = await this.fetchAllDataForHouse('rajya_sabha');

            console.log('\n✅ Complete data fetch successful!');
            console.log('📊 Final Summary:');
            console.log(`   Lok Sabha (18) - Works Completed: ${lok18.works_completed.length}`);
            console.log(`   Lok Sabha (18) - Works Recommended: ${lok18.works_recommended.length}`);
            console.log(`   Lok Sabha (18) - Expenditure: ${lok18.expenditure.length}`);
            console.log(`   Lok Sabha (18) - Allocated Limit: ${lok18.allocated_limit.length}`);
            console.log(`   Lok Sabha (17) - Works Completed: ${lok17.works_completed.length}`);
            console.log(`   Lok Sabha (17) - Works Recommended: ${lok17.works_recommended.length}`);
            console.log(`   Lok Sabha (17) - Expenditure: ${lok17.expenditure.length}`);
            console.log(`   Lok Sabha (17) - Allocated Limit: ${lok17.allocated_limit.length}`);
            console.log(`   Rajya Sabha - Works Completed: ${rajyaSabhaData.works_completed.length}`);
            console.log(`   Rajya Sabha - Works Recommended: ${rajyaSabhaData.works_recommended.length}`);
            console.log(`   Rajya Sabha - Expenditure: ${rajyaSabhaData.expenditure.length}`);
            console.log(`   Rajya Sabha - Allocated Limit: ${rajyaSabhaData.allocated_limit.length}`);
            
            const totalRecords = Object.values(lok18).reduce((sum, arr) => sum + arr.length, 0) +
                               Object.values(lok17).reduce((sum, arr) => sum + arr.length, 0) +
                               Object.values(rajyaSabhaData).reduce((sum, arr) => sum + arr.length, 0);
            console.log(`   📈 Total Records Fetched: ${totalRecords}`);

            // Return separate buckets so transformer can tag lsTerm
            return {
                lok_sabha_18: lok18,
                lok_sabha_17: lok17,
                rajya_sabha: rajyaSabhaData,
                metadata: {
                    fetchTime: new Date().toISOString(),
                    totalRecords: totalRecords,
                    lsTermOption: option
                }
            };

        } catch (error) {
            console.error('❌ Complete data fetch failed:', error.message);
            throw error;
        }
    }
    
    /**
     * Get session information for debugging
     */
    getSessionInfo() {
        return {
            hasCookies: !!this.sessionCookies,
            hasCSRF: !!this.csrfToken,
            cookieLength: this.sessionCookies ? this.sessionCookies.length : 0,
            cookiePreview: this.sessionCookies ? this.sessionCookies.substring(0, 50) + '...' : 'None'
        };
    }
}

module.exports = MPLADSApiClient;
