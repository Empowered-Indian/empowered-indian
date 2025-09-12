/**
 * Data validation utilities to ensure data quality before database upload
 */

/**
 * Validate a single record has required fields and correct data types
 */
function validateRecord(record, recordType) {
    const errors = [];
    
    // Common validations for all record types
    if (!record.mpName || typeof record.mpName !== 'string' || record.mpName.trim().length === 0) {
        errors.push('Missing or invalid mpName');
    }
    
    if (!record.house || typeof record.house !== 'string' || !['Lok Sabha', 'Rajya Sabha'].includes(record.house)) {
        errors.push('Missing or invalid house');
    }
    
    if (!record.state || typeof record.state !== 'string' || record.state.trim().length === 0) {
        errors.push('Missing or invalid state');
    }
    
    // Record-specific validations
    switch (recordType) {
        case 'allocated_limit':
            if (typeof record.allocatedAmount !== 'number' || record.allocatedAmount < 0) {
                errors.push('Invalid allocatedAmount - must be positive number');
            }
            break;
            
        case 'expenditure':
            if (typeof record.expenditureAmount !== 'number' || record.expenditureAmount < 0) {
                errors.push('Invalid expenditureAmount - must be positive number');
            }
            if (!record.work || typeof record.work !== 'string') {
                errors.push('Missing or invalid work description');
            }
            break;
            
        case 'works_completed':
            if (typeof record.finalAmount !== 'number' || record.finalAmount < 0) {
                errors.push('Invalid finalAmount - must be positive number');
            }
            if (!record.workDescription || typeof record.workDescription !== 'string') {
                errors.push('Missing or invalid work description');
            }
            if (record.hasImage !== null && typeof record.hasImage !== 'boolean') {
                errors.push('Invalid hasImage - must be boolean or null');
            }
            if (record.averageRating !== null && (typeof record.averageRating !== 'number' || record.averageRating < 0 || record.averageRating > 5)) {
                errors.push('Invalid averageRating - must be number between 0-5 or null');
            }
            break;
            
        case 'works_recommended':
            if (typeof record.recommendedAmount !== 'number' || record.recommendedAmount < 0) {
                errors.push('Invalid recommendedAmount - must be positive number');
            }
            if (!record.workDescription || typeof record.workDescription !== 'string') {
                errors.push('Missing or invalid work description');
            }
            break;
    }
    
    return errors;
}

/**
 * Validate an array of records and return summary
 */
function validateRecords(records, recordType) {
    const validRecords = [];
    const invalidRecords = [];
    const validationSummary = {
        total: records.length,
        valid: 0,
        invalid: 0,
        errors: {}
    };
    
    records.forEach((record, index) => {
        const errors = validateRecord(record, recordType);
        
        if (errors.length === 0) {
            validRecords.push(record);
            validationSummary.valid++;
        } else {
            invalidRecords.push({
                index,
                record: {
                    mpName: record.mpName,
                    house: record.house,
                    state: record.state
                },
                errors
            });
            validationSummary.invalid++;
            
            // Count error types
            errors.forEach(error => {
                validationSummary.errors[error] = (validationSummary.errors[error] || 0) + 1;
            });
        }
    });
    
    return {
        validRecords,
        invalidRecords,
        summary: validationSummary
    };
}

/**
 * Validate all transformed data before upload
 */
function validateAllData(transformedData) {
    console.log('🔍 Validating transformed data quality...\n');
    
    const validationResults = {
        lok_sabha: {},
        rajya_sabha: {}
    };
    
    let totalErrors = 0;
    
    // Validate each data type for both houses
    for (const house of ['lok_sabha', 'rajya_sabha']) {
        console.log(`Validating ${house.replace('_', ' ')} data...`);
        
        for (const [dataType, records] of Object.entries(transformedData[house])) {
            const validation = validateRecords(records, dataType);
            validationResults[house][dataType] = validation;
            
            console.log(`  📊 ${dataType}: ${validation.summary.valid}/${validation.summary.total} valid records`);
            
            if (validation.summary.invalid > 0) {
                console.log(`  ⚠️  ${validation.summary.invalid} invalid records found`);
                totalErrors += validation.summary.invalid;
                
                // Log top 3 error types
                const sortedErrors = Object.entries(validation.summary.errors)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 3);
                
                sortedErrors.forEach(([error, count]) => {
                    console.log(`     • ${error}: ${count} records`);
                });
            }
        }
        console.log('');
    }
    
    // Overall summary
    const totalRecords = Object.values(transformedData.lok_sabha)
        .concat(Object.values(transformedData.rajya_sabha))
        .flat().length;
    
    console.log('📋 Validation Summary:');
    console.log(`   Total records: ${totalRecords}`);
    console.log(`   Valid records: ${totalRecords - totalErrors}`);
    console.log(`   Invalid records: ${totalErrors}`);
    console.log(`   Data quality: ${Math.round(((totalRecords - totalErrors) / totalRecords) * 100)}%`);
    
    if (totalErrors > 0) {
        console.log('\n⚠️  Warning: Some records have validation issues but will be filtered out during upload');
    } else {
        console.log('\n✅ All data passed validation!');
    }
    
    return validationResults;
}

/**
 * Check for potential duplicate records
 */
function checkForDuplicates(records, keyFields = ['mpName', 'workId']) {
    const seen = new Set();
    const duplicates = [];
    
    records.forEach((record, index) => {
        const key = keyFields.map(field => record[field] || '').join('|');
        
        if (seen.has(key) && key !== '|') { // Ignore records with empty key fields
            duplicates.push({ index, key, record });
        } else {
            seen.add(key);
        }
    });
    
    return duplicates;
}

module.exports = {
    validateRecord,
    validateRecords,
    validateAllData,
    checkForDuplicates
};