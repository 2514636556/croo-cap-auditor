import { createHash } from 'node:crypto';
import { AuditReport, Finding, SubmissionInput, SubmissionSchema } from './types.js';

const AGENT_NAME = 'CAP Sentinel';
const AGENT_VERSION = '0.1.0';
const MAX_SCORE = 100;

const PERMISSIVE_LICENSES = [
  'mit',
  'apache-2.0',
  'apache 2.0',
  'bsd',
  'mpl-2.0',
  'isc',
];

const CAP_METHODS = [
  'AgentClient',
  'connectWebSocket',
  'acceptNegotiation',
  'acceptNegotiationWithFundAddress',
  'deliverOrder',
  'negotiateOrder',
  'payOrder',
  'getDelivery',
  'uploadFile',
  'EventType.NegotiationCreated',
  'EventType.OrderPaid',
  'DeliverableType',
];

const REQUIRED_ENV = [
  'CROO_API_URL',
  'CROO_WS_URL',
  'CROO_SDK_KEY',
];

export function parseSubmission(raw: unknown): SubmissionInput {
  return SubmissionSchema.parse(raw);
}

export function auditSubmission(raw: unknown): AuditReport {
  const input = parseSubmission(raw);
  const findings: Finding[] = [
    checkOpenSource(input),
    checkDemo(input),
    checkStoreListing(input),
    checkCapIntegration(input),
    checkPaidServiceShape(input),
    checkVerificationEvidence(input),
    checkDocumentation(input),
    checkTrackFit(input),
  ];

  const rawScore = findings.reduce((sum, finding) => sum + finding.points, 0);
  const rawMaxScore = findings.reduce((sum, finding) => sum + finding.maxPoints, 0);
  const score = Math.round((rawScore / rawMaxScore) * MAX_SCORE);
  const failCount = findings.filter((finding) => finding.level === 'fail').length;
  const warnCount = findings.filter((finding) => finding.level === 'warn').length;
  const verdict: AuditReport['verdict'] = failCount > 0 ? 'blocked' : score >= 82 ? 'ready' : 'needs_work';
  const summary = summarize(input, score, failCount, warnCount);
  const nextActions = findings
    .filter((finding) => finding.level !== 'pass')
    .sort((a, b) => severityRank(b.level) - severityRank(a.level) || b.maxPoints - b.points - (a.maxPoints - a.points))
    .map((finding) => finding.recommendation)
    .slice(0, 6);

  const reportWithoutHash = {
    agent: {
      name: AGENT_NAME,
      version: AGENT_VERSION,
      generatedAt: new Date().toISOString(),
    },
    project: {
      name: input.projectName,
      tracks: input.tracks,
      repoUrl: input.repoUrl,
      storeListingUrl: input.storeListingUrl,
    },
    score,
    maxScore: MAX_SCORE,
    verdict,
    summary,
    findings,
    nextActions,
  };

  const contentHashHint = createHash('sha256')
    .update(JSON.stringify(reportWithoutHash))
    .digest('hex');

  return {
    ...reportWithoutHash,
    capDelivery: {
      deliverableType: 'schema',
      schemaVersion: 'cap-sentinel.audit.v1',
      contentHashHint,
    },
  };
}

function checkOpenSource(input: SubmissionInput): Finding {
  const evidence: string[] = [];
  let points = 0;

  if (input.repoUrl) {
    evidence.push(`Repository supplied: ${input.repoUrl}`);
    points += 7;
  }

  const license = (input.license ?? '').trim();
  if (license) {
    evidence.push(`License declared: ${license}`);
  }

  if (PERMISSIVE_LICENSES.some((candidate) => license.toLowerCase().includes(candidate))) {
    points += 8;
  }

  return finding({
    id: 'open-source',
    title: 'Open-source repository and permissive license',
    points,
    maxPoints: 15,
    evidence,
    recommendation: 'Publish the code in a public GitHub/GitLab/Bitbucket repository and declare MIT, Apache-2.0, BSD, MPL-2.0, or another permissive license.',
  });
}

