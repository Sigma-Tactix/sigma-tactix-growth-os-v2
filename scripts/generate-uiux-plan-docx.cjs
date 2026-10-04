const fs = require('fs');
const path = require('path');
const {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  HeadingLevel,
  LevelFormat,
  PageNumber,
  Packer,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} = require('docx');

const root = path.resolve(__dirname, '..');
const sourcePath = path.join(root, 'docs/plans/production-ui-ux-enterprise-polish-plan-2026-10-02.md');
const outputPath = path.join(root, 'docs/plans/production-ui-ux-enterprise-polish-plan-2026-10-02.docx');
const markdown = fs.readFileSync(sourcePath, 'utf8');

const ACCENT = 'FF481B';
const INK = '151515';
const MUTED = '60646C';
const PALE = 'FFF1EC';
const BORDER = 'D9DCE1';
const CONTENT_WIDTH = 9360;

function inlineRuns(text, options = {}) {
  const runs = [];
  const pattern = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let cursor = 0;
  let match;
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > cursor) runs.push(new TextRun({ text: text.slice(cursor, match.index), ...options }));
    const token = match[0];
    if (token.startsWith('**')) {
      runs.push(new TextRun({ text: token.slice(2, -2), bold: true, ...options }));
    } else {
      runs.push(new TextRun({ text: token.slice(1, -1), font: 'IBM Plex Mono', color: '4B5563', ...options }));
    }
    cursor = pattern.lastIndex;
  }
  if (cursor < text.length) runs.push(new TextRun({ text: text.slice(cursor), ...options }));
  return runs.length ? runs : [new TextRun({ text, ...options })];
}

function tableFrom(lines) {
  const rows = lines
    .filter((_, index) => index !== 1)
    .map(line => line.trim().replace(/^\||\|$/g, '').split('|').map(cell => cell.trim()));
  const columnCount = Math.max(...rows.map(row => row.length));
  const base = Math.floor(CONTENT_WIDTH / columnCount);
  const widths = Array.from({ length: columnCount }, (_, index) => index === columnCount - 1
    ? CONTENT_WIDTH - base * (columnCount - 1)
    : base);
  const border = { style: BorderStyle.SINGLE, size: 4, color: BORDER };
  const borders = { top: border, bottom: border, left: border, right: border };

  return new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: widths,
    rows: rows.map((row, rowIndex) => new TableRow({
      tableHeader: rowIndex === 0,
      children: widths.map((width, columnIndex) => new TableCell({
        width: { size: width, type: WidthType.DXA },
        borders,
        shading: { fill: rowIndex === 0 ? PALE : 'FFFFFF', type: ShadingType.CLEAR },
        margins: { top: 100, bottom: 100, left: 120, right: 120 },
        children: [new Paragraph({
          spacing: { after: 0 },
          children: inlineRuns(row[columnIndex] || '', {
            font: 'IBM Plex Sans',
            size: rowIndex === 0 ? 18 : 17,
            bold: rowIndex === 0,
            color: INK,
          }),
        })],
      })),
    })),
  });
}

const body = [];
const lines = markdown.split(/\r?\n/);
let inCode = false;
let codeLines = [];

for (let i = 0; i < lines.length; i += 1) {
  const line = lines[i];
  if (line.startsWith('```')) {
    if (inCode) {
      body.push(new Paragraph({
        shading: { fill: 'F5F6F8', type: ShadingType.CLEAR },
        border: { left: { style: BorderStyle.SINGLE, size: 16, color: ACCENT, space: 8 } },
        spacing: { before: 100, after: 180 },
        children: [new TextRun({ text: codeLines.join('\n'), font: 'IBM Plex Mono', size: 17, color: '374151' })],
      }));
      codeLines = [];
      inCode = false;
    } else {
      inCode = true;
    }
    continue;
  }
  if (inCode) {
    codeLines.push(line);
    continue;
  }

  if (/^\|.+\|$/.test(line) && /^\|?\s*:?-{3,}/.test(lines[i + 1] || '')) {
    const tableLines = [line, lines[i + 1]];
    i += 2;
    while (i < lines.length && /^\|.+\|$/.test(lines[i])) {
      tableLines.push(lines[i]);
      i += 1;
    }
    i -= 1;
    body.push(tableFrom(tableLines));
    body.push(new Paragraph({ spacing: { after: 120 } }));
    continue;
  }

  if (line.startsWith('# ')) {
    body.push(new Paragraph({
      heading: HeadingLevel.TITLE,
      spacing: { after: 180 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 18, color: ACCENT, space: 8 } },
      children: [new TextRun({ text: line.slice(2), font: 'IBM Plex Sans', size: 44, bold: true, color: INK })],
    }));
    continue;
  }
  if (line.startsWith('## ')) {
    body.push(new Paragraph({ heading: HeadingLevel.HEADING_1, children: inlineRuns(line.slice(3)) }));
    continue;
  }
  if (line.startsWith('### ')) {
    body.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: inlineRuns(line.slice(4)) }));
    continue;
  }
  if (/^- /.test(line)) {
    body.push(new Paragraph({ numbering: { reference: 'bullets', level: 0 }, children: inlineRuns(line.slice(2)) }));
    continue;
  }
  if (/^\d+\. /.test(line)) {
    body.push(new Paragraph({ numbering: { reference: 'numbers', level: 0 }, children: inlineRuns(line.replace(/^\d+\. /, '')) }));
    continue;
  }
  if (!line.trim()) {
    continue;
  }
  body.push(new Paragraph({ spacing: { after: 130, line: 300 }, children: inlineRuns(line) }));
}

const doc = new Document({
  creator: 'Codex',
  title: 'Sigma Tactix Growth OS Production UI UX and Enterprise Polish Plan',
  description: 'Evidence-backed production plan for onboarding, responsive UI, enterprise polish, and truthful claims.',
  styles: {
    default: { document: { run: { font: 'IBM Plex Sans', size: 20, color: INK } } },
    paragraphStyles: [
      {
        id: 'Title', name: 'Title', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { font: 'IBM Plex Sans', size: 44, bold: true, color: INK },
        paragraph: { spacing: { after: 220 }, outlineLevel: 0 },
      },
      {
        id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { font: 'IBM Plex Sans', size: 30, bold: true, color: INK },
        paragraph: { spacing: { before: 300, after: 140 }, outlineLevel: 0 },
      },
      {
        id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { font: 'IBM Plex Sans', size: 24, bold: true, color: ACCENT },
        paragraph: { spacing: { before: 220, after: 110 }, outlineLevel: 1 },
      },
    ],
  },
  numbering: {
    config: [
      {
        reference: 'bullets',
        levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 520, hanging: 240 } } } }],
      },
      {
        reference: 'numbers',
        levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 520, hanging: 240 } } } }],
      },
    ],
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 },
        margin: { top: 1080, right: 1440, bottom: 1080, left: 1440 },
      },
    },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: [
            new TextRun({ text: 'Sigma Tactix Growth OS  |  Production plan  |  ', color: MUTED, size: 16 }),
            new TextRun({ children: [PageNumber.CURRENT], color: MUTED, size: 16 }),
          ],
        })],
      }),
    },
    children: body,
  }],
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync(outputPath, buffer);
  process.stdout.write(`${outputPath}\n`);
});
