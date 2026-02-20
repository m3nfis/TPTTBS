const VALID_ITEMS = ['1-003000', '1-005000', '2-002050', '2-003000', '2-005000'];
const ASSET_ITEMS = ['1-003000', '1-005000'];
const LIABILITY_ITEMS = ['2-002050', '2-003000', '2-005000'];

const HOLD_TYPES_BY_ITEM = {
  '1-003000': ['01', '02', '03'],
  '1-005000': ['01', '02', '03'],
  '2-002050': ['05'],
  '2-003000': ['04'],
  '2-005000': ['04'],
};

const SECURITY_TYPES_BY_ITEM = {
  '1-003000': ['F.3'],
  '1-005000': ['F.511', 'F.512', 'F.519', 'F.52'],
  '2-002050': ['F.3', 'F.511', 'F.512', 'F.519', 'F.52'],
  '2-003000': ['F.3'],
  '2-005000': ['F.511', 'F.512', 'F.519'],
};

const VALID_SECTORS = [
  '11000', '12100', '12200', '12300', '21000', '22110', '22120', '22200',
  '31000', '32100', '32200', '33000', '41000', '42100', '42200', '42900',
  '43000', '44000', '45000', '46000',
];

const VALID_COUPON_TYPES = ['01', '02', '03', '04', '05', '99'];
const VALID_COUPON_FREQS = ['00', '01', '02', '04', '06', '12', '24', '99'];

const COUPON_FREQ_MAX_DAYS = {
  '00': Infinity, '01': 720, '02': 360, '04': 180,
  '06': 124, '12': 62, '24': 31, '99': Infinity,
};

const INVALID_ISIN_PREFIXES = ['DU', 'EV', 'HF', 'HS', 'QS', 'QT', 'QU', 'QY', 'TE', 'XF', 'XX', 'ZZ'];

const FEDERAL_COUNTRIES = [
  'AT', 'AU', 'BE', 'BR', 'CA', 'DE', 'IN', 'MY', 'MX', 'NG',
  'PK', 'RU', 'CH', 'AE', 'US', 'AR', 'BA', 'ET', 'IQ', 'NP', 'SO', 'SS', 'VE',
];

function validateISINCheckDigit(isin) {
  if (!isin || isin.length !== 12) return false;
  const prefix = isin.substring(0, 2);
  if (INVALID_ISIN_PREFIXES.includes(prefix)) return false;
  if (!/^[A-Z]{2}[A-Z0-9]{9}[0-9]$/.test(isin)) return false;

  let digits = '';
  for (let i = 0; i < 11; i++) {
    const c = isin.charCodeAt(i);
    if (c >= 48 && c <= 57) digits += String.fromCharCode(c);
    else if (c >= 65 && c <= 90) digits += (c - 55).toString();
    else return false;
  }

  let sum = 0;
  let alt = digits.length % 2 === 1;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = parseInt(digits[i], 10);
    if (alt) { n *= 2; if (n > 9) n -= 9; }
    sum += n;
    alt = !alt;
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit === parseInt(isin[11], 10);
}

function daysBetween(d1, d2) {
  const a = new Date(d1), b = new Date(d2);
  return Math.round((b - a) / (1000 * 60 * 60 * 24));
}

function isLastDayOfMonth(dateStr) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const next = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  return d.getDate() === next.getDate();
}