function checkDemo(input: SubmissionInput): Finding {
  const hasDemo = Boolean(input.demoVideoUrl);
  return finding({
    id: 'demo-video',
    title: 'Demo video readiness',
    points: hasDemo ? 10 : 0,
    maxPoints: 10,
    evidence: hasDemo ? [`Demo URL supplied: ${input.demoVideoUrl}`] : [],
    recommendation: 'Record a demo video under five minutes that shows a buyer request, CAP order lifecycle, delivery, and the final audit report.',
  });
}

function checkStoreListing(input: SubmissionInput): Finding {
  const hasListing = Boolean(input.storeListingUrl);
  const mentionsPrice = containsAny(input.pricingModel, ['usdc', '$', 'price', 'paid', 'flat']);
  return finding({
    id: 'agent-store-listing',
    title: 'CROO Agent Store listing',
    points: (hasListing ? 12 : 0) + (mentionsPrice ? 3 : 0),
    maxPoints: 15,
    evidence: [
      ...(hasListing ? [`Store listing supplied: ${input.storeListingUrl}`] : []),
      ...(input.pricingModel ? [`Pricing model: ${input.pricingModel}`] : []),
    ],
    recommendation: 'Create a CROO Agent Store service with clear price, delivery window, refund expectations, and this agent output schema.',
  });
}

function checkCapIntegration(input: SubmissionInput): Finding {
  const haystack = [
    input.capIntegrationNotes,
    ...(input.sdkMethodsUsed ?? []),
    ...(input.sourceSnippets ?? []),
    input.readme,
  ].join('\n');

  const matchedMethods = CAP_METHODS.filter((method) => haystack.includes(method));
  const envMatches = REQUIRED_ENV.filter((envName) => haystack.includes(envName));
  const hasProviderLifecycle =
    matchedMethods.includes('connectWebSocket') &&
    (matchedMethods.includes('acceptNegotiation') || matchedMethods.includes('acceptNegotiationWithFundAddress')) &&
    matchedMethods.includes('deliverOrder');

  let points = Math.min(14, matchedMethods.length * 2);
  if (hasProviderLifecycle) points += 9;
  if (envMatches.length === REQUIRED_ENV.length) points += 4;
  if (containsAny(haystack, ['OrderPaid', 'order_paid'])) points += 3;

  return finding({
    id: 'cap-integration',
    title: 'CAP SDK integration',
    points: Math.min(points, 30),
    maxPoints: 30,
    evidence: [
      ...(matchedMethods.length ? [`SDK/API methods detected: ${matchedMethods.join(', ')}`] : []),
      ...(envMatches.length ? [`Runtime env vars documented: ${envMatches.join(', ')}`] : []),
    ],
    recommendation: 'Wire the provider lifecycle end to end: connectWebSocket, acceptNegotiation, wait for OrderPaid, then deliverOrder with a typed deliverable.',
  });
}

function checkPaidServiceShape(input: SubmissionInput): Finding {
  const delivery = input.deliveryFormat ?? '';
  const hasSchema = containsAny(delivery, ['json', 'schema', 'markdown', 'report']);
  const hasPricing = Boolean(input.pricingModel && input.pricingModel.trim().length > 6);
  const hasBuyerValue = containsAny(`${input.shortDescription}\n${input.readme ?? ''}`, [
    'audit',
    'verify',
    'score',
    'research',
    'monitor',
    'report',
    'action',
    'agent',
  ]);

  return finding({
    id: 'paid-service-shape',
    title: 'Paid service and deliverable shape',
    points: (hasSchema ? 6 : 0) + (hasPricing ? 5 : 0) + (hasBuyerValue ? 4 : 0),
    maxPoints: 15,
    evidence: [
      ...(delivery ? [`Delivery format: ${delivery}`] : []),
      ...(input.pricingModel ? [`Pricing model: ${input.pricingModel}`] : []),
    ],
    recommendation: 'Define the service as a concrete paid job: input fields, USDC price, SLA, output schema, and a buyer-visible success condition.',
  });
}

