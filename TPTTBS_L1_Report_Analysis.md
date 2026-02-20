# TPTTBS L1 Report Analysis — Security by Security Reporting of Securitisation Vehicles

**Author**: Senior Reporting Analyst, La Banque Postale  
**Regulator**: Banque centrale du Luxembourg (BCL)  
**Legal Basis**: Regulation (EU) n° 1075/2013 (ECB/2013/40)  
**Report Version**: Layout 1, XML Schema v1.4 (r120)  
**Source**: [BCL Securitisation Vehicles Reporting](https://www.bcl.lu/en/Regulatory-reporting/Vehicules_de_titrisation/Instructions/S0214/index.html)

---

## 1. Report Overview

The **TPTTBS** (Tableau Par Titre / Title By Title Balance Sheet) report is a **monthly** security-by-security report submitted by Luxembourg-resident securitisation vehicles (FVCs) to the BCL. It captures granular position data for each security held on the balance sheet, both on the asset and liability sides.

The Excel workbook consists of **3 sheets** (tabs):
1. **Cover** — Header / general information (entity identification, dates, currency)
2. **Assets** — Security-level detail for asset-side items (1-003000 Debt held, 1-005000 Equity held)
3. **Liabilities** — Security-level detail for liability-side items (2-002050 Short sales, 2-003000 Debt issued, 2-005000 Equity issued)

Both report sheets (Assets and Liabilities) use an identical **transposed grid layout** where:
- **Rows** = field labels (Type of identifier code, Code of security identifier, etc.)
- **Columns** = individual securities, grouped under their balance sheet item
- Each item has **ISIN** and **Other** sub-columns
- Under the quotation row, each has **in %** and **in currency** sub-sub-columns
- **Grayed-out cells** indicate fields not applicable for a given combination (e.g., custodian bank is asset-only; debt supplements are marked "(2) Only for debt securities"; dividend/split fields are only for 2-005000)

### Notes on the Excel template
- `(1)` Usually, debt securities are quoted in percentage and equities in currency
- `(2)` Only for debt securities (issue date, maturity, pool factor, coupon fields)

---

## 2. Sheet 1: Cover Sheet (Header Information)

The cover sheet captures **general information** about the reporting entity and the reporting period.

| # | Field Name | XML Element | Data Type | Format / Constraints | Description | DB Source |
|---|-----------|-------------|-----------|---------------------|-------------|-----------|
| 1 | **End of Month Date** | `endMonthDate` | Date | `YYYY-MM-DD`, must be last day of month | Reference date for the reporting period. Always the last calendar day of the month. | Reporting calendar / system parameter |
| 2 | **Closing Date** | `closingDate` | Date | `YYYY-MM-DD`, ≤ end of month date | Date when data was established. May be prior to end-of-month if data unavailable at transmission deadline. | Accounting close date from GL system |
| 3 | **Reporter Type** | `reporterID/type` | String(2) | 2-digit numeric code (e.g., `34` for securitisation vehicles) | Institution type code of the entity transmitting the file (the "reporter"). | Entity master data |
| 4 | **Reporter Code** | `reporterID/code` | String | Non-empty string | Unique identifier of the reporting entity assigned by BCL. | Entity master data (BCL registration) |
| 5 | **Declarant Type** | `declarantID/type` | String(2) | 2-digit numeric code | Institution type code of the securitisation vehicle for which positions are reported (the "declarant"). | Entity master data |
| 6 | **Declarant Code** | `declarantID/code` | String | Non-empty string | Unique identifier of the securitisation vehicle (declarant) assigned by BCL. | Entity master data (BCL registration) |
| 7 | **Reporting Currency** | `reportingCurrency` | String(3) | ISO 4217 (e.g., `EUR`, `USD`) | Currency in which all amounts in the report are expressed. | Accounting system base currency |
| 8 | **Layout** | `layout` | Integer | Must be `1` for this version | Version number of the report layout. | Static = `1` |

### Validation Rules — Cover Sheet
- `endMonthDate` must be a valid date and the last day of a calendar month
- `closingDate` must be ≤ `endMonthDate`
- `reporterID/type` and `declarantID/type` must be exactly 2 numeric digits
- `reporterID/code` and `declarantID/code` must not be empty
- `reportingCurrency` must be a valid ISO 4217 currency code
- `layout` must equal `1`

---

## 3. Sheet 2 (Assets) & Sheet 3 (Liabilities): Report Sheets

The two report sheets capture position data grouped into **5 balance sheet items** across assets and liabilities.

### Sheet 2 — Assets
Contains 2 balance sheet items:
- `1-003000-XX-XXX-90000` — Debt securities held
- `1-005000-XX-XXX-90000` — Equity and investment fund shares/units held

All asset items include the **Custodian Bank Country** field.

### Sheet 3 — Liabilities
Contains 3 balance sheet items:
- `2-002050-XX-XXX-90000` — Short sales of securities
- `2-003000-XX-XXX-90000` — Debt securities issued
- `2-005000-XX-XXX-90000` — Equity, shares and units issued

Liability items do NOT include the Custodian Bank Country field. The debt supplement fields (issue date through coupon rate) are marked "(2) Only for debt securities" and grayed out for equity. The equity supplement fields (dividend, split) appear only for item 2-005000.

### 3.1 Balance Sheet Items (Reported Lines)

| Side | Item Code | Description | Holding Types Allowed |
|------|-----------|-------------|----------------------|
| **Assets** | `1-003000` | Debt securities held | 01, 02, 03 |
| **Assets** | `1-005000` | Equity and investment fund shares/units held | 01, 02, 03 |
| **Liabilities** | `2-002050` | Short sales of securities | 05 |
| **Liabilities** | `2-003000` | Debt securities issued | 04 |
| **Liabilities** | `2-005000` | Equity, shares and units issued | 04 |

Each reported line has a **fixed identifier** composed of:
- `item` — the balance sheet item code (e.g., `1-003000`)
- `country` — always `XX` (no breakdown)
- `currency` — always `XXX` (no breakdown)
- `sector` — always `90000` (no breakdown)

### 3.2 Security-Level Fields

For each balance sheet item, securities are grouped into **ISIN** (code type `1`) and **Other/Non-ISIN** (code type `2`) sections.

---

#### 3.2.1 Common Fields (All Securities)

| # | Field Name | XML Element | Data Type | Constraints | Description | DB Source |
|---|-----------|-------------|-----------|-------------|-------------|-----------|
| 1 | **Code Type** | `securityID/codeType` | Integer | `1` (ISIN) or `2` (Other) | Whether the security is identified by ISIN or an internal code. | Securities master data |
| 2 | **Security Code** | `securityID/code` | String | ISIN: 12 chars, pattern `[A-Z]{2}[A-Z0-9]{9}[0-9]{1}`, must pass ISO 6166 check digit. Other: max 20 chars. | The identification code of the security. | Securities master / custody system |
| 3 | **Holding Type** | `holdSecurityType` | String(2) | See item-specific values below | How the security is held (owned, lent, repo, issued, short-sold). | Position management / trade system |
| 4 | **Reported Amount** | `reportedAmount` | Decimal(5) | ≥ 0 | Balance sheet value in reporting currency. Quoted securities at market price; debt at dirty price (incl. accrued interest). | Accounting system / mark-to-market |

**Holding Type Codes:**
| Code | Meaning | Applicable Items |
|------|---------|-----------------|
| `01` | Securities held, not affected by temporary transfer | 1-003000, 1-005000 |
| `02` | Securities lent | 1-003000, 1-005000 |
| `03` | Securities sold in a repurchase agreement | 1-003000, 1-005000 |
| `04` | Securities issued | 2-003000, 2-005000 |
| `05` | Short sales of securities | 2-002050 |

---

#### 3.2.2 Asset-Only Fields

| # | Field Name | XML Element | Data Type | Constraints | Description | DB Source |
|---|-----------|-------------|-----------|-------------|-------------|-----------|
| 5 | **Custodian Bank Country** | `custodianBankCountry` | String(2) | ISO 3166 or `XX` if no custodian | Country of the custodian bank holding the security. `XX` if not held with a custodian. | Custody system |

---

#### 3.2.3 Additional Fields for ISIN Securities (codeType = 1)

No additional identification fields are needed beyond the ISIN code itself. However, the quotation type data is required:

**For debt securities (`debt`):**

| # | Field | XML Path | Type | Constraints | Description | DB Source |
|---|-------|----------|------|-------------|-------------|-----------|
| 6a | Quotation Type | `debt/percentageQuoted` or `debt/currencyQuoted` | Choice | Exactly one must be provided | Whether the security is quoted in percentage of nominal or in currency units | Market data / securities master |
| 6b | Nominal Amount | `debt/percentageQuoted/nominalAmount` | Decimal(5) | > 0 if reportedAmount > 0 | Face value of the security (for %-quoted) | Position system |
| 6c | Nominal Currency | `debt/percentageQuoted/nominalCurrency` | String(3) | ISO 4217, not `XXX` | Currency of the nominal value | Securities master |
| 6d | Number of Units | `debt/currencyQuoted/numberOfUnits` | Decimal(5) | > 0 if reportedAmount > 0 | Count of individual securities (for currency-quoted) | Position system |

**For equity securities (`equity`):**

| # | Field | XML Path | Type | Constraints | Description | DB Source |
|---|-------|----------|------|-------------|-------------|-----------|
| 7a | Quotation Type | `equity/percentageQuoted` or `equity/currencyQuoted` | Choice | Exactly one must be provided | Whether the security is quoted in percentage or units | Market data |
| 7b | Nominal Amount | `equity/percentageQuoted/nominalAmount` | Decimal(5) | > 0 if reportedAmount > 0 | Face value (for %-quoted equity) | Position system |
| 7c | Nominal Currency | `equity/percentageQuoted/nominalCurrency` | String(3) | ISO 4217, not `XXX` | Currency of nominal | Securities master |
| 7d | Number of Units | `equity/currencyQuoted/numberOfUnits` | Decimal(5) | > 0 if reportedAmount > 0 | Number of shares/units (for currency-quoted) | Position system |

---

#### 3.2.4 Additional Fields for Non-ISIN Securities (codeType = 2)

| # | Field Name | XML Element | Data Type | Constraints | Description | DB Source |
|---|-----------|-------------|-----------|-------------|-------------|-----------|
| 8 | **Security Name** | `securityID/name` | String | Non-empty | Full name/description of the security | Securities master |
| 9 | **Security Currency** | `securityID/currency` | String(3) | ISO 4217 | Currency denomination of the security | Securities master |
| 10 | **Issuer Country** | `issuerID/country` | String(2) | ISO 3166 (not `XX`). For items 2-003000 and 2-005000: must be `LU`. | Country of the security issuer | Issuer master data |
| 11 | **Issuer Sector** | `issuerID/sector` | String(5) | BCL sector code (not `90000`). For items 2-003000 and 2-005000: must be `42100`. | Economic sector of the issuer per ESA 2010 classification | Issuer master data |

**Authorised Sector Codes:**
| Code | Economic Sector |
|------|----------------|
| `11000` | Central government |
| `12100` | State government (only for federal states) |
| `12200` | Local government |
| `12300` | Social security funds |
| `21000` | Non-financial corporations |
| `22110` | Households – Sole proprietors |
| `22120` | Households – Physical persons |
| `22200` | Non-profit institutions serving households |
| `31000` | Central banks |
| `32100` | Deposit taking corporations – Credit institutions |
| `32200` | Deposit taking corporations – Other |
| `33000` | Money market funds |
| `41000` | Non-monetary investment funds |
| `42100` | Securitisation vehicles |
| `42200` | Central counterparties |
| `42900` | Other financial intermediaries |
| `43000` | Financial auxiliaries |
| `44000` | Captive financial institutions and money lenders |
| `45000` | Insurance corporations |
| `46000` | Pension funds |

---

#### 3.2.5 Supplementary Data for Non-ISIN Debt Securities (Items 1-003000, 2-002050 debt, 2-003000)

| # | Field Name | XML Element | Data Type | Constraints | Description | DB Source |
|---|-----------|-------------|-----------|-------------|-------------|-----------|
| 12 | **Security Type** | `supplements/securityType` | String | Must be `F.3` | ESA 2010 instrument classification for debt | Static |
| 13 | **Issue Date** | `supplements/issueDate` | Date | ≤ `closingDate` | Original issuance date of the security | Securities master |
| 14 | **Final Maturity Date** | `supplements/finalMaturityDate` | Date | ≥ issue date; `2999-01-01` for perpetuals | Contractual maturity date | Securities master |
| 15 | **Pool Factor** | `supplements/poolFactor` | Decimal(9) | > 0 (may exceed 1 if includes accrued interest). Default `1` if not applicable. | % of principal remaining to be repaid. Decreases as amortisation occurs. | Loan servicing / trustee reports |
| 16 | **Coupon Type** | `supplements/couponType` | String(2) | `01`=fixed, `02`=progressive, `03`=floating, `04`=zero, `05`=index-linked, `99`=other | Nature of the interest rate | Securities master |
| 17 | **Coupon Frequency** | `supplements/couponFrequency` | String(2) | `00`=zero, `01`=annual, `02`=semi-annual, `04`=quarterly, `06`=bi-monthly, `12`=monthly, `24`=fortnightly, `99`=other | Number of coupon payments per year | Securities master |
| 18 | **Last Coupon Payment Date** | `supplements/couponLastPaymentDate` | Date | ≥ `issueDate`, ≤ `finalMaturityDate`. If no payment made yet: equals issue date. | Date of the most recent coupon payment | Cash flow / payment system |
| 19 | **Coupon Rate** | `supplements/couponRate` | Decimal(9) | Annualised %, e.g., `5.5` for 5.5%. Must be ≠ 0 under certain conditions (see rules 21-22). | Current annualised interest rate at reporting date | Market data / deal terms |

---

#### 3.2.6 Supplementary Data for Non-ISIN Equity Securities — Assets (Items 1-005000, 2-002050 equity)

| # | Field Name | XML Element | Data Type | Constraints | Description | DB Source |
|---|-----------|-------------|-----------|-------------|-------------|-----------|
| 20 | **Security Type** | `supplements/securityType` | String | `F.511` (quoted shares), `F.512` (unquoted shares), `F.519` (other equity), `F.52` (investment fund shares/units) | ESA 2010 equity instrument classification | Securities master |

---

#### 3.2.7 Supplementary Data for Non-ISIN Equity — Liabilities Issued (Item 2-005000)

| # | Field Name | XML Element | Data Type | Constraints | Description | DB Source |
|---|-----------|-------------|-----------|-------------|-------------|-----------|
| 20 | **Security Type** | `supplements/securityType` | String | `F.511`, `F.512`, or `F.519` (not `F.52` for issued equity) | ESA 2010 classification | Securities master |
| 21 | **Dividend Amount** | `supplements/dividendAmount` | Decimal(9) | ≥ 0, default `0` | Dividend expressed as % of reportedAmount | Dividend records / corporate actions |
| 22 | **Dividend Last Payment Date** | `supplements/dividendLastPaymentDate` | Date | Default `2013-12-31` if no dividend paid | Date of the last dividend payment | Corporate actions |
| 23 | **Split Date** | `supplements/splitDate` | Date | Default `2013-12-31` if no split occurred | Date of the last share split or reverse split | Corporate actions |
| 24 | **Split Ratio** | `supplements/splitRatio` | Decimal | Default `1`. Split > 1, reverse split between 0 and 1. | Ratio of new shares per existing share | Corporate actions |

---

#### 3.2.8 Line Totals

| # | Field Name | XML Element | Data Type | Constraints | Description | DB Source |
|---|-----------|-------------|-----------|-------------|-------------|-----------|
| 25 | **Total Reported Amount** | `totalReportedAmount` | Decimal(5) | ≥ 0, must equal sum of all `reportedAmount` values for securities in the same reported line | Aggregated balance sheet amount for the entire line | Computed: sum of individual security amounts |

---

## 4. Complete Validation Rules (BCL Compendium)

### 4.1 Permanent Internal Verification Rules

| Rule # | Description | Implementation |
|--------|-------------|----------------|
| 1 | Only authorised items: `1-003000`, `1-005000`, `2-002050`, `2-003000`, `2-005000` | Validate item code against allowed list |
| 2 | Only authorised line identifiers (item-XX-XXX-90000) | Validate country=`XX`, currency=`XXX`, sector=`90000` |
| 3 | `reportedAmount` ≥ 0 for each security | Non-negative check |
| 4 | If %-quoted and `reportedAmount` > 0 → `nominalAmount` > 0 | Conditional positive check |
| 5 | If currency-quoted and `reportedAmount` > 0 → `numberOfUnits` > 0 | Conditional positive check |
| 6 | ISIN codes must comply with ISO 6166: valid 2-letter country prefix (not `DU`, `EV`, `HF`, `HS`, `QS`, `QT`, `QU`, `QY`, `TE`, `XF`, `XX`, `ZZ`), plus check digit validation | ISIN validation algorithm |
| 7 | Non-ISIN issuer country: valid ISO 3166, not `XX` | Country code validation |
| 8 | Non-ISIN issuer sector: from authorised list (see section 3.2.4) | Sector code validation |
| 9 | `holdSecurityType` must match item: assets → `01/02/03`, short sales → `05`, issued → `04` | Cross-field validation |
| 10 | Nominal currency must be ISO 4217, not `XXX` | Currency code validation |
| 11 | `securityType` per item: `1-003000`→`F.3`, `1-005000`→`F.511/F.512/F.519/F.52`, `2-002050`→all, `2-003000`→`F.3`, `2-005000`→`F.511/F.512/F.519` | Allowed values per item |
| 12 | Issued non-ISIN securitisation: issuer country=`LU`, sector=`42100`, holdType=`04` | Combination validation |
| 13 | `issueDate` ≤ `closingDate` | Date comparison |
| 14 | `poolFactor` > 0 (may exceed 1 in exceptional cases). Default = 1. | Positive check |
| 15 | `couponType` in (`01`,`02`,`03`,`04`,`05`,`99`) | Enumeration check |
| 16 | `couponFrequency` in (`00`,`01`,`02`,`04`,`06`,`12`,`24`,`99`) | Enumeration check |
| 17 | `couponType`=`04` (zero) ↔ `couponFrequency`=`00` (zero). Must be used together, exclusively. | Bi-conditional check |
| 18 | `couponLastPaymentDate` ≥ `issueDate` and ≤ `finalMaturityDate`. If no payment: equals issue date. | Date range check |
| 19 | `couponRate` is annualised %, e.g., 5.5 for 5.5% | Format check |
| 20 | `closingDate − couponLastPaymentDate` must be coherent with frequency: `01`<720d, `02`<360d, `04`<180d, `06`<124d, `12`<62d, `24`<31d | Date-frequency coherence |
| 21 | If `couponLastPaymentDate` > `issueDate` and < `finalMaturityDate` → `couponRate` ≠ 0 | Conditional non-zero check |
| 22 | If `couponFrequency` ≠ `00` and `couponType` = `01` (fixed) → `couponRate` ≠ 0 | Conditional non-zero check |
| 23 | `dividendAmount` default = `0` | Default value |
| 24 | `dividendLastPaymentDate` default = `2013-12-31` | Default value |
| 25 | `splitDate` default = `2013-12-31` | Default value |
| 26 | `splitRatio` default = `1`. Split > 1, reverse split between 0 and 1. | Range check |

### 4.2 Cross-Report Verification Rules (TPTTBS vs S2.14)

| Rule | Description |
|------|-------------|
| CR-1 | `totalReportedAmount` for line `1-003000-XX-XXX-90000` must match S2.14 amount |
| CR-2 | `totalReportedAmount` for line `1-005000-XX-XXX-90000` must match S2.14 amount |
| CR-3 | `totalReportedAmount` for line `2-002050-XX-XXX-90000` must match S2.14 amount |
| CR-4 | `totalReportedAmount` for line `2-003000-XX-XXX-90000` must match S2.14 amount |
| CR-5 | `totalReportedAmount` for line `2-005000-XX-XXX-90000` must match S2.14 amount |

### 4.3 Line Total Integrity

For each of the 5 reported lines:

```
totalReportedAmount = Σ reportedAmount (all ISIN securities) + Σ reportedAmount (all non-ISIN securities)
```

---

## 5. Data Flow from Bank's Database

### 5.1 Source Systems Required

| System | Data Provided |
|--------|--------------|
| **Entity Master / BCL Registry** | Reporter and declarant codes, institution types |
| **Securities Master Data** | ISIN codes, security names, currencies, issuer details, instrument type, coupon parameters |
| **Custody / Position System** | Holdings (quantities, nominal amounts), custodian bank country |
| **Accounting / General Ledger** | Reported amounts (balance sheet values in reporting currency), closing dates |
| **Market Data / Pricing** | Current market prices for mark-to-market valuation, dirty prices for debt |
| **Loan Servicing / Trustee** | Pool factors for securitised assets |
| **Corporate Actions** | Dividends, splits, reverse splits |
| **Trade / Position Management** | Holding types (owned, lent, repo, issued, short-sold) |

### 5.2 Typical SQL Query Pattern

```sql
SELECT
    s.isin_code,
    s.internal_code,
    s.security_name,
    s.currency_code,
    s.instrument_type,                -- maps to securityType (F.3, F.511, etc.)
    s.issuer_country,
    s.issuer_sector_code,
    p.holding_type,                   -- maps to holdSecurityType
    p.custodian_country,
    p.nominal_amount,
    p.nominal_currency,
    p.number_of_units,
    p.balance_sheet_value_reporting_ccy AS reported_amount,
    s.issue_date,
    s.maturity_date,
    s.pool_factor,
    s.coupon_type,
    s.coupon_frequency,
    s.last_coupon_date,
    s.coupon_rate,
    ca.dividend_rate,
    ca.last_dividend_date,
    ca.split_date,
    ca.split_ratio
FROM positions p
JOIN securities s ON p.security_id = s.security_id
LEFT JOIN corporate_actions ca ON s.security_id = ca.security_id
    AND ca.effective_date <= :end_month_date
WHERE p.position_date = :end_month_date
    AND p.entity_id = :declarant_code
    AND s.instrument_type IN ('DEBT', 'EQUITY', 'FUND')
ORDER BY s.instrument_type, s.isin_code NULLS LAST;
```

---

## 6. Decision Tree for Security Reporting

```
START → Does the security have a valid ISIN code?
│
├── YES (codeType = 1)
│   ├── Is it a debt security?
│   │   ├── Quoted in % of nominal? → Report: nominalAmount + nominalCurrency
│   │   └── Quoted in currency?     → Report: numberOfUnits
│   └── Is it an equity/fund share?
│       ├── Quoted in % of nominal? → Report: nominalAmount + nominalCurrency
│       └── Quoted in currency?     → Report: numberOfUnits
│
└── NO (codeType = 2) → Report: code + name + currency + issuerCountry + issuerSector
    ├── Is it a debt security? → Report all debt supplements:
    │   securityType=F.3, issueDate, finalMaturityDate, poolFactor,
    │   couponType, couponFrequency, couponLastPaymentDate, couponRate
    │   + quotation data (nominal or units)
    │
    ├── Is it equity (asset side / short sale)?
    │   → Report: securityType (F.511/F.512/F.519/F.52) + quotation data
    │
    └── Is it equity (liability side, item 2-005000)?
        → Report: securityType (F.511/F.512/F.519) + dividendAmount
        + dividendLastPaymentDate + splitDate + splitRatio + quotation data
```

---

## 7. XML File Naming Convention

```
TPTTBS_L1_YYYYMM_Tnnnnnnnnn_Tnnnnnnnnn_YYYYMMDD_NNN.xml
```

| Part | Description |
|------|-------------|
| `TPTTBS_L1` | Report identifier and layout |
| `YYYYMM` | Reference period (year + month) |
| `Tnnnnnnnnn` (1st) | Reporter code prefixed by `T` |
| `Tnnnnnnnnn` (2nd) | Declarant code prefixed by `T` |
| `YYYYMMDD` | File creation date |
| `NNN` | Sequence number (001, 002, ...) |

---

## 8. Key Regulatory Definitions

- **Securitisation Vehicle (FVC)**: Financial Vehicle Corporation engaged in securitisation transactions as defined in Regulation ECB/2013/40
- **Dirty Price**: Market price of a debt security including accrued interest since the last coupon payment
- **Pool Factor**: The fraction of the original principal that remains outstanding; decreases with amortisation payments
- **ISIN**: International Securities Identification Number per ISO 6166 — a 12-character alphanumeric code
- **ESA 2010**: European System of Accounts 2010 — the classification framework for financial instruments and institutional sectors
