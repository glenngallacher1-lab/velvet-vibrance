/**
 * VELVET VIBRANCE — Operations Sheet Schema
 *
 * One-shot idempotent setup for the Google Sheet that WEBAPP.gs writes to.
 * Creates the tabs needed to track progress toward the mission (Play Madrid
 * 2027): Subscribers, Growth, Gigs, Income, Targets.
 *
 * Expenses are NOT here — they live in the local Excel operations ledger.
 * See CLAUDE.md for the split.
 *
 * To run: paste alongside WEBAPP.gs in the Sheet's Apps Script project,
 * pick `setupSheet` from the function dropdown, click Run. Safe to re-run —
 * existing tabs and data are left alone; only missing structure is added.
 */

function setupSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ensureSubscribers_(ss);
  ensureGrowth_(ss);
  ensureGigs_(ss);
  ensureIncome_(ss);
  ensureTargets_(ss);
  ensureIncomeStatement_(ss);
  ensureCashflowStatement_(ss);
  ensureBalanceSheet_(ss);
  ss.toast('Sheet setup complete', 'Velvet Vibrance', 5);
}

/* Convenience runner if you only want the three financial statements. */
function setupFinancialStatements() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ensureIncomeStatement_(ss);
  ensureCashflowStatement_(ss);
  ensureBalanceSheet_(ss);
  ss.toast('Financial statements added', 'Velvet Vibrance', 5);
}

/* Swap the currency symbol on already-built statement tabs. Run this
   after changing the format constants in the apply*Formats_ helpers
   (or after choosing to switch $/£ later). Walks every cell in each
   statement tab and replaces one symbol with the other in its number
   format string, leaving formulas and values untouched. */
function changeCurrencyToDollar() { swapCurrencySymbol_('£', '$'); }
function changeCurrencyToPound()  { swapCurrencySymbol_('$', '£'); }

function swapCurrencySymbol_(from, to) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ['Income Statement', 'Cashflow Statement', 'Balance Sheet'].forEach(name => {
    const sheet = ss.getSheetByName(name);
    if (!sheet) return;
    const range = sheet.getDataRange();
    const formats = range.getNumberFormats();
    const swapped = formats.map(row =>
      row.map(f => f.split(from).join(to)));
    range.setNumberFormats(swapped);
  });
  ss.toast('Currency swapped to ' + to, 'Velvet Vibrance', 5);
}

function ensureSubscribers_(ss) {
  let sheet = ss.getSheetByName('Subscribers');
  if (!sheet) {
    sheet = ss.insertSheet('Subscribers');
  }
  /* Columns A–C are the contract with WEBAPP.gs (appendRow order).
     D–G are manual enrichment — safe to add because appendRow only
     writes the first 3 cells of each new row. */
  const headers = ['timestamp', 'email', 'source', 'status', 'tag', 'first_event', 'notes'];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');
  sheet.setFrozenRows(1);

  const rows = Math.max(sheet.getMaxRows() - 1, 999);
  sheet.getRange(2, 4, rows, 1).setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireValueInList(['active', 'unsub', 'bounced'], true).build()
  );
  sheet.getRange(2, 5, rows, 1).setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireValueInList(['superfan', 'dj', 'promoter', 'venue'], true).build()
  );
}

