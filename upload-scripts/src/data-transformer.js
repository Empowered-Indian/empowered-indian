/**
 * Data transformation utilities to convert MPLADS API data 
 * to match the exact CSV format used by the existing system
 */

// Helper function to convert Indian number format to standard number (from existing CSV cleaner)
function parseIndianNumber(str) {
    if (str === null || str === undefined) return 0;
    let s = str.toString().trim();
    if (!s || /^(-|N\/A|null|undefined|--)$/.test(s)) return 0;

    // Remove currency symbols and all common whitespace variants
    s = s
        .replace(/₹/g, '')
        .replace(/[\u00A0\u202F\u2009\u200A\u200B\s]/g, '')
        .replace(/,/g, '');

    // Extract numeric part
    const m = s.match(/([0-9]+(?:\.[0-9]+)?)/);
    if (!m) return 0;
    let num = parseFloat(m[1]);

    // Detect unit suffixes (crore/lakh) after the numeric segment
    const suffix = s.slice(m.index + m[0].length).toLowerCase();
    if (/(cr|crore|crores)/.test(suffix)) {
        num *= 10000000; // 1 crore = 1e7
    } else if (/(lac|lakh|lakhs)/.test(suffix)) {
        num *= 100000; // 1 lakh = 1e5
    }

    return Number.isFinite(num) ? num : 0;
}

// Helper function to parse dates from API format (DD-MMM-YYYY) to standard format (YYYY-MM-DD)
function parseDate(dateStr) {
    if (!dateStr || dateStr === 'N/A' || dateStr.toString().trim() === '') return null;
    
    const cleanDateStr = dateStr.toString().trim();
    
    // Handle different date formats from API
    if (cleanDateStr.includes('-')) {
        const months = {
            jan: '01', feb: '02', mar: '03', apr: '04',
            may: '05', jun: '06', jul: '07', aug: '08',
            sep: '09', sept: '09', oct: '10', nov: '11', dec: '12'
        };
        
        const parts = cleanDateStr.split('-');
        if (parts.length !== 3) {
            console.warn(`Invalid date format: ${dateStr}`);
            return null;
        }
        
        const day = parts[0].padStart(2, '0');
        const monthToken = (parts[1] || '').toString().slice(0, 4).toLowerCase();
        const month = months[monthToken];
        const year = parts[2];
        
        if (!month || !year || isNaN(parseInt(day))) {
            console.warn(`Could not parse date: ${dateStr}`);
            return null;
        }
        
        // Validate the date
        const parsedDate = new Date(`${year}-${month}-${day}`);
        if (isNaN(parsedDate.getTime())) {
            console.warn(`Invalid date created: ${dateStr}`);
            return null;
        }
        
        return `${year}-${month}-${day}`;
    }
    
    // Try ISO date format as fallback
    try {
        const isoDate = new Date(cleanDateStr);
        if (!isNaN(isoDate.getTime())) {
            return isoDate.toISOString().split('T')[0];
        }
    } catch (error) {
        console.warn(`Could not parse date as ISO: ${dateStr}`);
    }
    
    return null;
}

// Helper function to clean text encoding issues (from existing CSV cleaner)
function cleanText(text) {
    if (!text) return '';
    return text.replace(/\?{3,}/g, '').trim();
}

// Helper function to normalize constituency names (from existing CSV cleaner)
function normalizeConstituency(constituency) {
    if (!constituency) return '';
    let c = constituency.toString().trim();
    // Drop trailing state code suffixes like _BR, _MH
    c = c.replace(/_[A-Z]{2,3}$/g, '');
    // Remove trailing reservation qualifiers like (SC), (ST), or " - SC"
    c = c.replace(/\s*\((SC|ST|GEN|S\.?C\.?|S\.?T\.?)\)\s*$/i, '');
    c = c.replace(/\s*[-–]\s*(SC|ST|GEN)\s*$/i, '');
    // Collapse whitespace
    c = c.replace(/\s+/g, ' ').trim();
    return c;
}

