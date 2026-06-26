import { AuditReport } from './types.js';

export function renderMarkdown(report: AuditReport): string {
  const lines: string[] = [];
  lines.push(`# ${report.agent.name} Audit`);
  lines.push('');
  lines.push(`Project: **${report.project.name}**`);
  lines.push(`Score: **${report.score}/${report.maxScore}**`);
  lines.push(`Verdict: **${report.verdict}**`);
  lines.push(`Generated: ${report.agent.generatedAt}`);
  lines.push('');
  lines.push(report.summary);
  lines.push('');
  lines.push('## Findings');
  lines.push('');

  for (const finding of report.findings) {
    lines.push(`### ${finding.level.toUpperCase()} - ${finding.title} (${finding.points}/${finding.maxPoints})`);
    lines.push('');
    lines.push('Evidence:');
    for (const evidence of finding.evidence) {
      lines.push(`- ${evidence}`);
    }
    lines.push('');
    lines.push(`Recommendation: ${finding.recommendation}`);
    lines.push('');
  }

  lines.push('## Next Actions');
  lines.push('');
  if (report.nextActions.length === 0) {
    lines.push('- Ready for submission. Keep public links, listing, and demo video accessible.');
  } else {
    for (const action of report.nextActions) {
      lines.push(`- ${action}`);
    }
  }
  lines.push('');
  lines.push('## CAP Delivery');
  lines.push('');
  lines.push(`- Deliverable type: ${report.capDelivery.deliverableType}`);
  lines.push(`- Schema version: ${report.capDelivery.schemaVersion}`);
  lines.push(`- Hash hint: ${report.capDelivery.contentHashHint}`);

  return `${lines.join('\n')}\n`;
}

export function renderJson(report: AuditReport): string {
  return `${JSON.stringify(report, null, 2)}\n`;
}