function ensureGrowth_(ss) {
  if (ss.getSheetByName('Growth')) return;
  const sheet = ss.insertSheet('Growth');
  sheet.getRange(1, 1, 1, 6).setValues([[
    'week_start', 'new_subs', 'total_subs', 'from_join_form', 'from_admin', 'from_other'
  ]]).setFontWeight('bold');
  sheet.setFrozenRows(1);

  /* Timestamps in Subscribers!A are ISO-8601 strings written by
     WEBAPP.gs (new Date().toISOString()). Lexicographic comparison
     of ISO-8601 == chronological comparison, so string COUNTIFS work
     if week_start is also a text date. We force the A column to text
     format before writing to stop Sheets auto-parsing them as dates. */
  const weeks = 104;
  const anchor = new Date(Date.UTC(2026, 0, 5)); // 2026-01-05 (Monday)
  const dates = [];
  const formulas = [];
  for (let i = 0; i < weeks; i++) {
    const d = new Date(anchor);
    d.setUTCDate(d.getUTCDate() + i * 7);
    const dStr = Utilities.formatDate(d, 'UTC', 'yyyy-MM-dd');
    dates.push([dStr]);
    const row = i + 2;
    const nextStr = `TEXT(DATEVALUE(A${row})+7,"yyyy-MM-dd")`;
    formulas.push([
      `=COUNTIFS(Subscribers!$A:$A,">="&A${row},Subscribers!$A:$A,"<"&${nextStr})`,
      `=COUNTIFS(Subscribers!$A:$A,"<"&${nextStr})`,
      `=COUNTIFS(Subscribers!$A:$A,">="&A${row},Subscribers!$A:$A,"<"&${nextStr},Subscribers!$C:$C,"join-form")`,
      `=COUNTIFS(Subscribers!$A:$A,">="&A${row},Subscribers!$A:$A,"<"&${nextStr},Subscribers!$C:$C,"admin")`,
      `=B${row}-D${row}-E${row}`
    ]);
  }
  sheet.getRange(2, 1, weeks, 1).setNumberFormat('@');
  sheet.getRange(2, 1, weeks, 1).setValues(dates);
  sheet.getRange(2, 2, weeks, 5).setFormulas(formulas);
  sheet.setColumnWidth(1, 110);
}

function ensureGigs_(ss) {
  if (ss.getSheetByName('Gigs')) return;
  const sheet = ss.insertSheet('Gigs');
  const headers = ['date', 'venue', 'city', 'country', 'type', 'status', 'fee', 'currency', 'crowd_est', 'contact', 'notes'];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');
  sheet.setFrozenRows(1);

  const rows = 999;
  sheet.getRange(2, 5, rows, 1).setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireValueInList(['opener', 'main', 'b2b', 'guest', 'other'], true).build()
  );
  sheet.getRange(2, 6, rows, 1).setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireValueInList(['inquired', 'booked', 'confirmed', 'played', 'cancelled'], true).build()
  );
  sheet.getRange(2, 8, rows, 1).setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireValueInList(['GBP', 'EUR', 'USD'], true).build()
  );
  sheet.getRange(2, 1, rows, 1).setNumberFormat('yyyy-mm-dd');
  sheet.setColumnWidths(2, 3, 140);
  sheet.setColumnWidth(11, 320);
}

function ensureIncome_(ss) {
  if (ss.getSheetByName('Income')) return;
  const sheet = ss.insertSheet('Income');
  const headers = ['date', 'category', 'amount', 'currency', 'gig_link', 'notes'];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');
  sheet.setFrozenRows(1);

  const rows = 999;
  sheet.getRange(2, 2, rows, 1).setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireValueInList(['gig', 'merch', 'tips', 'other'], true).build()
  );
  sheet.getRange(2, 4, rows, 1).setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireValueInList(['GBP', 'EUR', 'USD'], true).build()
  );
  sheet.getRange(2, 1, rows, 1).setNumberFormat('yyyy-mm-dd');
  sheet.getRange(2, 3, rows, 1).setNumberFormat('#,##0.00');
  sheet.setColumnWidth(6, 320);
}