/**
 * Transform API Allocated Limit data to match CSV format
 */
function transformAllocatedLimit(apiData, house, lsTerm = null) {
    return apiData
        .filter(record => {
            // Skip invalid records (same logic as CSV cleaner)
            const stateName = (record.STATE_NAME || '').toString().trim();
            const mpName = (record.MP_NAME || '').toString().trim();
            
            // Skip if essential fields are empty or invalid
            if (!stateName || !mpName || stateName.length <= 1 || mpName.length <= 1) {
                return false;
            }
            
            // Skip grand total rows
            if (stateName.toLowerCase().includes('total') || 
                mpName.toLowerCase().includes('total')) {
                return false;
            }
            
            return true;
        })
        .map((record, index) => ({
            srNo: record.Sno || index + 1,
            state: record.STATE_NAME,
            mpName: record.MP_NAME,
            constituency: normalizeConstituency(record.CONSTITUENCY),
            allocatedAmount: parseIndianNumber(record.ALLOCATED_AMT),
            house: house,
            // Attach lsTerm only for Lok Sabha
            ...(house === 'Lok Sabha' ? { lsTerm: lsTerm } : { lsTerm: null })
        }));
}

/**
 * Transform API Expenditure data to match CSV format
 */
function transformExpenditure(apiData, house, lsTerm = null) {
    return apiData
        .filter(record => {
            // Skip invalid records (same logic as CSV cleaner)
            const stateName = (record.STATE_NAME || '').toString().trim();
            const mpName = (record.MP_NAME || '').toString().trim();
            
            // Skip if essential fields are empty or invalid
            if (!stateName || !mpName || stateName.length <= 1 || mpName.length <= 1) {
                return false;
            }
            
            // Skip grand total rows
            if (stateName.toLowerCase().includes('total') || 
                mpName.toLowerCase().includes('total')) {
                return false;
            }
            
            return true;
        })
        .map((record, index) => ({
            srNo: record.Sno || index + 1,
            state: record.STATE_NAME,
            workId: parseInt(record.WORK_RECOMMENDATION_DTL_ID) || 0, // Ensure numeric type for consistent indexing
            work: cleanText(record.ACTIVITY_NAME),
            vendor: record.VENDOR_NAME || null, // Extract vendor data for both houses
            ida: record.IDA_NAME || record.IA_NAME, // API uses both field names
            mpName: record.MP_NAME,
            expenditureDate: parseDate(record.EXPENDITURE_DATE),
            paymentStatus: record.WORK_STATUS || record.PAYMENT_STATUS || 'N/A', // Handle both field names
            constituency: normalizeConstituency(record.CONSTITUENCY),
            expenditureAmount: parseIndianNumber(record.FUND_DISBURSED_AMT || record.EXPENDITURE_AMOUNT), // Handle both field names
            house: house,
            ...(house === 'Lok Sabha' ? { lsTerm: lsTerm } : { lsTerm: null })
        }));
}

/**
 * Transform API Works Completed data to match CSV format
 */
