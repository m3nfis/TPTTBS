const GLOSSARY = [
  {
    term: 'TPTTBS (Tableau Par Titre / Title By Title Balance Sheet)',
    definition: 'A monthly security-by-security report submitted by Luxembourg-resident securitisation vehicles (FVCs) to the Banque centrale du Luxembourg (BCL). It captures granular position data for each security held on the balance sheet, both on the asset and liability sides.',
    source: 'BCL TPTTBS Instructions, September 2018'
  },
  {
    term: 'Securitisation Vehicle (FVC / Financial Vehicle Corporation)',
    definition: 'An undertaking, whether or not incorporated, which carries out securitisation transactions. Each securitisation vehicle is ring-fenced from the originator and issues securities, securitisation fund units, or other debt instruments to investors. As defined in Regulation (EU) n° 1075/2013 (ECB/2013/40).',
    source: 'Regulation ECB/2013/40, Article 1(1)'
  },
  {
    term: 'ISIN (International Securities Identification Number)',
    definition: 'A 12-character alphanumeric code that uniquely identifies a specific securities issue, structured per ISO 6166. The first two characters are the country code (ISO 3166), followed by 9 alphanumeric characters (the national security identifying number), and ending with a single check digit computed using the Luhn algorithm on the numeric equivalent of all preceding characters.',
    source: 'ISO 6166:2021'
  },
  {
    term: 'ESA 2010 (European System of Accounts 2010)',
    definition: 'The European accounting framework for a systematic and detailed description of economies. It provides the classification of financial instruments (F.3 debt, F.511 quoted shares, F.512 unquoted shares, F.519 other equity, F.52 investment fund shares/units) and institutional sectors used throughout the TPTTBS report.',
    source: 'Regulation (EU) No 549/2013'
  },
  {
    term: 'Dirty Price',
    definition: 'The total price of a bond including accrued interest since the last coupon payment. Dirty Price = Clean Price + Accrued Interest. The TPTTBS report requires debt securities to be valued at dirty price, meaning the reported amount includes both the market value and any interest earned but not yet paid.',
    source: 'BCL TPTTBS Instructions, Section 4.8'
  },
  {
    term: 'Pool Factor',
    definition: 'A decimal representing the percentage of the original principal of a securitised asset that remains outstanding. The pool factor starts at 1 (100%) and decreases as principal repayments are made. For securities with bullet repayment only, the pool factor is 1 until maturity. When the pool factor includes accrued interest, it can temporarily exceed 1. It must always be > 0 while the security is outstanding.',
    source: 'BCL TPTTBS Instructions, Section 4.7.1.4'
  },
  {
    term: 'Hold Security Type / Type of Holding',
    definition: 'A classification indicating how a security is held or the nature of the position: 01 = Securities held without temporary transfer; 02 = Securities lent; 03 = Securities sold in a repurchase agreement (repo); 04 = Securities issued; 05 = Short sales of securities. The economic holder concept applies — a lender of securities is still considered the holder.',
    source: 'BCL TPTTBS Instructions, Section 4.4'
  },
  {
    term: 'Reported Line (Balance Sheet Line)',
    definition: 'A grouping identifier in the TPTTBS report composed of: item (e.g., 1-003000), country (always XX), currency (always XXX), and sector (always 90000). Each reportedLine groups all individual securities that belong to the same balance sheet category and must have a totalReportedAmount equal to the sum of all individual reportedAmounts.',
    source: 'BCL TPTTBS Instructions, Section 4.1'
  },
  {
    term: 'End of Month Date (endMonthDate)',
    definition: 'The reference date for the TPTTBS report, always the last calendar day of the reporting month. Positions are reported as of this date. The report is due 20 working days after this date.',
    source: 'BCL TPTTBS Instructions, Section 2.2'
  },
  {
    term: 'Closing Date (closingDate)',
    definition: 'The date on which the reported data was actually prepared/established. This may be earlier than the end-of-month date if final data was not available by the submission deadline. The closing date must be ≤ the end-of-month date.',
    source: 'BCL TPTTBS Instructions, Section 2.3'
  },
  {
    term: 'Reporter vs Declarant',
    definition: 'The Reporter (reporterID) is the entity responsible for transmitting the file to the BCL. The Declarant (declarantID) is the specific securitisation vehicle whose positions are being reported. They may be different entities — e.g., a management company reporting on behalf of multiple vehicles.',
    source: 'BCL TPTTBS Instructions, Section 5.1'
  },
  {
    term: 'Percentage Quoted vs Currency Quoted',
    definition: 'Percentage Quoted: The security is traded in percentage points of its nominal/face value (typical for bonds). The reporting requires the nominal amount and nominal currency. Currency Quoted: The security is traded in monetary units (typical for equities). The reporting requires the number of individual units/shares.',
    source: 'BCL TPTTBS Instructions, Section 4.5'
  },
  {
    term: 'Coupon Type',
    definition: 'Classification of the interest rate mechanism for a debt security: 01 = Fixed (constant rate throughout the life), 02 = Progressive/Stepped (rate changes at predetermined intervals), 03 = Floating (rate resets periodically based on a reference rate), 04 = Zero Coupon (no periodic interest, issued at discount), 05 = Index-Linked (rate tied to an index), 99 = Other.',
    source: 'BCL TPTTBS Instructions, Section 4.7.1.5'
  },
  {
    term: 'Coupon Frequency',
    definition: 'The number of coupon payments per year: 00 = Zero coupon, 01 = Annual, 02 = Semi-annual, 04 = Quarterly, 06 = Bi-monthly, 12 = Monthly, 24 = Fortnightly, 99 = Other. Zero coupon frequency (00) must only be used with zero coupon type (04) and vice versa.',
    source: 'BCL TPTTBS Instructions, Section 4.7.1.6'
  },
  {
    term: 'Split / Reverse Split',
    definition: 'A corporate action that changes the number of outstanding shares. In a split, each existing share becomes multiple shares (ratio > 1). In a reverse split, multiple shares are consolidated into fewer shares (ratio between 0 and 1). Default values when no split occurred: date = 2013-12-31, ratio = 1.',
    source: 'BCL TPTTBS Instructions, Section 4.7.3.4-5'
  },
  {
    term: 'S 2.14 (Quarterly Statistical Balance Sheet)',
    definition: 'The quarterly statistical balance sheet report for securitisation vehicles, also submitted to the BCL. The TPTTBS totalReportedAmount values for each balance sheet line must reconcile with the corresponding amounts reported in S 2.14.',
    source: 'BCL Verification Rules, Section 2.1.2'
  },
  {
    term: 'Layout',
    definition: 'The version identifier of the report structure. Layout 1 is the current version of the TPTTBS report, in force since December 2015. It replaced Layout 0 (the original version from 2009).',
    source: 'BCL TPTTBS Instructions, Section 2.4'
  },
  {
    term: 'Custodian Bank Country',
    definition: 'The ISO 3166 country code of the custodian bank holding the security. This is reported only for asset-side positions. If the security is not held within a custodian bank, the code "XX" must be used. The BCL needs this to track whether securities are held with Luxembourg custodian banks.',
    source: 'BCL TPTTBS Instructions, Section 4.6'
  },
  {
    term: 'Nominal Amount / Nominal Capital',
    definition: 'The face value of a security, expressed in the nominal currency. For percentage-quoted debt securities, this represents the original principal amount before any market price fluctuations. The pool factor must NOT be taken into account for the valuation of the nominal.',
    source: 'BCL TPTTBS Instructions, Section 4.5'
  },
  {
    term: 'Institutional Sector Codes (BCL)',
    definition: 'ESA 2010-based classification of economic sectors used for identifying issuers: 11000 (Central gov), 12100 (State gov — federal states only), 12200 (Local gov), 12300 (Social security), 21000 (Non-financial corps), 31000 (Central banks), 32100 (Credit institutions), 33000 (MMFs), 41000 (Non-monetary inv. funds), 42100 (Securitisation vehicles), 42200 (CCPs), 42900 (Other FIs), 43000 (Fin. auxiliaries), 44000 (Captive FIs), 45000 (Insurance corps), 46000 (Pension funds).',
    source: 'BCL Verification Rules, Rule 8'
  },
  {
    term: 'Repurchase Agreement (Repo)',
    definition: 'A transaction in which one party sells securities to another with an agreement to repurchase them at a specified date and price. Under the economic ownership principle used in TPTTBS, the original seller remains the economic holder (holdSecurityType = 03). The buyer does NOT report these securities on its balance sheet.',
    source: 'BCL TPTTBS Instructions, Section 4.4'
  },
  {
    term: 'Short Sale',
    definition: 'A sale of securities that the seller does not own at the time of the sale. Short sales must be reported on the liability side under item 2-002050 with holdSecurityType = 05 to avoid double counting. The reportedAmount represents the obligation to return the borrowed securities.',
    source: 'BCL TPTTBS Instructions, Section 4.4'
  },
  {
    term: 'CSSF (Commission de Surveillance du Secteur Financier)',
    definition: 'The Luxembourg financial regulatory authority that supervises most securitisation vehicles. However, the TPTTBS reporting obligation applies to all FVCs regardless of whether they are supervised by the CSSF.',
    source: 'BCL TPTTBS Instructions, Section 1.1'
  },
  {
    term: 'Derogation (Reporting Exemption)',
    definition: 'Under Regulation ECB/2013/40, the BCL may exempt smaller securitisation vehicles from reporting obligations, provided that the remaining reporting population covers at least 95% of total FVC assets. The BCL selects the reporting sample and revises it annually.',
    source: 'BCL TPTTBS Instructions, Section 1.1'
  },
];