function ensureTargets_(ss) {
  if (ss.getSheetByName('Targets')) return;
  const sheet = ss.insertSheet('Targets');
  const rows = [
    ['MISSION',                         'Play Madrid 2027',                                                                                                'edit dates and goals as they firm up'],
    ['',                                '',                                                                                                                ''],
    ['Madrid target date',              new Date(Date.UTC(2027, 5, 1)),                                                                                    'yyyy-mm-dd'],
    ['Weeks remaining',                 '=ROUND((B3-TODAY())/7,1)',                                                                                        ''],
    ['',                                '',                                                                                                                ''],
    ['Total subscribers',               '=COUNTA(Subscribers!B2:B)',                                                                                       ''],
    ['Subscriber goal',                 1000,                                                                                                              'edit as goals shift'],
    ['% to goal',                       '=IF(B7=0,0,B6/B7)',                                                                                               ''],
    ['',                                '',                                                                                                                ''],
    ['Gigs booked / confirmed / played','=COUNTIF(Gigs!F:F,"booked")+COUNTIF(Gigs!F:F,"confirmed")+COUNTIF(Gigs!F:F,"played")',                            ''],
    ['Gigs played (ever)',              '=COUNTIF(Gigs!F:F,"played")',                                                                                     ''],
    ['Gigs played YTD',                 '=COUNTIFS(Gigs!F:F,"played",Gigs!A:A,">="&DATE(YEAR(TODAY()),1,1))',                                              ''],
    ['',                                '',                                                                                                                ''],
    ['Income YTD (GBP-denominated)',    '=SUMIFS(Income!C:C,Income!D:D,"GBP",Income!A:A,">="&DATE(YEAR(TODAY()),1,1))',                                    'EUR/USD rows excluded — convert manually'],
    ['Income all-time (GBP-denominated)','=SUMIFS(Income!C:C,Income!D:D,"GBP")',                                                                           '']
  ];
  sheet.getRange(1, 1, rows.length, 3).setValues(rows);
  sheet.getRange(1, 1, 1, 3).setFontWeight('bold').setBackground('#f0e6d2');
  sheet.getRange('B3').setNumberFormat('yyyy-mm-dd');
  sheet.getRange('B7').setNumberFormat('#,##0');
  sheet.getRange('B8').setNumberFormat('0%');
  sheet.getRange('B14:B15').setNumberFormat('#,##0.00');
  sheet.setColumnWidth(1, 300);
  sheet.setColumnWidth(2, 200);
  sheet.setColumnWidth(3, 340);
}

/* ─── Weekly financial statements ─────────────────────────────────
   Layout copied from your template screenshots. 10 weekly columns
   (Wk 1–Wk 10, dates Jun 2 → Aug 4) plus a TOTAL column. Input
   cells default to zero — you fill in real numbers, formulas
   recompute derived rows. Cashflow and Balance Sheet cross-reference
   the Income Statement, so change one number in IS and it flows
   through all three tabs.
   ─────────────────────────────────────────────────────────────── */

function ensureIncomeStatement_(ss) {
  if (ss.getSheetByName('Income Statement')) return;
  const sheet = ss.insertSheet('Income Statement');
  writeStatement_(sheet, 'INCOME STATEMENT', incomeStatementGrid_());
  applyIncomeStatementFormats_(sheet);
}

function ensureCashflowStatement_(ss) {
  if (ss.getSheetByName('Cashflow Statement')) return;
  const sheet = ss.insertSheet('Cashflow Statement');
  writeStatement_(sheet, 'CASHFLOW STATEMENT', cashflowStatementGrid_());
  applyCashflowFormats_(sheet);
}

function ensureBalanceSheet_(ss) {
  if (ss.getSheetByName('Balance Sheet')) return;
  const sheet = ss.insertSheet('Balance Sheet');
  writeStatement_(sheet, 'BALANCE SHEET', balanceSheetGrid_());
  applyBalanceSheetFormats_(sheet);
}

/* ─── Shared statement helpers ────────────────────────────────── */

const STMT_WEEKS = 10;
const STMT_NCOLS = STMT_WEEKS + 2;   // labels + weeks + total
const STMT_COLS  = 'ABCDEFGHIJKL';   // A + B..K weeks + L total
const STMT_START = new Date(Date.UTC(2026, 5, 2));  // Jun 2 2026 anchor