function validateCoverField(field, value, allValues) {
  const result = { valid: true, message: '' };

  switch (field) {
    case 'endMonthDate':
      if (!value) { result.valid = false; result.message = 'Required'; }
      else if (!isLastDayOfMonth(value)) { result.valid = false; result.message = 'Must be the last day of a calendar month'; }
      break;
    case 'closingDate':
      if (!value) { result.valid = false; result.message = 'Required'; }
      else if (allValues.endMonthDate && value > allValues.endMonthDate) {
        result.valid = false; result.message = 'Must be ≤ End of Month Date';
      }
      break;
    case 'reporterType':
    case 'declarantType':
      if (!value) { result.valid = false; result.message = 'Required'; }
      else if (!/^[0-9]{2}$/.test(value)) { result.valid = false; result.message = 'Must be exactly 2 numeric digits'; }
      break;
    case 'reporterCode':
    case 'declarantCode':
      if (!value || !value.trim()) { result.valid = false; result.message = 'Required — non-empty string'; }
      break;
    case 'reportingCurrency':
      if (!value) { result.valid = false; result.message = 'Required'; }
      break;
    case 'layout':
      if (value !== '1') { result.valid = false; result.message = 'Must be 1'; }
      break;
  }
  return result;
}

function validateSecurity(sec, coverData) {
  const errors = [];
  const warnings = [];
  const item = sec.item;
  const isAsset = ASSET_ITEMS.includes(item);
  const isISIN = sec.codeType === '1';
  const isDebt = item === '1-003000' || item === '2-003000' || (item === '2-002050' && sec.securityType && sec.securityType === 'F.3');
  const isEquityLiabIssued = item === '2-005000';

  // Rule 1: Valid item
  if (!VALID_ITEMS.includes(item)) errors.push(`Rule 1: Invalid item "${item}"`);

  // Rule 3: reportedAmount >= 0
  const amt = parseFloat(sec.reportedAmount);
  if (isNaN(amt)) errors.push('Rule 3: Reported Amount is required');
  else if (amt < 0) errors.push('Rule 3: Reported Amount must be ≥ 0');

  // Rule 9: holdSecurityType
  if (!sec.holdSecurityType) errors.push('Rule 9: Holding Type is required');
  else if (HOLD_TYPES_BY_ITEM[item] && !HOLD_TYPES_BY_ITEM[item].includes(sec.holdSecurityType)) {
    errors.push(`Rule 9: Holding Type "${sec.holdSecurityType}" not allowed for item ${item}. Allowed: ${HOLD_TYPES_BY_ITEM[item].join(', ')}`);
  }

  // Security code
  if (!sec.code || !sec.code.trim()) errors.push('Security Code is required');

  if (isISIN) {
    // Rule 6: ISIN validation
    if (sec.code && !validateISINCheckDigit(sec.code)) {
      errors.push(`Rule 6: ISIN "${sec.code}" fails ISO 6166 validation (invalid prefix or check digit)`);
    }
  } else {
    // codeType = 2
    if (!sec.name || !sec.name.trim()) errors.push('Security Name is required for non-ISIN securities');
    if (!sec.secCurrency || !/^[A-Z]{3}$/.test(sec.secCurrency)) errors.push('Rule 10: Security Currency must be ISO 4217 (3 uppercase letters)');

    // Rule 7: Issuer country
    if (!sec.issuerCountry) errors.push('Rule 7: Issuer Country is required for non-ISIN securities');
    else if (sec.issuerCountry === 'XX') errors.push('Rule 7: Issuer Country "XX" (No breakdown) is not permitted');
    else if (!/^[A-Z]{2}$/.test(sec.issuerCountry)) errors.push('Rule 7: Issuer Country must be 2-letter ISO 3166 code');

    // Rule 8: Issuer sector
    if (!sec.issuerSector) errors.push('Rule 8: Issuer Sector is required for non-ISIN securities');
    else if (sec.issuerSector === '90000') errors.push('Rule 8: Issuer Sector "90000" (No breakdown) is not permitted');
    else if (!VALID_SECTORS.includes(sec.issuerSector)) errors.push(`Rule 8: Issuer Sector "${sec.issuerSector}" is not in authorised list`);

    // Rule 12: Issued non-ISIN securitisation
    if (item === '2-003000' || item === '2-005000') {
      if (sec.issuerCountry && sec.issuerCountry !== 'LU') errors.push(`Rule 12: Issuer Country must be "LU" for item ${item}`);
      if (sec.issuerSector && sec.issuerSector !== '42100') errors.push(`Rule 12: Issuer Sector must be "42100" for item ${item}`);
    }

    // Temporary rule: sector 12100 only for federal countries
    if (sec.issuerSector === '12100' && sec.issuerCountry && !FEDERAL_COUNTRIES.includes(sec.issuerCountry)) {
      warnings.push(`Temp Rule: Sector "12100" (State government) should only be used for countries with a federal structure`);
    }

    // Rule 11: securityType
    if (sec.securityType && SECURITY_TYPES_BY_ITEM[item] && !SECURITY_TYPES_BY_ITEM[item].includes(sec.securityType)) {
      errors.push(`Rule 11: Security Type "${sec.securityType}" not allowed for item ${item}. Allowed: ${SECURITY_TYPES_BY_ITEM[item].join(', ')}`);
    }

    // Debt supplements
    if (sec.securityType === 'F.3' || (isDebt && !isISIN)) {
      // Rule 13: issueDate <= closingDate
      if (sec.issueDate && coverData.closingDate && sec.issueDate > coverData.closingDate) {
        errors.push('Rule 13: Issue Date must be ≤ Closing Date');
      }
      // Rule 14: poolFactor > 0
      const pf = parseFloat(sec.poolFactor);
      if (!isNaN(pf) && pf <= 0) errors.push('Rule 14: Pool Factor must be > 0');
      if (sec.poolFactor === '' || sec.poolFactor === undefined) errors.push('Rule 14: Pool Factor is required (default = 1)');

      // Rule 15 & 16
      if (sec.couponType && !VALID_COUPON_TYPES.includes(sec.couponType)) errors.push(`Rule 15: Coupon Type "${sec.couponType}" is invalid`);
      if (sec.couponFrequency && !VALID_COUPON_FREQS.includes(sec.couponFrequency)) errors.push(`Rule 16: Coupon Frequency "${sec.couponFrequency}" is invalid`);

      // Rule 17: zero coupon bidirectional
      if (sec.couponType === '04' && sec.couponFrequency !== '00') errors.push('Rule 17: Zero coupon type (04) requires frequency "00"');
      if (sec.couponFrequency === '00' && sec.couponType !== '04') errors.push('Rule 17: Zero coupon frequency (00) requires coupon type "04"');

      // Rule 18: couponLastPaymentDate range
      if (sec.couponLastPaymentDate) {
        if (sec.issueDate && sec.couponLastPaymentDate < sec.issueDate) errors.push('Rule 18: Last Coupon Payment Date must be ≥ Issue Date');
        if (sec.finalMaturityDate && sec.couponLastPaymentDate > sec.finalMaturityDate) errors.push('Rule 18: Last Coupon Payment Date must be ≤ Final Maturity Date');
      }

      // Rule 20: frequency coherence
      if (sec.couponFrequency && sec.couponLastPaymentDate && coverData.closingDate) {
        const gap = daysBetween(sec.couponLastPaymentDate, coverData.closingDate);
        const maxDays = COUPON_FREQ_MAX_DAYS[sec.couponFrequency];
        if (gap < 0) warnings.push('Rule 20: Last Coupon Payment Date is after Closing Date');
        else if (maxDays !== Infinity && gap >= maxDays) {
          warnings.push(`Rule 20: Gap (${gap} days) between Closing Date and Last Coupon Payment is inconsistent with frequency "${sec.couponFrequency}" (max ${maxDays} days)`);
        }
      }

      // Rule 21
      if (sec.couponLastPaymentDate && sec.issueDate && sec.finalMaturityDate &&
          sec.couponLastPaymentDate > sec.issueDate && sec.couponLastPaymentDate < sec.finalMaturityDate) {
        if (parseFloat(sec.couponRate) === 0) errors.push('Rule 21: Coupon Rate must be ≠ 0 when last payment is between issue and maturity dates');
      }

      // Rule 22
      if (sec.couponFrequency && sec.couponFrequency !== '00' && sec.couponType === '01') {
        if (parseFloat(sec.couponRate) === 0) errors.push('Rule 22: Coupon Rate must be ≠ 0 for fixed coupon with non-zero frequency');
      }
    }

    // Equity issued supplements (2-005000)
    if (isEquityLiabIssued && !isISIN) {
      // Rule 23-26 are defaults, just warn if missing
      if (sec.dividendAmount === '' || sec.dividendAmount === undefined) warnings.push('Rule 23: Dividend Amount should be provided (default = 0)');
      if (!sec.dividendLastPaymentDate) warnings.push('Rule 24: Dividend Last Payment Date should be provided (default = 2013-12-31)');
      if (!sec.splitDate) warnings.push('Rule 25: Split Date should be provided (default = 2013-12-31)');
      const sr = parseFloat(sec.splitRatio);
      if (isNaN(sr)) warnings.push('Rule 26: Split Ratio should be provided (default = 1)');
      else if (sr <= 0) errors.push('Rule 26: Split Ratio must be > 0');
    }
  }

  // Quotation validation
  if (sec.quotationType === '%') {
    if (amt > 0) {
      const nom = parseFloat(sec.nominalAmount);
      if (isNaN(nom) || nom <= 0) errors.push('Rule 4: Nominal Amount must be > 0 when Reported Amount > 0 (%-quoted)');
    }
    if (!sec.nominalCurrency || sec.nominalCurrency === 'XXX') errors.push('Rule 10: Nominal Currency is required and must not be "XXX"');
    else if (!/^[A-Z]{3}$/.test(sec.nominalCurrency)) errors.push('Rule 10: Nominal Currency must be ISO 4217');
  } else if (sec.quotationType === 'cur') {
    if (amt > 0) {
      const units = parseFloat(sec.numberOfUnits);
      if (isNaN(units) || units <= 0) errors.push('Rule 5: Number of Units must be > 0 when Reported Amount > 0 (currency-quoted)');
    }
  }

  // Custodian bank country for assets
  if (isAsset && !sec.custodianBankCountry) {
    errors.push('Custodian Bank Country is required for asset items');
  } else if (isAsset && sec.custodianBankCountry && !/^[A-Z]{2}$/.test(sec.custodianBankCountry) && sec.custodianBankCountry !== 'XX') {
    errors.push('Custodian Bank Country must be 2-letter ISO code or "XX"');
  }

  return { errors, warnings };
}

