export interface ParsedMediaPlan {
  name: string;
  objective: string;
  flightStart: string;
  flightEnd: string;
  totalBudget: number;
  targetBlendedCac: number;
  targetBlendedRoas: number;
  channelWeights: Record<string, number>;
  evidence: string[];
}

const money = (value: string) => Number(value.replace(/[$,\s]/g, ''));
const findValue = (text: string, labels: string[]) => {
  const label = labels.join('|');
  return text.match(new RegExp(`(?:${label})\\s*[:=,\\t-]*\\s*\\$?([\\d,]+(?:\\.\\d+)?)`, 'i'))?.[1];
};

export function parseMediaPlanText(text: string, fileName = 'Imported media plan'): ParsedMediaPlan {
  const normalized = text.replace(/\r/g, '').trim();
  const budget = findValue(normalized, ['total budget', 'budget', 'media spend', 'planned spend']);
  const cac = findValue(normalized, ['target blended cac', 'blended cac', 'target cpa', 'target cac']);
  const roas = findValue(normalized, ['target blended roas', 'blended roas', 'target roas', 'roas target']);
  const dates = [...normalized.matchAll(/\b(20\d{2}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/20\d{2})\b/g)].map(match => match[1]);
  if (!budget || !dates[0] || !dates[1]) {
    throw new Error('The media plan must include a total budget and both flight dates.');
  }

  const channelWeights: Record<string, number> = {};
  for (const line of normalized.split('\n')) {
    const match = line.match(/^\s*([^,\t:]+)[,\t:]\s*([\d.]+)\s*%\s*$/);
    if (match) channelWeights[match[1].trim()] = Number(match[2]);
  }

  const title = normalized.match(/^(?:name|plan name|campaign)\s*[:=]\s*(.+)$/im)?.[1]?.trim()
    || fileName.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ');
  const objective = normalized.match(/^objective\s*[:=]\s*(.+)$/im)?.[1]?.trim() || 'Imported media plan objective';
  const evidence = [`Budget: ${budget}`, `Flight: ${dates[0]} to ${dates[1]}`];
  if (cac) evidence.push(`Target CAC: ${cac}`);
  if (roas) evidence.push(`Target ROAS: ${roas}`);
  if (Object.keys(channelWeights).length) evidence.push(`Channels: ${Object.keys(channelWeights).join(', ')}`);

  return {
    name: title,
    objective,
    flightStart: dates[0],
    flightEnd: dates[1],
    totalBudget: money(budget),
    targetBlendedCac: cac ? money(cac) : 0,
    targetBlendedRoas: roas ? Number(roas) : 0,
    channelWeights,
    evidence,
  };
}