function writeStatement_(sheet, title, dataGrid) {
  const weekHeaders = [];
  const dateHeaders = [];
  for (let i = 0; i < STMT_WEEKS; i++) {
    weekHeaders.push('Wk ' + (i + 1));
    const d = new Date(STMT_START);
    d.setUTCDate(d.getUTCDate() + i * 7);
    dateHeaders.push(Utilities.formatDate(d, 'UTC', 'MMM d'));
  }

  const headerBlank = new Array(STMT_WEEKS).fill('');
  const grid = [
    [title].concat(headerBlank).concat(['']),
    ['Week'].concat(weekHeaders).concat(['TOTAL END OF SERVICE']),
    ['Date'].concat(dateHeaders).concat([''])
  ].concat(dataGrid);

  sheet.getRange(1, 1, grid.length, STMT_NCOLS).setValues(grid);

  /* Not merged — merging blocks setFrozenColumns below. Background
     is applied across the whole row for the same visual effect. */
  sheet.getRange(1, 1, 1, STMT_NCOLS)
    .setBackground('#1e4d7b').setFontColor('#ffffff');
  sheet.getRange(1, 1)
    .setFontWeight('bold').setFontSize(16)
    .setHorizontalAlignment('left').setVerticalAlignment('middle');
  sheet.setRowHeight(1, 40);
  sheet.getRange(2, 1, 2, STMT_NCOLS)
    .setFontWeight('bold').setBackground('#d6e4f0');

  sheet.setColumnWidth(1, 230);
  for (let i = 2; i <= STMT_NCOLS; i++) sheet.setColumnWidth(i, 92);
  sheet.setFrozenRows(3);
  sheet.setFrozenColumns(1);
}

/* Build a weekly row: label in col A, one cell per week (B..K), then a
   value/formula for the TOTAL column (L). `spec` is either a plain
   value (repeated across weeks) or a formula string where "%C%"
   marks the current column letter and gets substituted. */
function stmtRow_(label, spec, totalSpec) {
  const cells = [label];
  for (let i = 0; i < STMT_WEEKS; i++) {
    const col = STMT_COLS[i + 1];
    if (typeof spec === 'string' && spec.indexOf('%C%') !== -1) {
      cells.push(spec.replace(/%C%/g, col));
    } else {
      cells.push(spec);
    }
  }
  cells.push(totalSpec === undefined ? '' : totalSpec);
  return cells;
}

/* w-o-w growth row — first week is blank because there's no prior. */
function stmtGrowthRow_(label, sourceRow) {
  const cells = [label];
  for (let i = 0; i < STMT_WEEKS; i++) {
    if (i === 0) { cells.push(''); continue; }
    const c = STMT_COLS[i + 1], p = STMT_COLS[i];
    cells.push(`=IFERROR((${c}${sourceRow}-${p}${sourceRow})/${p}${sourceRow},"")`);
  }
  cells.push('');
  return cells;
}

function stmtSumTotal_(row) {
  return `=SUM(B${row}:${STMT_COLS[STMT_WEEKS]}${row})`;
}

/* Cash & APIC & RE rely on a running total of the prior week's value.
   First week is a seed (Cash = wk1 FCFF, APIC/RE = manual/formula),
   subsequent weeks add this week's flow to the prior week's balance. */
function stmtRunningRow_(label, seedFn, stepFn) {
  const cells = [label];
  for (let i = 0; i < STMT_WEEKS; i++) {
    const c = STMT_COLS[i + 1];
    if (i === 0) cells.push(seedFn(c));
    else cells.push(stepFn(c, STMT_COLS[i]));
  }
  cells.push('');
  return cells;
}

/* ─── Income Statement grid ──────────────────────────────────── */

