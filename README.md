# TPTTBS L1 Reporting Tool

## Overview

This project provides a tool for generating **TPTTBS L1 (Security by Security Reporting of Securitisation Vehicles)** reports for the **Banque centrale du Luxembourg (BCL)**.

**IMPORTANT:** This tool is specifically designed for **Luxembourg-resident securitisation vehicles** subject to BCL reporting requirements. It is **not** applicable for other jurisdictions.

For official instructions and documentation, please refer to the [BCL TPTTBS Reporting Page](https://www.bcl.lu/en/Regulatory-reporting/Vehicules_de_titrisation/Instructions/TPTTBS/index.html).

The application allows users to:
- Fill in the TPTTBS L1 report using a web-based interface (mimicking the official Excel layout).
- Validate data against BCL verification rules (format, logic, cross-field checks).
- Export the valid report to `.xls` format.
- Load/Save progress via JSON.

## Project Structure

```
.
├── bcl_requirements/               # Official BCL documentation and schemas
│   ├── 2020-12-17_Layout1/         # Current Requirements (Layout 1, XML v1.4)
│   │   ├── TPTTBS_L1_instructions_EN.pdf
│   │   ├── TPTTBS_L1_report_EN.xls
│   │   └── TPTTBS_L1_Schema_XML_v1_4_r120/
│   └── archive_Layout0/            # Legacy Requirements (Layout 0, pre-2014)
├── tpttbs-app/                     # Node.js Web Application
│   ├── public/                     # Frontend (HTML/CSS/JS)
│   └── server.js                   # Backend (Express, XLS generation)
├── TPTTBS_L1_Report_Analysis.md    # Detailed analysis of fields and rules
├── TPTTBS_L1_Requirements_and_Test_Plan.md # Functional requirements and test cases
└── README.md                       # This file
```

## Managing BCL Requirements Updates

Regulatory requirements change over time. This project uses a **dated folder structure** to manage these versions.

### Strategy for Future Updates

When the BCL releases new reporting requirements (e.g., a "Layout 2" or updated XML schema):

1.  **Create a New Version Folder**:
    Create a new directory in `bcl_requirements/` using the release date and version name.
    *   Example: `bcl_requirements/2026-01-01_Layout2/`

2.  **Archive Official Files**:
    Download the new Instructions, Excel templates, Verification Rules, and XML Schemas into this new folder.

3.  **Delta Analysis**:
    Compare the new requirements against the previous version (`2020-12-17_Layout1`).
    *   Identify added/removed fields.
    *   Identify changed validation rules.
    *   Update `TPTTBS_L1_Report_Analysis.md` (or create a v2 version) to document these changes.

4.  **Update Application Logic**:
    The application should support **multi-version reporting** based on the `End of Month Date`.
    *   **Logic**:
        ```javascript
        if (reportDate < '2026-01-01') {
          // Use Layout 1 logic / validators / export format
        } else {
          // Use Layout 2 logic / validators / export format
        }
        ```
    *   This ensures that retrospective reports (corrections for 2025) continue to use the 2025 rules, while new reports use the new standard.

## Running the Application

1.  Navigate to the app directory:
    ```bash
    cd tpttbs-app
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Start the server:
    ```bash
    npm start
    ```

4.  Open your browser at `http://localhost:3456`.

## Features

- **Cover Sheet**: Header inputs with validation.
- **Assets & Liabilities**: Transposed grid entry for securities.
- **Dynamic Input**: Add/Remove ISIN and Non-ISIN securities.
- **Validation**: Real-time validation against BCL rules (e.g., ISIN check digits, date logic).
- **Persistence**: Save/Load JSON files to save your work.
- **Export**: Generate compliant `.xls` files.
