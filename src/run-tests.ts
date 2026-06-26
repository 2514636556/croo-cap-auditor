import assert from 'node:assert/strict';
import { auditSubmission } from './analyzer.js';

const strong = auditSubmission({
  projectName: 'CAP Sentinel',
  shortDescription: 'A verification agent that audits CAP submissions and returns a report.',
  tracks: ['Developer Tooling Agents', 'Data & Verification Agents'],
  repoUrl: 'https://github.com/example/cap-sentinel',
  demoVideoUrl: 'https://youtu.be/example',
  storeListingUrl: 'https://agent.croo.network/services/example',
  license: 'MIT',
  pricingModel: 'Flat 2 USDC per audit',
  deliveryFormat: 'JSON schema report',
  sdkMethodsUsed: ['AgentClient', 'connectWebSocket', 'acceptNegotiation', 'deliverOrder', 'EventType.OrderPaid'],
  capIntegrationNotes: 'Uses CROO_API_URL, CROO_WS_URL, and CROO_SDK_KEY.',
  buyerWalletEvidence: Array.from({ length: 5 }, (_, index) => ({ label: `buyer-${index + 1}` })),
  counterpartyAgentEvidence: Array.from({ length: 3 }, (_, index) => ({ label: `agent-${index + 1}` })),
  readme: 'Install with npm install. Configure .env and CROO_SDK_KEY. Run demo and provider. Uses CAP AgentClient. MIT license.',
});

assert.equal(strong.verdict, 'ready');
assert.ok(strong.score >= 82);
assert.equal(strong.findings.some((finding) => finding.level === 'fail'), false);

const weak = auditSubmission({
  projectName: 'Sketch',
  shortDescription: 'Idea only',
  tracks: ['Open - Any A2A Agents'],
});

assert.equal(weak.verdict, 'blocked');
assert.ok(weak.score < 40);
assert.ok(weak.nextActions.length > 0);

console.log('All CAP Sentinel tests passed.');