function checkVerificationEvidence(input: SubmissionInput): Finding {
  const buyerWallets = input.buyerWalletEvidence?.length ?? 0;
  const counterparties = input.counterpartyAgentEvidence?.length ?? 0;
  const hasProvenance = containsAny(`${input.readme ?? ''}\n${input.capIntegrationNotes ?? ''}`, [
    'source',
    'provenance',
    'hash',
    'receipt',
    'tx',
    'wallet',
    'counterparty',
  ]);

  let points = Math.min(5, buyerWallets) + Math.min(5, counterparties);
  if (hasProvenance) points += 5;

  return finding({
    id: 'verification-evidence',
    title: 'Anti-sybil and verification evidence',
    points,
    maxPoints: 15,
    evidence: [
      `${buyerWallets} buyer wallet evidence item(s)`,
      `${counterparties} counterparty agent evidence item(s)`,
      ...(hasProvenance ? ['Provenance language detected in docs'] : []),
    ],
    recommendation: 'Collect at least five buyer wallets, three unique counterparty agents, transaction hashes, and a reproducible audit trail for spot checks.',
    level: points >= 12 ? 'pass' : 'warn',
  });
}

function checkDocumentation(input: SubmissionInput): Finding {
  const readme = input.readme ?? '';
  const sections = [
    containsAny(readme, ['install', 'setup', 'npm install']),
    containsAny(readme, ['environment', 'CROO_SDK_KEY', '.env']),
    containsAny(readme, ['run', 'demo', 'provider']),
    containsAny(readme, ['sdk', 'CAP', 'AgentClient']),
    containsAny(readme, ['license', 'MIT', 'Apache']),
  ];
  const points = sections.filter(Boolean).length * 2;

  return finding({
    id: 'documentation',
    title: 'README and setup instructions',
    points,
    maxPoints: 10,
    evidence: [`${sections.filter(Boolean).length}/5 expected README topics detected`],
    recommendation: 'Expand the README with setup, env vars, demo commands, SDK methods used, listing notes, and license details.',
  });
}

function checkTrackFit(input: SubmissionInput): Finding {
  const validTrackCount = input.tracks.length > 0 && input.tracks.length <= 2;
  const trackText = input.tracks.join(', ');
  const description = `${input.shortDescription}\n${input.readme ?? ''}`.toLowerCase();
  const hasClearFit = input.tracks.some((track) => {
    const normalized = track.toLowerCase();
    return normalized.includes('developer') ||
      normalized.includes('verification') ||
      normalized.includes('data') ||
      description.includes(firstKeyword(normalized));
  });

  return finding({
    id: 'track-fit',
    title: 'Track fit and positioning',
    points: (validTrackCount ? 3 : 0) + (hasClearFit ? 2 : 0),
    maxPoints: 5,
    evidence: [`Selected track(s): ${trackText}`],
    recommendation: 'Pick at most two tracks and make the README explicitly explain why the agent belongs in each selected track.',
  });
}

function finding(args: Omit<Finding, 'level'> & { level?: Finding['level'] }): Finding {
  const ratio = args.maxPoints === 0 ? 1 : args.points / args.maxPoints;
  const level = args.level ?? (ratio >= 0.8 ? 'pass' : ratio >= 0.45 ? 'warn' : 'fail');
  return {
    ...args,
    points: Math.max(0, Math.min(args.points, args.maxPoints)),
    level,
    evidence: args.evidence.length ? args.evidence : ['No supporting evidence supplied.'],
  };
}

function containsAny(value: string | undefined, needles: string[]): boolean {
  const normalized = (value ?? '').toLowerCase();
  return needles.some((needle) => normalized.includes(needle.toLowerCase()));
}

function firstKeyword(value: string): string {
  return value
    .split(/[^a-z0-9]+/u)
    .find((part) => part.length > 3) ?? value;
}

function severityRank(level: Finding['level']): number {
  if (level === 'fail') return 2;
  if (level === 'warn') return 1;
  return 0;
}

function summarize(input: SubmissionInput, score: number, failCount: number, warnCount: number): string {
  if (failCount === 0 && score >= 82) {
    return `${input.projectName} looks submission-ready for CROO judging with ${score}/${MAX_SCORE}. Keep buyer/counterparty evidence fresh before final DoraHacks submission.`;
  }

  if (failCount > 0) {
    return `${input.projectName} is blocked by ${failCount} critical readiness gap(s). Fix those before paying for traffic or filing the final BUIDL.`;
  }

  return `${input.projectName} is close but has ${warnCount} warning area(s). Tighten the evidence and documentation before final review.`;
}
