const express = require('express');
const path = require('node:path');
const XLSX = require('xlsx');

const app = express();
const PORT = process.env.PORT || 3456;

app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const FIELD_LABELS = [
  'Type of identifier code', 'Code of security identifier', 'Type of holding',
  'Amount', 'Type of quotation', 'Nominal amount', 'Nominal currency',
  'Number of units', 'Country of custodian bank', 'Name of the security',
  'Issuer country', 'Security currency', 'Issuer sector', 'Type of security',
  'Date of issue', 'Date of final maturity', 'Pool factor', 'Coupon type',
  'Coupon frequency', 'Payment date of the last coupon', 'Coupon rate',
  'Dividend amount (in % of reported amt)', 'Payment date of the last dividend',
  'Split date', 'Split ratio',
];

const FIELD_KEYS = [
  'codeType', 'code', 'holdSecurityType', 'reportedAmount', 'quotationType',
  'nominalAmount', 'nominalCurrency', 'numberOfUnits', 'custodianBankCountry',
  'name', 'issuerCountry', 'secCurrency', 'issuerSector', 'securityType',
  'issueDate', 'finalMaturityDate', 'poolFactor', 'couponType', 'couponFrequency',
  'couponLastPaymentDate', 'couponRate', 'dividendAmount', 'dividendLastPaymentDate',
  'splitDate', 'splitRatio',
];

function buildReportSheet(sheetTitle, sideNum, items, allSecurities) {
  const rows = [];
  rows.push(['Security by security reporting of securitisation vehicles', '', 'Layout 1']);
  rows.push([]);
  rows.push([`${sideNum}  ${sheetTitle}`]);

  for (const item of items) {
    const secs = allSecurities.filter(s => s.item === item);
    rows.push([]);
    rows.push([`${item}-XX-XXX-90000`]);

    const headerRow = [''];
    for (let i = 0; i < secs.length; i++) headerRow.push(`Security ${i + 1}`);
    rows.push(headerRow);

    for (let f = 0; f < FIELD_LABELS.length; f++) {
      const row = [FIELD_LABELS[f]];
      for (const sec of secs) row.push(sec[FIELD_KEYS[f]] || '');
      rows.push(row);
    }

    let total = 0;
    for (const sec of secs) total += Number.parseFloat(sec.reportedAmount) || 0;
    const totalRow = ['Total Reported Amount'];
    if (secs.length > 0) {
      for (let i = 0; i < secs.length - 1; i++) totalRow.push('');
      totalRow.push(total);
    } else {
      totalRow.push(0);
    }
    rows.push(totalRow);
  }

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [{ wch: 40 }, ...Array(20).fill({ wch: 18 })];
  return ws;
}

app.post('/api/download-xls', (req, res) => {
  try {
    const { coverSheet, securities } = req.body;
    const wb = XLSX.utils.book_new();

    const coverData = [
      ['Security by security reporting of securitisation vehicles', '', 'Layout 1'],
      [],
      ['General Information'],
      ['Field', 'Value'],
      ['End of Month Date', coverSheet.endMonthDate || ''],
      ['Closing Date', coverSheet.closingDate || ''],
      ['Reporter Type', coverSheet.reporterType || ''],
      ['Reporter Code', coverSheet.reporterCode || ''],
      ['Declarant Type', coverSheet.declarantType || ''],
      ['Declarant Code', coverSheet.declarantCode || ''],
      ['Reporting Currency', coverSheet.reportingCurrency || ''],
      ['Layout', coverSheet.layout || '1'],
    ];
    const wsCover = XLSX.utils.aoa_to_sheet(coverData);
    wsCover['!cols'] = [{ wch: 25 }, { wch: 30 }];
    XLSX.utils.book_append_sheet(wb, wsCover, 'Cover');

    const assetItems = ['1-003000', '1-005000'];
    const liabItems = ['2-002050', '2-003000', '2-005000'];

    const wsAssets = buildReportSheet('Assets', 1, assetItems, securities);
    XLSX.utils.book_append_sheet(wb, wsAssets, 'Assets');

    const wsLiab = buildReportSheet('Liabilities', 2, liabItems, securities);
    XLSX.utils.book_append_sheet(wb, wsLiab, 'Liabilities');

    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xls' });
    const endMonth = coverSheet.endMonthDate ? coverSheet.endMonthDate.replaceAll('-', '').slice(0, 6) : 'YYYYMM';
    const filename = `TPTTBS_L1_${endMonth}_report.xls`;

    res.setHeader('Content-Type', 'application/vnd.ms-excel');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(Buffer.from(buf));
  } catch (err) {
    console.error('XLS generation error:', err);
    res.status(500).json({ error: 'Failed to generate XLS file' });
  }
});