function transformWorksCompleted(apiData, house, lsTerm = null) {
    return apiData
        .filter(record => {
            // Skip invalid records (same logic as CSV cleaner)
            const stateName = (record.STATE_NAME || '').toString().trim();
            const mpName = (record.MP_NAME || '').toString().trim();
            
            // Skip if essential fields are empty or invalid
            if (!stateName || !mpName || stateName.length <= 1 || mpName.length <= 1) {
                return false;
            }
            
            // Skip grand total rows
            if (stateName.toLowerCase().includes('total') || 
                mpName.toLowerCase().includes('total')) {
                return false;
            }
            
            // Only include records that have completion data
            if (!record.ACTUAL_END_DATE || !record.ACTUAL_AMOUNT) {
                return false;
            }
            // Must have a valid WORK_RECOMMENDATION_DTL_ID
            const recId = parseInt(record.WORK_RECOMMENDATION_DTL_ID);
            if (!recId || recId <= 0) {
                return false;
            }
            
            return true;
        })
        .map((record, index) => ({
            srNo: record.Sno || index + 1,
            workCategory: record.WORK_CATEGORY,
            // Use WORK_RECOMMENDATION_DTL_ID as primary ID for linking
            workId: parseInt(record.WORK_RECOMMENDATION_DTL_ID) || 0, // Ensure numeric type for consistent indexing
            state: record.STATE_NAME,
            ida: record.IDA_NAME,
            workDescription: cleanText(record.WORK_DESCRIPTION) || cleanText(record.ACTIVITY_NAME) || 'No description available',
            mpName: record.MP_NAME,
            constituency: normalizeConstituency(record.CONSTITUENCY),
            completedDate: parseDate(record.ACTUAL_END_DATE),
            hasImage: record.FILE_STATUS === true || record.FILE_STATUS === 'true',
            averageRating: record.AVERAGE_RATING !== 'N/A' && record.AVERAGE_RATING !== null ? 
                parseFloat(record.AVERAGE_RATING) : null,
            finalAmount: parseIndianNumber(record.ACTUAL_AMOUNT),
            house: house,
            ...(house === 'Lok Sabha' ? { lsTerm: lsTerm } : { lsTerm: null })
        }));
}

/**
 * Transform API Works Recommended data to match CSV format
 * This function needs to filter out works that are already completed
 */
function transformWorksRecommended(apiData, house, lsTerm = null, completedWorkIds = new Set()) {
    let filteredCount = 0;
    
    return apiData
        .filter(record => {
            // Skip invalid records (same logic as CSV cleaner)
            const stateName = (record.STATE_NAME || '').toString().trim();
            const mpName = (record.MP_NAME || '').toString().trim();
            
            // Skip if essential fields are empty or invalid
            if (!stateName || !mpName || stateName.length <= 1 || mpName.length <= 1) {
                return false;
            }
            
            // Skip grand total rows
            if (stateName.toLowerCase().includes('total') || 
                mpName.toLowerCase().includes('total')) {
                return false;
            }
            
            // Skip if this work is already in completed works (keyed by WORK_RECOMMENDATION_DTL_ID)
            const recId = parseInt(record.WORK_RECOMMENDATION_DTL_ID) || null;
            if (recId && completedWorkIds.has(recId)) {
                filteredCount++;
                return false;
            }
            // Must have a valid WORK_RECOMMENDATION_DTL_ID
            if (!recId || recId <= 0) {
                return false;
            }
            
            // Only include records that have recommendation data
            if (!record.RECOMMENDATION_DATE || !record.RECOMMENDED_AMOUNT) {
                return false;
            }
            
            return true;
        })
        .map((record, index) => {
            const result = {
                srNo: record.Sno || index + 1,
                workCategory: record.WORK_CATEGORY,
                // Use WORK_RECOMMENDATION_DTL_ID as primary ID for linking
                workId: parseInt(record.WORK_RECOMMENDATION_DTL_ID) || 0, // Ensure numeric type for consistent indexing
                state: record.STATE_NAME,
                ida: record.IDA_NAME,
                mpName: record.MP_NAME,
                workDescription: cleanText(record.WORK_DESCRIPTION) || cleanText(record.ACTIVITY_NAME) || 'No description available',
                recommendationDate: parseDate(record.RECOMMENDATION_DATE),
                constituency: normalizeConstituency(record.CONSTITUENCY),
                hasImage: record.FILE_STATUS === true || record.FILE_STATUS === 'true',
                recommendedAmount: parseIndianNumber(record.RECOMMENDED_AMOUNT),
                house: house,
                ...(house === 'Lok Sabha' ? { lsTerm: lsTerm } : { lsTerm: null })
            };
            
            // Log deduplication stats at the end
            if (index === 0 && filteredCount > 0) {
                console.log(`   ⚠️  Filtered out ${filteredCount} works that are already completed`);
            }
            
            return result;
        });
}

