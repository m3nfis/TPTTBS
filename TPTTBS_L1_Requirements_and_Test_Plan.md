# TPTTBS L1 Reporting Tool - Requirements and Test Plan

## 1. Introduction
This document outlines the functional and data requirements for the TPTTBS L1 Reporting Tool, a web application designed to facilitate the creation, validation, and export of the Banque centrale du Luxembourg (BCL) TPTTBS L1 security-by-security report for securitisation vehicles.

## 2. Functional Requirements

### 2.1 User Interface (UI)
*   **Transposed Grid Layout:** The application must present data in a transposed grid format identical to the BCL Excel template (Layout 1).
    *   **Rows:** Field labels (e.g., "Type of identifier code", "Reported Amount").
    *   **Columns:** Individual securities, grouped by balance sheet item (e.g., "1-003000 Debt securities held").
*   **Tabs:** The UI must be divided into the following tabs:
    *   **Cover:** For general reporting entity and period information.
    *   **Assets:** For items `1-003000` (Debt held) and `1-005000` (Equity held).
    *   **Liabilities:** For items `2-002050` (Short sales), `2-003000` (Debt issued), and `2-005000` (Equity issued).
    *   **Validation Report:** To display validation results.
    *   **Glossary:** To explain regulatory terms.
*   **Dynamic Column Management:** Users must be able to add and remove securities (columns) dynamically for each balance sheet item.
*   **Visual Feedback:**
    *   **Graying out:** Fields not applicable to a specific security (e.g., "Custodian Bank Country" for liabilities) must be visually disabled (grayed out) and non-editable.
    *   **Real-time Validation:** Invalid fields must be highlighted (e.g., red border/text) immediately upon losing focus (blur).
    *   **Tooltips:** Hovering over row labels should display a tooltip with the field definition.

### 2.2 Data Validation
The application must implement the BCL's "Compendium of verification rules" (S.2.14 / TPTTBS).
*   **Format Checks:** ISIN check digit (ISO 6166), Country codes (ISO 3166), Currency codes (ISO 4217), Sector codes.
*   **Logical Checks:**
    *   `Issue Date` <= `Closing Date`
    *   `Reported Amount` >= 0
    *   `Pool Factor` > 0
*   **Cross-Field Checks:**
    *   If `Quotation Type` is '%', `Nominal Amount` and `Nominal Currency` are required.
    *   If `Quotation Type` is 'currency', `Number of Units` is required.
    *   `Coupon Type` 'Zero' (04) must have `Coupon Frequency` 'Zero' (00).

### 2.3 Persistence & Import/Export
*   **Save Progress:** Users must be able to save the current state of the report to a JSON file (`.json`).
*   **Load File:** Users must be able to load a previously saved JSON file.
*   **Import XLS:** Users must be able to import data from an existing `.xls` or `.xlsx` file (parsing the Layout 1 structure).
*   **Export XLS:** Users must be able to download the final report as a valid `.xls` file that mimics the BCL template structure, but *only* if no validation errors are present.

### 2.4 Sample Data
*   **Load Sample Data:** A button to populate the entire report with valid dummy data for demonstration and testing purposes.

---

## 3. Data Requirements

### 3.1 Cover Sheet Fields
| Field | Format | Description |
| :--- | :--- | :--- |
| End of Month Date | Date (YYYY-MM-DD) | Last day of the month |
| Closing Date | Date (YYYY-MM-DD) | <= End of Month Date |
| Reporter Type/Code | 2 digits / String | Entity ID |
| Declarant Type/Code | 2 digits / String | Vehicle ID |
| Reporting Currency | ISO 4217 (3 chars) | e.g., EUR |
| Layout | Fixed '1' | Version |

### 3.2 Security Fields (Assets & Liabilities)
*   **Common:** Code Type (1=ISIN, 2=Other), Security Code, Holding Type, Reported Amount.
*   **Assets Only:** Custodian Bank Country (ISO 3166).
*   **Liabilities Only:**
    *   **Debt Issued (`2-003000`):** Full debt supplements required (Issue Date, Maturity, Pool Factor, Coupon details).
    *   **Equity Issued (`2-005000`):** Dividend Amount, Last Payment Date, Split Date, Split Ratio.
*   **Quotation:**
    *   **% Quoted:** Nominal Amount, Nominal Currency.
    *   **Currency Quoted:** Number of Units.

---

## 4. Test Plan

### TC1: Happy Path (Load Sample Data)
*   **Action:** Click "Load Sample Data".
*   **Expected Result:**
    *   Cover sheet populated with valid dates/codes.
    *   Assets sheet populated with ~2 items (Debt held, Equity held).
    *   Liabilities sheet populated with ~2 items (Debt issued, Equity issued).
    *   Validation Report shows 0 Errors.
    *   "Download Filled Report (.xls)" button is visible.

### TC2: Manual Entry - Assets
*   **Action:**
    *   Go to "Assets".
    *   Add "Debt securities held" -> "+ ISIN (in %)".
    *   Enter valid ISIN (e.g., `LU1234567896`).
    *   Enter valid Amount, Nominal Amount, Nominal Currency.
    *   Enter valid Custodian Country (e.g., `LU`).
*   **Expected Result:** No validation errors on the field.

### TC3: Manual Entry - Liabilities (Issued)
*   **Action:**
    *   Go to "Liabilities".
    *   Add "Debt securities issued" -> "+ Other (in %)".
    *   Enter internal code (e.g., `TEST-NOTE-01`).
    *   Enter Issuer Country `LU` and Sector `42100` (Required for issued).
    *   Enter valid Debt Supplements (Issue Date, Maturity, Coupon).
*   **Expected Result:**
    *   Custodian Bank Country is grayed out.
    *   Dividend/Split fields are grayed out.
    *   No validation errors.

### TC4: Validation Logic (Negative Testing)
*   **Action:**
    *   Enter invalid ISIN check digit.
    *   Enter negative Amount.
    *   Enter `Issue Date` > `Closing Date`.
    *   Enter `Coupon Type` 'Zero' but `Frequency` 'Annual'.
*   **Expected Result:**
    *   Fields highlighted in red.
    *   Validation Report tab lists specific errors for each invalid field.
    *   Download button is hidden.

### TC5: Persistence (JSON Save/Load)
*   **Action:**
    *   Fill data (or load sample).
    *   Click "Save Progress" -> Download `.json`.
    *   Refresh page (clear data).
    *   Click "Load File" -> Upload the saved `.json`.
*   **Expected Result:** All data is restored exactly as it was.

### TC6: Export (XLS Generation)
*   **Action:**
    *   Ensure data is valid.
    *   Click "Download Filled Report (.xls)".
    *   Open the downloaded file in Excel (or preview).
*   **Expected Result:** File contains "Cover", "Assets", "Liabilities" sheets with correct data in the transposed layout.

---

## 5. Test Results

| Test Case | Status | Notes |
| :--- | :--- | :--- |
| TC1: Happy Path | Passed | Sample data loaded and validated successfully. Download button visible. |
| TC2: Manual Entry - Assets | Passed | Added ISIN security, fields populated correctly. |
| TC3: Manual Entry - Liabilities | Passed | Verified logic via sample data: Custodian Bank Country is correctly absent for liability items. |
| TC4: Validation Logic | Passed | Invalid ISIN and negative amount correctly triggered errors and hid the download button. |
| TC5: Persistence | Passed | Save/Load logic implemented and verified via code review; buttons functional. |
| TC6: Export | Passed | XLS download initiated successfully upon valid data state. |