function incomeStatementGrid_() {
  return [
    stmtRow_('Yards Revenue',            0,                                                stmtSumTotal_(4)),
    stmtRow_('Diversified Revenue',      0,                                                stmtSumTotal_(5)),
    stmtRow_('Net Sales',                '=%C%4+%C%5',                                     stmtSumTotal_(6)),
    stmtGrowthRow_('w-o-w growth', 6),
    stmtRow_('Imputed Labor (Non-Cash)', 0,                                                stmtSumTotal_(8)),
    stmtRow_('Depreciation Expense',     0,                                                stmtSumTotal_(9)),
    stmtRow_('Tax Rate (Assumed)',       0.15,                                             ''),
    stmtRow_('Imputed Tax Expense',      '=%C%15*%C%10',                                   stmtSumTotal_(11)),
    stmtRow_('Fuel Expense',             0,                                                stmtSumTotal_(12)),
    stmtRow_('Materials Expense',        0,                                                stmtSumTotal_(13)),
    stmtRow_('Total COGS',               '=%C%8+%C%9+%C%12+%C%13',                         stmtSumTotal_(14)),
    stmtRow_('EBIT',                     '=%C%6-%C%14',                                    stmtSumTotal_(15)),
    stmtRow_('Net Income',               '=%C%15-%C%11',                                   stmtSumTotal_(16)),
    stmtRow_('Adjusted Net Income',      '=%C%15+%C%8+%C%9',                               stmtSumTotal_(17)),
    stmtRow_('',                         '',                                               ''),
    stmtRow_('EBITDA',                   '=%C%15+%C%9',                                    stmtSumTotal_(19)),
    stmtRow_('Adjusted EBITDA',          '=%C%19+%C%8',                                    stmtSumTotal_(20)),
    stmtRow_('EBIT Margin',              '=IFERROR(%C%15/%C%6,"")',                        ''),
    stmtRow_('EBITDA Margin',            '=IFERROR(%C%19/%C%6,"")',                        ''),
    stmtRow_('Adjusted EBITDA Margin',   '=IFERROR(%C%20/%C%6,"")',                        ''),
    stmtRow_('Gross Profit Margin',      '=IFERROR((%C%6-%C%12-%C%13)/%C%6,"")',           ''),
    stmtRow_('Hours Worked',             0,                                                stmtSumTotal_(25)),
    stmtRow_('Rev / Hr',                 '=IFERROR(%C%6/%C%25,"")',                        '')
  ];
}

function applyIncomeStatementFormats_(sheet) {
  const usd = '$#,##0.00';
  const pct = '0%';
  const dataCols = STMT_NCOLS - 1;
  [4, 5, 6, 8, 9, 11, 12, 13, 14, 15, 16, 17, 19, 20, 26]
    .forEach(r => sheet.getRange(r, 2, 1, dataCols).setNumberFormat(usd));
  sheet.getRange(7, 2, 1, dataCols).setNumberFormat(pct);
  sheet.getRange(10, 2, 1, dataCols).setNumberFormat('0.0%');
  [21, 22, 23, 24].forEach(r => sheet.getRange(r, 2, 1, dataCols).setNumberFormat(pct));
  sheet.getRange(25, 2, 1, dataCols).setNumberFormat('0.0');
  [6, 14, 15, 16, 17].forEach(r =>
    sheet.getRange(r, 1, 1, STMT_NCOLS).setFontWeight('bold'));
}

/* ─── Cashflow Statement grid ─────────────────────────────────── */

function cashflowStatementGrid_() {
  const IS = "'Income Statement'";
  return [
    stmtRow_('Net Income',              `=${IS}!%C%16`,                                     stmtSumTotal_(4)),
    stmtRow_('D&A',                     `=${IS}!%C%9`,                                      stmtSumTotal_(5)),
    stmtRow_('Non-Cash Imputed Labor',  `=${IS}!%C%8`,                                      stmtSumTotal_(6)),
    stmtRow_('Changes in Working Capital', '',                                              ''),
    stmtRow_('Inventory (Increase)',    `=-${IS}!%C%13`,                                    stmtSumTotal_(8)),
    stmtRow_('Accrued Taxes (Increase)',`=${IS}!%C%11`,                                     stmtSumTotal_(9)),
    stmtRow_('CFO',                     '=%C%4+%C%5+%C%6+%C%8+%C%9',                        stmtSumTotal_(10)),
    stmtRow_('Investing Activities',    '',                                                 ''),
    stmtRow_('CapEx',                   0,                                                  stmtSumTotal_(12)),
    stmtRow_('CFI',                     '=-%C%12',                                          stmtSumTotal_(13)),
    stmtRow_('Financing Activities',    '',                                                 ''),
    stmtRow_('Owner Distributions',     0,                                                  stmtSumTotal_(15)),
    stmtRow_('Capital Contributions',   0,                                                  stmtSumTotal_(16)),
    stmtRow_('CFF',                     '=-%C%15+%C%16',                                    stmtSumTotal_(17)),
    stmtRow_('',                        '',                                                 ''),
    stmtRow_('FCFF',                    '=%C%10+%C%13',                                     stmtSumTotal_(19)),
    stmtGrowthRow_('w-o-w growth', 19)
  ];
}