function validateAll(coverData, securities) {
  const results = { cover: [], securities: [], totals: [], summary: { errors: 0, warnings: 0, passed: 0 } };

  // Cover sheet validation
  const coverFields = ['endMonthDate', 'closingDate', 'reporterType', 'reporterCode', 'declarantType', 'declarantCode', 'reportingCurrency', 'layout'];
  for (const f of coverFields) {
    const r = validateCoverField(f, coverData[f], coverData);
    results.cover.push({ field: f, ...r });
    if (r.valid) results.summary.passed++;
    else results.summary.errors++;
  }

  // Securities validation
  for (let i = 0; i < securities.length; i++) {
    const { errors, warnings } = validateSecurity(securities[i], coverData);
    results.securities.push({ index: i, security: securities[i], errors, warnings });
    results.summary.errors += errors.length;
    results.summary.warnings += warnings.length;
    if (errors.length === 0 && warnings.length === 0) results.summary.passed++;
  }

  // Totals validation
  const itemTotals = {};
  for (const sec of securities) {
    if (!itemTotals[sec.item]) itemTotals[sec.item] = 0;
    itemTotals[sec.item] += parseFloat(sec.reportedAmount) || 0;
  }

  for (const item of VALID_ITEMS) {
    const total = itemTotals[item] || 0;
    results.totals.push({ item, total: total.toFixed(2), securityCount: securities.filter(s => s.item === item).length });
  }

  return results;
}
