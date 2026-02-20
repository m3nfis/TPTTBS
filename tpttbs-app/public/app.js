(function () {
  'use strict';

  const ITEMS = {
    assets: [
      { id: '1-003000', label: 'Debt securities held', side: 'assets' },
      { id: '1-005000', label: 'Equity and investment fund shares/units held', side: 'assets' },
    ],
    liabilities: [
      { id: '2-002050', label: 'Short sales of securities', side: 'liabilities' },
      { id: '2-003000', label: 'Debt securities issued', side: 'liabilities' },
      { id: '2-005000', label: 'Equity, shares and units issued', side: 'liabilities' },
    ],
  };

  const ALL_ITEMS = [...ITEMS.assets, ...ITEMS.liabilities];

  const securities = {};
  ALL_ITEMS.forEach(it => { securities[it.id] = []; });

  const FIELD_ROWS = [
    { key: 'codeType',              label: 'Type of identifier code',                  forISIN: true,  forOther: true },
    { key: 'code',                  label: 'Code of security identifier',              forISIN: true,  forOther: true },
    { key: 'holdSecurityType',      label: 'Type of holding',                          forISIN: true,  forOther: true },
    { key: 'reportedAmount',        label: 'Amount',                                   forISIN: true,  forOther: true },
    { key: '_quotationHeader',      label: 'Type of quotation (1)',                    forISIN: true,  forOther: true, isHeader: true },
    { key: 'nominalAmount',         label: 'Nominal amount',                           forISIN: true,  forOther: true, quotation: '%' },
    { key: 'nominalCurrency',       label: 'Nominal currency',                         forISIN: true,  forOther: true, quotation: '%' },
    { key: 'numberOfUnits',         label: 'Number of units',                          forISIN: true,  forOther: true, quotation: 'cur' },
    { key: 'custodianBankCountry',  label: 'Country of custodian bank',                forISIN: true,  forOther: true, assetOnly: true },
    { key: 'name',                  label: 'Name of the security',                     forISIN: false, forOther: true },
    { key: 'issuerCountry',        label: 'Issuer country',                            forISIN: false, forOther: true },
    { key: 'secCurrency',          label: 'Security currency',                         forISIN: false, forOther: true },
    { key: 'issuerSector',         label: 'Issuer sector',                             forISIN: false, forOther: true },
    { key: 'securityType',         label: 'Type of security',                          forISIN: false, forOther: true },
    { key: 'issueDate',            label: 'Date of issue',                             forISIN: false, forOther: true, note: '(2)', debtOnly: true },
    { key: 'finalMaturityDate',    label: 'Date of final maturity',                    forISIN: false, forOther: true, note: '(2)', debtOnly: true },
    { key: 'poolFactor',           label: 'Pool factor',                               forISIN: false, forOther: true, note: '(2)', debtOnly: true },
    { key: 'couponType',           label: 'Coupon type',                               forISIN: false, forOther: true, note: '(2)', debtOnly: true },
    { key: 'couponFrequency',      label: 'Coupon frequency',                          forISIN: false, forOther: true, note: '(2)', debtOnly: true },
    { key: 'couponLastPaymentDate',label: 'Payment date of the last coupon',           forISIN: false, forOther: true, note: '(2)', debtOnly: true },
    { key: 'couponRate',           label: 'Coupon rate',                               forISIN: false, forOther: true, note: '(2)', debtOnly: true },
    { key: 'dividendAmount',       label: 'Dividend amount (in % of reported amt)',    forISIN: false, forOther: true, equityIssuedOnly: true },
    { key: 'dividendLastPaymentDate',label:'Payment date of the last dividend',        forISIN: false, forOther: true, equityIssuedOnly: true },
    { key: 'splitDate',            label: 'Split date',                                forISIN: false, forOther: true, equityIssuedOnly: true },
    { key: 'splitRatio',           label: 'Split ratio',                               forISIN: false, forOther: true, equityIssuedOnly: true },
  ];

  const TOOLTIPS = {
    codeType: '1 = ISIN code (ISO 6166), 2 = Other/internal code. ISIN takes priority.',
    code: 'ISIN: 12-char ISO 6166 with check digit. Other: internal code, max 20 chars.',
    holdSecurityType: 'Assets: 01=Held, 02=Lent, 03=Repo. Short sales: 05. Issued: 04.',
    reportedAmount: 'Balance sheet value in reporting currency. Debt at dirty price (incl. accrued interest). Must be >= 0.',
    nominalAmount: 'Face value of the security. Required for %-quoted. Pool factor must NOT be applied.',
    nominalCurrency: 'ISO 4217 currency of the nominal. Must not be "XXX".',
    numberOfUnits: 'Number of individual securities. Required for currency-quoted. Ignore trading lots.',
    custodianBankCountry: 'ISO 3166 country of custodian bank. "XX" if not held at a custodian. Assets only.',
    name: 'Full name/description. Required for non-ISIN securities only.',
    issuerCountry: 'ISO 3166 issuer country. Cannot be "XX". For issued items must be "LU".',
    secCurrency: 'ISO 4217 currency denomination of the security.',
    issuerSector: 'BCL sector code (ESA 2010). Cannot be "90000". For issued items must be "42100".',
    securityType: 'ESA 2010 type: F.3=Debt, F.511=Quoted shares, F.512=Unquoted, F.519=Other equity, F.52=Fund shares.',
    issueDate: 'Original issuance date. Must be <= Closing Date. For roll-overs use roll-over date.',
    finalMaturityDate: 'Contractual maturity. Use 2999-01-01 for perpetual bonds.',
    poolFactor: 'Fraction of principal remaining (>0, default 1). Decreases with amortisation.',
    couponType: '01=Fixed, 02=Progressive, 03=Floating, 04=Zero, 05=Index-linked, 99=Other.',
    couponFrequency: '00=Zero, 01=Annual, 02=Semi-annual, 04=Quarterly, 06=Bi-monthly, 12=Monthly, 24=Fortnightly, 99=Other.',
    couponLastPaymentDate: 'Last coupon payment date. If none: use issue date. Must be >= issueDate, <= maturity.',
    couponRate: 'Annualised rate in %. E.g. 5.5 for 5.5%. Must be != 0 for fixed non-zero frequency.',
    dividendAmount: 'Dividend as % of reported amount. Default = 0.',
    dividendLastPaymentDate: 'Last dividend date. Default = 2013-12-31 if none paid.',
    splitDate: 'Last split/reverse-split date. Default = 2013-12-31 if none occurred.',
    splitRatio: 'New shares per existing share. Split>1, reverse split 0-1. Default=1.',
  };

  /* =================================================================== */
  /*  SAMPLE DATA                                                        */
  /* =================================================================== */
  const SAMPLE_DATA = {
    cover: {
      endMonthDate: '2024-12-31',
      closingDate: '2024-12-31',
      reporterType: '34',
      reporterCode: '999999',
      declarantType: '34',
      declarantCode: '999999000',
      reportingCurrency: 'EUR',
      layout: '1',
    },
    securities: {
      '1-003000': [
        {
          codeType: '1', quotationType: '%', code: 'LU1234567896',
          holdSecurityType: '01', reportedAmount: '1050000',
          nominalAmount: '1000000', nominalCurrency: 'EUR',
          custodianBankCountry: 'LU',
        },
        {
          codeType: '1', quotationType: 'cur', code: 'DE1234567896',
          holdSecurityType: '01', reportedAmount: '750000',
          numberOfUnits: '7500',
          custodianBankCountry: 'DE',
        },
        {
          codeType: '2', quotationType: '%', code: 'INTDBT001',
          holdSecurityType: '01', reportedAmount: '525000',
          nominalAmount: '500000', nominalCurrency: 'EUR',
          custodianBankCountry: 'DE',
          name: 'ABC Corporate Bond 3.5% 2030', issuerCountry: 'DE',
          secCurrency: 'EUR', issuerSector: '11000', securityType: 'F.3',
          issueDate: '2020-06-15', finalMaturityDate: '2030-06-15',
          poolFactor: '1', couponType: '01', couponFrequency: '01',
          couponLastPaymentDate: '2024-06-15', couponRate: '3.5',
        },
      ],
      '1-005000': [
        {
          codeType: '1', quotationType: 'cur', code: 'LU1234567896',
          holdSecurityType: '01', reportedAmount: '250000',
          numberOfUnits: '5000',
          custodianBankCountry: 'LU',
        },
        {
          codeType: '2', quotationType: 'cur', code: 'INTEQT001',
          holdSecurityType: '01', reportedAmount: '150000',
          numberOfUnits: '3000',
          custodianBankCountry: 'LU',
          name: 'Investment Fund XYZ', issuerCountry: 'LU',
          secCurrency: 'EUR', issuerSector: '42100', securityType: 'F.52',
        },
      ],
      '2-002050': [
        {
          codeType: '1', quotationType: '%', code: 'US9999999999',
          holdSecurityType: '05', reportedAmount: '50000',
          nominalAmount: '50000', nominalCurrency: 'USD',
          custodianBankCountry: '', // Not applicable for liabilities
        }
      ],
      '2-003000': [
        {
          codeType: '2', quotationType: '%', code: 'SVNOTE001A',
          holdSecurityType: '04', reportedAmount: '2000000',
          nominalAmount: '2000000', nominalCurrency: 'EUR',
          name: 'Securitisation Note Class A', issuerCountry: 'LU',
          secCurrency: 'EUR', issuerSector: '42100', securityType: 'F.3',
          issueDate: '2023-01-15', finalMaturityDate: '2033-01-15',
          poolFactor: '1', couponType: '03', couponFrequency: '04',
          couponLastPaymentDate: '2024-10-15', couponRate: '4.25',
        },
      ],
      '2-005000': [
        {
          codeType: '2', quotationType: 'cur', code: 'SVEQTY001',
          holdSecurityType: '04', reportedAmount: '500000',
          numberOfUnits: '10000',
          name: 'SV Equity Share Class A', issuerCountry: 'LU',
          secCurrency: 'EUR', issuerSector: '42100', securityType: 'F.512',
          dividendAmount: '0', dividendLastPaymentDate: '2013-12-31',
          splitDate: '2013-12-31', splitRatio: '1',
        },
      ],
    },
  };

  /* =================================================================== */
  /*  TAB NAVIGATION                                                     */
  /* =================================================================== */
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
    });
  });

  /* =================================================================== */
  /*  TOOLTIP                                                            */
  /* =================================================================== */
  const tipBox = document.getElementById('tip-box');
  document.addEventListener('mouseover', e => {
    const t = e.target.closest('[data-tip]');
    if (t && t.dataset.tip) { tipBox.textContent = t.dataset.tip; tipBox.style.display = 'block'; }
  });
  document.addEventListener('mousemove', e => {
    if (tipBox.style.display === 'block') {
      tipBox.style.left = Math.min(e.clientX + 12, window.innerWidth - 380) + 'px';
      tipBox.style.top = Math.min(e.clientY + 12, window.innerHeight - 80) + 'px';
    }
  });
  document.addEventListener('mouseout', e => { if (e.target.closest('[data-tip]')) tipBox.style.display = 'none'; });

  /* =================================================================== */
  /*  COVER SHEET                                                        */
  /* =================================================================== */
  function getCoverData() {
    return {
      endMonthDate: document.getElementById('endMonthDate').value,
      closingDate: document.getElementById('closingDate').value,
      reporterType: document.getElementById('reporterType').value,
      declarantType: document.getElementById('declarantType').value,
      reporterCode: document.getElementById('reporterCode').value,
      declarantCode: document.getElementById('declarantCode').value,
      reportingCurrency: document.getElementById('reportingCurrency').value,
      layout: document.getElementById('layout').value,
    };
  }

  function setCoverData(data) {
    if (!data) return;
    const fields = ['endMonthDate', 'closingDate', 'reporterType', 'reporterCode',
                     'declarantType', 'declarantCode', 'reportingCurrency', 'layout'];
    for (const f of fields) {
      const el = document.getElementById(f);
      if (el && data[f] !== undefined) el.value = data[f];
    }
  }

  document.querySelectorAll('#tab-cover .ci').forEach(input => {
    const handler = () => {
      const field = input.dataset.field;
      const all = getCoverData();
      const r = validateCoverField(field, all[field], all);
      const el = document.getElementById('sts-' + field);
      if (r.valid) { el.innerHTML = '<span class="ok">&#10003; Valid</span>'; input.classList.remove('has-error'); }
      else { el.innerHTML = '<span class="err-txt">&#10007; ' + r.message + '</span>'; input.classList.add('has-error'); }
    };
    input.addEventListener('blur', handler);
    input.addEventListener('change', handler);
  });

  /* =================================================================== */
  /*  HELPERS                                                            */
  /* =================================================================== */
  function isDebtItem(id) { return id === '1-003000' || id === '2-003000'; }
  function isMixedItem(id) { return id === '2-002050'; }
  function isAssetItem(id) { return id.startsWith('1-'); }
  function isEquityIssued(id) { return id === '2-005000'; }
  function shouldShowDebtSupplements(id) { return isDebtItem(id) || isMixedItem(id); }
  function shouldShowEquitySupplements(id) { return isEquityIssued(id); }

  function isCellNA(field, itemId, isISIN, quotation) {
    if (field.assetOnly && !isAssetItem(itemId)) return true;
    if (field.debtOnly && !shouldShowDebtSupplements(itemId)) return true;
    if (field.equityIssuedOnly && !shouldShowEquitySupplements(itemId)) return true;
    if (isISIN && !field.forISIN) return true;
    if (!isISIN && !field.forOther) return true;
    if (field.quotation === '%' && quotation !== '%') return true;
    if (field.quotation === 'cur' && quotation !== 'cur') return true;
    return false;
  }

  function esc(s) {
    if (!s) return '';
    return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function createInputForField(fieldKey, sec, itemId, colIdx) {
    const val = sec[fieldKey] ?? '';
    const tip = esc(TOOLTIPS[fieldKey] || '');

    if (fieldKey === 'codeType') {
      return `<select data-item="${itemId}" data-col="${colIdx}" data-key="${fieldKey}" data-tip="${tip}">
        <option value="1" ${val === '1' ? 'selected' : ''}>1 — ISIN</option>
        <option value="2" ${val === '2' ? 'selected' : ''}>2 — Other</option>
      </select>`;
    }
    if (fieldKey === 'holdSecurityType') {
      const opts = (HOLD_TYPES_BY_ITEM[itemId] || []).map(h => {
        const labels = { '01': '01 — Held', '02': '02 — Lent', '03': '03 — Repo', '04': '04 — Issued', '05': '05 — Short sale' };
        return `<option value="${h}" ${val === h ? 'selected' : ''}>${labels[h] || h}</option>`;
      });
      return `<select data-item="${itemId}" data-col="${colIdx}" data-key="${fieldKey}" data-tip="${tip}"><option value="">--</option>${opts.join('')}</select>`;
    }
    if (fieldKey === 'securityType') {
      const types = SECURITY_TYPES_BY_ITEM[itemId] || [];
      const opts = types.map(t => `<option value="${t}" ${val === t ? 'selected' : ''}>${t}</option>`);
      return `<select data-item="${itemId}" data-col="${colIdx}" data-key="${fieldKey}" data-tip="${tip}"><option value="">--</option>${opts.join('')}</select>`;
    }
    if (fieldKey === 'couponType') {
      const opts = VALID_COUPON_TYPES.map(c => {
        const l = { '01':'Fixed','02':'Progressive','03':'Floating','04':'Zero','05':'Index-linked','99':'Other' };
        return `<option value="${c}" ${val === c ? 'selected' : ''}>${c} — ${l[c]||c}</option>`;
      });
      return `<select data-item="${itemId}" data-col="${colIdx}" data-key="${fieldKey}" data-tip="${tip}"><option value="">--</option>${opts.join('')}</select>`;
    }
    if (fieldKey === 'couponFrequency') {
      const opts = VALID_COUPON_FREQS.map(f => {
        const l = { '00':'Zero','01':'Annual','02':'Semi-annual','04':'Quarterly','06':'Bi-monthly','12':'Monthly','24':'Fortnightly','99':'Other' };
        return `<option value="${f}" ${val === f ? 'selected' : ''}>${f} — ${l[f]||f}</option>`;
      });
      return `<select data-item="${itemId}" data-col="${colIdx}" data-key="${fieldKey}" data-tip="${tip}"><option value="">--</option>${opts.join('')}</select>`;
    }
    if (fieldKey === 'issuerSector') {
      const opts = VALID_SECTORS.map(s => `<option value="${s}" ${val === s ? 'selected' : ''}>${s}</option>`);
      return `<select data-item="${itemId}" data-col="${colIdx}" data-key="${fieldKey}" data-tip="${tip}"><option value="">--</option>${opts.join('')}</select>`;
    }
    if (['issueDate','finalMaturityDate','couponLastPaymentDate','dividendLastPaymentDate','splitDate'].includes(fieldKey)) {
      return `<input type="date" value="${esc(val)}" data-item="${itemId}" data-col="${colIdx}" data-key="${fieldKey}" data-tip="${tip}">`;
    }
    if (['reportedAmount','nominalAmount','numberOfUnits','poolFactor','couponRate','dividendAmount','splitRatio'].includes(fieldKey)) {
      return `<input type="number" step="any" value="${esc(val)}" data-item="${itemId}" data-col="${colIdx}" data-key="${fieldKey}" data-tip="${tip}">`;
    }
    return `<input type="text" value="${esc(val)}" data-item="${itemId}" data-col="${colIdx}" data-key="${fieldKey}" data-tip="${tip}">`;
  }

  /* =================================================================== */
  /*  RENDER REPORT SHEETS                                               */
  /* =================================================================== */
  function renderItemBlock(item) {
    const secs = securities[item.id];
    const isinPct  = secs.filter(s => s.codeType === '1' && s.quotationType === '%');
    const isinCur  = secs.filter(s => s.codeType === '1' && s.quotationType === 'cur');
    const otherPct = secs.filter(s => s.codeType === '2' && s.quotationType === '%');
    const otherCur = secs.filter(s => s.codeType === '2' && s.quotationType === 'cur');

    const groups = [
      { label: 'in %', secs: isinPct, isISIN: true, quot: '%' },
      { label: 'in currency', secs: isinCur, isISIN: true, quot: 'cur' },
      { label: 'in %', secs: otherPct, isISIN: false, quot: '%' },
      { label: 'in currency', secs: otherCur, isISIN: false, quot: 'cur' },
    ];

    const totalDataCols = groups.reduce((s, g) => s + Math.max(g.secs.length, 1), 0);

    let html = `<div class="item-block" id="block-${item.id}">`;
    html += `<div class="item-block-hdr">
      <span class="item-id">${item.id}-XX-XXX-90000</span>
      <span>${item.label}</span>
      <div class="add-btns">
        <button class="btn-sm" data-add="${item.id}" data-ct="1" data-qt="%">+ ISIN (in %)</button>
        <button class="btn-sm" data-add="${item.id}" data-ct="1" data-qt="cur">+ ISIN (currency)</button>
        <button class="btn-sm" data-add="${item.id}" data-ct="2" data-qt="%">+ Other (in %)</button>
        <button class="btn-sm" data-add="${item.id}" data-ct="2" data-qt="cur">+ Other (currency)</button>
      </div>
    </div>`;

    html += '<div class="grid-wrap"><table class="rpt-table">';

    const isinCols = Math.max(isinPct.length, 1) + Math.max(isinCur.length, 1);
    const otherCols = Math.max(otherPct.length, 1) + Math.max(otherCur.length, 1);
    html += `<tr><th class="h1 rl" rowspan="3" style="min-width:220px;"></th>`;
    html += `<th class="h1" colspan="${isinCols}">ISIN</th>`;
    html += `<th class="h1" colspan="${otherCols}">Other</th>`;
    html += '</tr>';

    html += '<tr>';
    html += `<th class="h2" colspan="${Math.max(isinPct.length, 1)}">in %</th>`;
    html += `<th class="h2" colspan="${Math.max(isinCur.length, 1)}">in currency</th>`;
    html += `<th class="h2" colspan="${Math.max(otherPct.length, 1)}">in %</th>`;
    html += `<th class="h2" colspan="${Math.max(otherCur.length, 1)}">in currency</th>`;
    html += '</tr>';

    html += '<tr>';
    for (const grp of groups) {
      const cnt = Math.max(grp.secs.length, 1);
      for (let i = 0; i < cnt; i++) {
        if (i < grp.secs.length) {
          const globalIdx = secs.indexOf(grp.secs[i]);
          html += `<th class="h3"><button class="del-col" data-del="${item.id}" data-idx="${globalIdx}" title="Remove">&#10005;</button> #${i + 1}</th>`;
        } else {
          html += `<th class="h3 ph-cell" data-add="${item.id}" data-ct="${grp.isISIN ? '1' : '2'}" data-qt="${grp.quot}" title="Click to add a ${grp.isISIN ? 'ISIN' : 'Other'} security (${grp.label})">+</th>`;
        }
      }
    }
    html += '</tr>';

    for (const field of FIELD_ROWS) {
      if (field.isHeader) {
        html += `<tr><td class="rl" data-tip="(1) Usually, debt securities are quoted in percentage and equities in currency">${field.label}</td>`;
        for (const grp of groups) {
          const cnt = Math.max(grp.secs.length, 1);
          for (let i = 0; i < cnt; i++) {
            html += `<td class="h3">${grp.quot === '%' ? 'in %' : 'in currency'}</td>`;
          }
        }
        html += '</tr>';
        continue;
      }

      html += `<tr><td class="rl" data-tip="${esc(TOOLTIPS[field.key] || '')}">${field.label}${field.note ? ' <span class="note-mark">' + field.note + '</span>' : ''}</td>`;
      for (const grp of groups) {
        const cnt = Math.max(grp.secs.length, 1);
        for (let i = 0; i < cnt; i++) {
          const na = isCellNA(field, item.id, grp.isISIN, grp.quot);
          if (na) {
            html += '<td class="na-cell"></td>';
          } else if (i >= grp.secs.length) {
            html += `<td class="ph-cell" data-add="${item.id}" data-ct="${grp.isISIN ? '1' : '2'}" data-qt="${grp.quot}" title="Click to add">+</td>`;
          } else {
            const sec = grp.secs[i];
            const globalIdx = secs.indexOf(sec);
            html += `<td class="dc">${createInputForField(field.key, sec, item.id, globalIdx)}</td>`;
          }
        }
      }
      html += '</tr>';
    }

    const total = secs.reduce((s, sec) => s + (Number.parseFloat(sec.reportedAmount) || 0), 0);
    html += `<tr class="total-row"><td class="rl" style="font-weight:700;">Total Reported Amount</td>`;
    html += `<td colspan="${totalDataCols}" class="total-val" style="text-align:right;padding-right:20px;">${total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 5 })}</td>`;
    html += '</tr>';

    html += '</table></div>';
    html += `<div class="footnotes">(1) Usually, debt securities are quoted in percentage and equities in currency &nbsp;&nbsp; (2) Only for debt securities</div>`;
    html += '</div>';
    return html;
  }

  function renderSheet(side) {
    const container = document.getElementById(side + '-sheet');
    const items = ITEMS[side];
    let html = `<div class="sheet-frame"><div class="sheet-title-bar">
      <span>Security by security reporting of securitisation vehicles</span>
      <span class="layout-label">Layout 1</span>
    </div>
    <div style="padding:8px 12px;background:#f0f2f5;border-bottom:1px solid #bbb;">
      <strong>${side === 'assets' ? '1  Assets' : '2  Liabilities'}</strong>
    </div></div>`;

    for (const item of items) {
      html += renderItemBlock(item);
    }
    container.innerHTML = html;
    bindSheetEvents(side);
  }

  function bindSheetEvents(side) {
    const container = document.getElementById(side + '-sheet');

    container.querySelectorAll('[data-add]').forEach(el => {
      el.addEventListener('click', () => {
        const itemId = el.dataset.add;
        const ct = el.dataset.ct;
        const qt = el.dataset.qt;
        const newSec = { codeType: ct, quotationType: qt, code: '', holdSecurityType: '', reportedAmount: '' };
        applyDefaults(newSec, itemId);
        securities[itemId].push(newSec);
        renderSheet(side);
      });
    });

    container.querySelectorAll('[data-del]').forEach(btn => {
      btn.addEventListener('click', () => {
        const itemId = btn.dataset.del;
        const idx = Number.parseInt(btn.dataset.idx, 10);
        securities[itemId].splice(idx, 1);
        renderSheet(side);
      });
    });

    container.querySelectorAll('.dc input, .dc select').forEach(el => {
      const saveValue = (e) => {
        const itemId = e.target.dataset.item;
        const colIdx = Number.parseInt(e.target.dataset.col, 10);
        const key = e.target.dataset.key;
        if (!securities[itemId] || !securities[itemId][colIdx]) return;
        securities[itemId][colIdx][key] = e.target.value;
      };

      el.addEventListener('input', saveValue);
      el.addEventListener('change', (e) => {
        saveValue(e);
        const key = e.target.dataset.key;
        if (key === 'codeType' || key === 'reportedAmount') renderSheet(side);
      });

      el.addEventListener('blur', (e) => {
        saveValue(e);
        const itemId = e.target.dataset.item;
        const colIdx = Number.parseInt(e.target.dataset.col, 10);
        if (!securities[itemId] || !securities[itemId][colIdx]) return;
        const sec = { ...securities[itemId][colIdx], item: itemId };
        const result = validateSecurity(sec, getCoverData());
        const fieldKey = e.target.dataset.key;
        const fieldErrors = result.errors.filter(err => err.toLowerCase().includes(fieldKey.toLowerCase()));
        const td = e.target.closest('td');
        if (fieldErrors.length > 0) { td.classList.add('err'); e.target.title = fieldErrors.join('\n'); }
        else { td.classList.remove('err'); e.target.title = ''; }
      });
    });
  }

  function applyDefaults(sec, item) {
    if (item === '2-003000' && sec.codeType === '2') {
      sec.issuerCountry = sec.issuerCountry || 'LU';
      sec.issuerSector = sec.issuerSector || '42100';
      sec.securityType = sec.securityType || 'F.3';
      sec.poolFactor = sec.poolFactor || '1';
    }
    if (item === '2-005000' && sec.codeType === '2') {
      sec.issuerCountry = sec.issuerCountry || 'LU';
      sec.issuerSector = sec.issuerSector || '42100';
      sec.dividendAmount = sec.dividendAmount ?? '0';
      sec.dividendLastPaymentDate = sec.dividendLastPaymentDate || '2013-12-31';
      sec.splitDate = sec.splitDate || '2013-12-31';
      sec.splitRatio = sec.splitRatio ?? '1';
    }
    if (item === '1-003000' && sec.codeType === '2') {
      sec.securityType = sec.securityType || 'F.3';
      sec.poolFactor = sec.poolFactor || '1';
    }
    const allowed = HOLD_TYPES_BY_ITEM[item];
    if (allowed && allowed.length === 1) sec.holdSecurityType = allowed[0];
  }

  /* =================================================================== */
  /*  LOAD SAMPLE DATA                                                   */
  /* =================================================================== */
  function loadSampleData() {
    setCoverData(SAMPLE_DATA.cover);
    ALL_ITEMS.forEach(it => {
      securities[it.id] = (SAMPLE_DATA.securities[it.id] || []).map(s => ({ ...s }));
    });
    renderSheet('assets');
    renderSheet('liabilities');
    triggerCoverValidation();
    showStatus('Sample data loaded successfully');
  }

  /* =================================================================== */
  /*  SAVE / LOAD JSON                                                   */
  /* =================================================================== */
  function saveAsJSON() {
    const data = { coverSheet: getCoverData(), securities: {} };
    ALL_ITEMS.forEach(it => { data.securities[it.id] = securities[it.id]; });
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const endMonth = data.coverSheet.endMonthDate || 'draft';
    a.href = url;
    a.download = `TPTTBS_L1_${endMonth.replace(/-/g, '')}_data.json`;
    a.click();
    URL.revokeObjectURL(url);
    showStatus('Report data saved as JSON');
  }

  function loadFromJSON(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (data.coverSheet) setCoverData(data.coverSheet);
        if (data.securities) {
          ALL_ITEMS.forEach(it => {
            securities[it.id] = (data.securities[it.id] || []).map(s => ({ ...s }));
          });
        }
        renderSheet('assets');
        renderSheet('liabilities');
        triggerCoverValidation();
        showStatus('File loaded successfully');
      } catch (err) {
        alert('Failed to parse JSON file: ' + err.message);
      }
    };
    reader.readAsText(file);
  }

  function loadFromXLS(file) {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const base64 = btoa(new Uint8Array(e.target.result).reduce((d, b) => d + String.fromCharCode(b), ''));
        const resp = await fetch('/api/parse-xls', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: base64 }),
        });
        if (!resp.ok) throw new Error('Server parse error');
        const parsed = await resp.json();
        if (parsed.coverSheet) setCoverData(parsed.coverSheet);
        if (parsed.securities) {
          ALL_ITEMS.forEach(it => {
            securities[it.id] = (parsed.securities[it.id] || []).map(s => ({ ...s }));
          });
        }
        renderSheet('assets');
        renderSheet('liabilities');
        triggerCoverValidation();
        showStatus('XLS file imported successfully');
      } catch (err) {
        alert('Failed to import XLS: ' + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
  }

  function showStatus(msg) {
    const el = document.getElementById('tb-status');
    el.textContent = msg;
    setTimeout(() => { el.textContent = ''; }, 4000);
  }

  function triggerCoverValidation() {
    document.querySelectorAll('#tab-cover .ci').forEach(input => {
      input.dispatchEvent(new Event('change'));
    });
  }

  /* =================================================================== */
  /*  TOOLBAR BUTTONS                                                    */
  /* =================================================================== */
  document.getElementById('btn-load-sample').addEventListener('click', loadSampleData);
  document.getElementById('btn-save-json').addEventListener('click', saveAsJSON);
  document.getElementById('btn-load-json').addEventListener('click', () => {
    document.getElementById('file-input').click();
  });
  document.getElementById('file-input').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.name.endsWith('.json')) loadFromJSON(file);
    else if (file.name.endsWith('.xls') || file.name.endsWith('.xlsx')) loadFromXLS(file);
    else alert('Unsupported file format. Please use .json, .xls, or .xlsx');
    e.target.value = '';
  });

  /* =================================================================== */
  /*  VALIDATION REPORT                                                  */
  /* =================================================================== */
  document.getElementById('btn-run-validation').addEventListener('click', () => {
    const coverData = getCoverData();
    const allSecs = [];
    for (const item of ALL_ITEMS) {
      for (const sec of securities[item.id]) allSecs.push({ ...sec, item: item.id });
    }
    const results = validateAll(coverData, allSecs);
    renderValidationReport(results);
  });

  function renderValidationReport(results) {
    const container = document.getElementById('validation-results');
    const summary = document.getElementById('validation-summary');
    const dlSection = document.getElementById('download-section');

    summary.innerHTML = `<div class="summary-cards">
      <div class="s-card pass"><div class="num">${results.summary.passed}</div><div class="lbl2">Passed</div></div>
      <div class="s-card fail"><div class="num">${results.summary.errors}</div><div class="lbl2">Errors</div></div>
      <div class="s-card warnd"><div class="num">${results.summary.warnings}</div><div class="lbl2">Warnings</div></div>
    </div>`;

    let html = '';
    const coverFail = results.cover.some(c => !c.valid);
    html += '<div class="val-sec">';
    html += `<div class="val-sec-title ${coverFail ? 'fail' : 'pass'}">Cover Sheet</div>`;
    for (const c of results.cover) {
      html += `<div class="vi"><span class="vi-icon ${c.valid ? 'pass' : 'fail'}">${c.valid ? '\u2713' : '\u2717'}</span> <strong>${c.field}</strong>: ${c.valid ? 'Valid' : c.message}</div>`;
    }
    html += '</div>';

    for (const item of ALL_ITEMS) {
      const itemSecs = results.securities.filter(s => s.security.item === item.id);
      if (itemSecs.length === 0) continue;

      const hasErr = itemSecs.some(s => s.errors.length > 0);
      const hasWarn = itemSecs.some(s => s.warnings.length > 0);
      html += '<div class="val-sec">';
      html += `<div class="val-sec-title ${hasErr ? 'fail' : hasWarn ? 'warn' : 'pass'}">${item.id} ${item.label} (${itemSecs.length} securities)</div>`;

      for (const s of itemSecs) {
        const lbl = s.security.code || `Security #${s.index + 1}`;
        if (s.errors.length === 0 && s.warnings.length === 0) {
          html += `<div class="vi"><span class="vi-icon pass">\u2713</span> ${lbl} — All checks passed</div>`;
        }
        for (const err of s.errors) html += `<div class="vi"><span class="vi-icon fail">\u2717</span> ${lbl}: ${err}</div>`;
        for (const w of s.warnings) html += `<div class="vi"><span class="vi-icon warn">\u26A0</span> ${lbl}: ${w}</div>`;
      }

      const tot = results.totals.find(t => t.item === item.id);
      if (tot) html += `<div class="vi"><span class="vi-icon pass">\u03A3</span> Total: <strong>${Number.parseFloat(tot.total).toLocaleString()}</strong> (${tot.securityCount} securities)</div>`;
      html += '</div>';
    }

    container.innerHTML = html;
    dlSection.style.display = results.summary.errors === 0 ? 'block' : 'none';
  }

  /* =================================================================== */
  /*  DOWNLOAD XLS                                                       */
  /* =================================================================== */
  document.getElementById('btn-download-xls').addEventListener('click', async () => {
    const coverData = getCoverData();
    const allSecs = [];
    for (const item of ALL_ITEMS) {
      for (const sec of securities[item.id]) allSecs.push({ ...sec, item: item.id });
    }
    try {
      const resp = await fetch('/api/download-xls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coverSheet: coverData, securities: allSecs }),
      });
      if (!resp.ok) throw new Error('Download failed');
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = resp.headers.get('Content-Disposition')?.match(/filename="(.+)"/)?.[1] || 'TPTTBS_L1_report.xls';
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) { alert('Error: ' + e.message); }
  });

  /* =================================================================== */
  /*  GLOSSARY                                                           */
  /* =================================================================== */
  function renderGlossary() {
    const el = document.getElementById('glossary-content');
    el.innerHTML = [...GLOSSARY].sort((a, b) => a.term.localeCompare(b.term))
      .map(g => `<div class="g-item"><div class="g-term">${g.term}</div><div class="g-def">${g.definition}</div><div class="g-src">Source: ${g.source}</div></div>`)
      .join('');
  }

  /* =================================================================== */
  /*  INIT                                                               */
  /* =================================================================== */
  renderSheet('assets');
  renderSheet('liabilities');
  renderGlossary();

})();