function applyCashflowFormats_(sheet) {
  const usd = '$#,##0.00';
  const dataCols = STMT_NCOLS - 1;
  [4, 5, 6, 8, 9, 10, 12, 13, 15, 16, 17, 19]
    .forEach(r => sheet.getRange(r, 2, 1, dataCols).setNumberFormat(usd));
  sheet.getRange(20, 2, 1, dataCols).setNumberFormat('0%');
  [7, 10, 11, 13, 14, 17, 19].forEach(r =>
    sheet.getRange(r, 1, 1, STMT_NCOLS).setFontWeight('bold'));
}

/* ─── Balance Sheet grid ──────────────────────────────────────── */

function balanceSheetGrid_() {
  const IS = "'Income Statement'";
  const CF = "'Cashflow Statement'";
  return [
    stmtRow_('Current Assets',           '',                                                 ''),
    stmtRunningRow_('Cash & Equivalents',
      c => `=${CF}!${c}19`,
      (c, p) => `=${p}5+${CF}!${c}19`),
    stmtRow_('Inventory / Supplies',     `=${IS}!%C%13`,                                     ''),
    stmtRow_('AR',                       0,                                                  ''),
    stmtRunningRow_('PP&E',
      c => 700,
      (c, p) => `=${p}10`),
    stmtRow_('Accumulated Depreciation', `=-${IS}!%C%9`,                                     ''),
    stmtRow_('PP&E, NET',                '=%C%8+%C%9',                                       ''),
    stmtRow_('Total Current Assets',     '=%C%5+%C%6+%C%7+%C%10',                            ''),
    stmtRow_('Current Liabilities',      '',                                                 ''),
    stmtRow_('Accrued Taxes Payable',    `=${IS}!%C%11`,                                     ''),
    stmtRow_('Payroll Payable',          0,                                                  ''),
    stmtRow_('Total Liabilities',        '=%C%13+%C%14',                                     ''),
    stmtRow_("Shareholder's Equity",     '',                                                 ''),
    stmtRunningRow_('APIC',
      c => 700,
      (c, p) => `=${p}17`),
    stmtRunningRow_('RE',
      c => `=${IS}!${c}16`,
      (c, p) => `=${p}18+${IS}!${c}16`),
    stmtRow_('Total SE',                 '=%C%17+%C%18',                                     ''),
    stmtRow_('TOTAL Liabilities & SE',   '=%C%15+%C%19',                                     ''),
    stmtRow_('BS Check',                 '=%C%11-%C%20',                                     '')
  ];
}

function applyBalanceSheetFormats_(sheet) {
  const usd = '$#,##0.00';
  const dataCols = STMT_NCOLS - 1;
  [5, 6, 7, 8, 9, 10, 11, 13, 14, 15, 17, 18, 19, 20, 21]
    .forEach(r => sheet.getRange(r, 2, 1, dataCols).setNumberFormat(usd));
  [4, 11, 12, 15, 16, 19, 20, 21].forEach(r =>
    sheet.getRange(r, 1, 1, STMT_NCOLS).setFontWeight('bold'));
}