/* ===================== PARSE / IMPORT XLS ===================== */
const COVER_FIELD_MAP = {
  'End of Month Date': 'endMonthDate',
  'Closing Date': 'closingDate',
  'Reporter Type': 'reporterType',
  'Reporter Code': 'reporterCode',
  'Declarant Type': 'declarantType',
  'Declarant Code': 'declarantCode',
  'Reporting Currency': 'reportingCurrency',
  'Layout': 'layout',
};

const ITEM_PATTERNS = ['1-003000', '1-005000', '2-002050', '2-003000', '2-005000'];

function parseReportSheet(ws) {
  const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
  const result = {};
  ITEM_PATTERNS.forEach(id => { result[id] = []; });

  let currentItem = null;
  let headerRow = null;
  let fieldIdx = 0;
  let secCount = 0;

  for (let r = 0; r < data.length; r++) {
    const row = data[r];
    if (!row || row.length === 0) { currentItem = null; headerRow = null; continue; }

    const firstCell = String(row[0] || '').trim();

    const matchedItem = ITEM_PATTERNS.find(id => firstCell.includes(id));
    if (matchedItem) {
      currentItem = matchedItem;
      fieldIdx = 0;
      continue;
    }

    if (currentItem && firstCell === '' && row.length > 1 && String(row[1]).startsWith('Security')) {
      headerRow = row;
      secCount = row.filter((_, i) => i > 0 && row[i]).length;
      for (let i = 0; i < secCount; i++) {
        if (!result[currentItem][i]) result[currentItem][i] = {};
      }
      continue;
    }

    if (currentItem && headerRow && firstCell && fieldIdx < FIELD_KEYS.length) {
      const key = FIELD_KEYS[fieldIdx];
      for (let c = 1; c <= secCount; c++) {
        const val = row[c] !== undefined ? String(row[c]) : '';
        if (result[currentItem][c - 1]) {
          result[currentItem][c - 1][key] = val;
        }
      }
      fieldIdx++;
    }

    if (firstCell.startsWith('Total')) {
      currentItem = null;
      headerRow = null;
    }
  }

  return result;
}

app.post('/api/parse-xls', (req, res) => {
  try {
    const buf = Buffer.from(req.body.data, 'base64');
    const wb = XLSX.read(buf);

    const coverSheet = {};
    const coverWs = wb.Sheets[wb.SheetNames[0]];
    if (coverWs) {
      const coverData = XLSX.utils.sheet_to_json(coverWs, { header: 1, defval: '' });
      for (const row of coverData) {
        const label = String(row[0] || '').trim();
        if (COVER_FIELD_MAP[label]) {
          coverSheet[COVER_FIELD_MAP[label]] = String(row[1] || '');
        }
      }
    }

    let securities = {};
    ITEM_PATTERNS.forEach(id => { securities[id] = []; });

    for (let i = 1; i < wb.SheetNames.length; i++) {
      const ws = wb.Sheets[wb.SheetNames[i]];
      if (ws) {
        const parsed = parseReportSheet(ws);
        for (const id of ITEM_PATTERNS) {
          if (parsed[id] && parsed[id].length > 0) {
            securities[id] = securities[id].concat(parsed[id]);
          }
        }
      }
    }

    res.json({ coverSheet, securities });
  } catch (err) {
    console.error('XLS parse error:', err);
    res.status(500).json({ error: 'Failed to parse XLS file' });
  }
});

app.listen(PORT, () => {
  console.log(`TPTTBS L1 Report Tool running at http://localhost:${PORT}`);
});