/**
 * Transform all API data to match CSV format
 */
function transformAllData(apiData, options = {}) {
    const { lsTerm = null } = options;
    console.log('🔄 Transforming API data to match CSV format...\n');
    
    const results = {
        lok_sabha: {},
        rajya_sabha: {}
    };

    // Transform Lok Sabha data
    console.log('Transforming Lok Sabha data...');
    results.lok_sabha.allocated_limit = transformAllocatedLimit(
        apiData.lok_sabha.allocated_limit, 'Lok Sabha', lsTerm
    );
    console.log(`✅ Lok Sabha Allocated Limit: ${results.lok_sabha.allocated_limit.length} records`);

    results.lok_sabha.expenditure = transformExpenditure(
        apiData.lok_sabha.expenditure, 'Lok Sabha', lsTerm
    );
    console.log(`✅ Lok Sabha Expenditure: ${results.lok_sabha.expenditure.length} records`);

    // Transform completed works first
    results.lok_sabha.works_completed = transformWorksCompleted(
        apiData.lok_sabha.works_completed, 'Lok Sabha', lsTerm
    );
    console.log(`✅ Lok Sabha Works Completed: ${results.lok_sabha.works_completed.length} records`);

    // Create a set of completed work IDs (ACTIVITY_NAME) for deduplication
    const lsCompletedWorkIds = new Set(
        results.lok_sabha.works_completed.map(w => w.workId).filter(Boolean)
    );

    // Transform recommended works, excluding those that are already completed
    results.lok_sabha.works_recommended = transformWorksRecommended(
        apiData.lok_sabha.works_recommended, 'Lok Sabha', lsTerm, lsCompletedWorkIds
    );
    console.log(`✅ Lok Sabha Works Recommended: ${results.lok_sabha.works_recommended.length} records`);

    // Transform Rajya Sabha data
    console.log('\nTransforming Rajya Sabha data...');
    results.rajya_sabha.allocated_limit = transformAllocatedLimit(
        apiData.rajya_sabha.allocated_limit, 'Rajya Sabha', null
    );
    console.log(`✅ Rajya Sabha Allocated Limit: ${results.rajya_sabha.allocated_limit.length} records`);

    results.rajya_sabha.expenditure = transformExpenditure(
        apiData.rajya_sabha.expenditure, 'Rajya Sabha', null
    );
    console.log(`✅ Rajya Sabha Expenditure: ${results.rajya_sabha.expenditure.length} records`);

    // Transform completed works first
    results.rajya_sabha.works_completed = transformWorksCompleted(
        apiData.rajya_sabha.works_completed, 'Rajya Sabha', null
    );
    console.log(`✅ Rajya Sabha Works Completed: ${results.rajya_sabha.works_completed.length} records`);

    // Create a set of completed work IDs (ACTIVITY_NAME) for deduplication
    const rsCompletedWorkIds = new Set(
        results.rajya_sabha.works_completed.map(w => w.workId).filter(Boolean)
    );

    // Transform recommended works, excluding those that are already completed
    results.rajya_sabha.works_recommended = transformWorksRecommended(
        apiData.rajya_sabha.works_recommended, 'Rajya Sabha', null, rsCompletedWorkIds
    );
    console.log(`✅ Rajya Sabha Works Recommended: ${results.rajya_sabha.works_recommended.length} records`);

    console.log('\n✅ Data transformation completed successfully!');
    
    return results;
}

module.exports = {
    parseIndianNumber,
    parseDate,
    cleanText,
    normalizeConstituency,
    transformAllocatedLimit,
    transformExpenditure,
    transformWorksCompleted,
    transformWorksRecommended,
    transformAllData
};
