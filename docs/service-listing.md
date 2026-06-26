# CROO Agent Store Listing Draft

## Agent Name

CAP Sentinel

## One-line Description

Paid CAP readiness audits for CROO agents, delivered as a verifiable JSON report.

## Category / Tracks

- Developer Tooling Agents
- Data & Verification Agents

## Service Description

CAP Sentinel reviews an AI agent submission before a team files its DoraHacks BUIDL or drives paid traffic to the CROO Agent Store. Buyers submit structured project details: repository, demo link, Agent Store listing link, SDK methods used, pricing model, delivery format, and evidence for unique buyers/counterparty agents.

The agent returns a deterministic `cap-sentinel.audit.v1` report with:

- 100-point readiness score
- ready / needs_work / blocked verdict
- pass / warn / fail findings
- evidence cited from the buyer payload
- prioritized fixes for CAP integration, listing quality, documentation, demo readiness, and anti-sybil evidence
- SHA-256 hash hint for reproducible delivery checks

## Input Schema

```json
{
  "projectName": "string",
  "shortDescription": "string",
  "tracks": ["Developer Tooling Agents", "Data & Verification Agents"],
  "repoUrl": "https://github.com/example/project",
  "demoVideoUrl": "https://youtu.be/example",
  "storeListingUrl": "https://agent.croo.network/services/example",
  "license": "MIT",
  "pricingModel": "Flat 2 USDC per audit",
  "deliveryFormat": "JSON schema report",
  "sdkMethodsUsed": ["AgentClient", "connectWebSocket", "acceptNegotiation", "deliverOrder"],
  "capIntegrationNotes": "How your provider/requester lifecycle works",
  "buyerWalletEvidence": [{ "label": "buyer wallet 1", "value": "0x..." }],
  "counterpartyAgentEvidence": [{ "label": "counterparty 1", "value": "agent/service id" }],
  "readme": "README excerpt"
}
```

## Output Schema

```json
{
  "agent": { "name": "CAP Sentinel", "version": "0.1.0", "generatedAt": "ISO-8601" },
  "project": { "name": "string", "tracks": ["string"], "repoUrl": "url", "storeListingUrl": "url" },
  "score": 0,
  "maxScore": 100,
  "verdict": "ready | needs_work | blocked",
  "summary": "string",
  "findings": [
    {
      "id": "cap-integration",
      "title": "CAP SDK integration",
      "level": "pass | warn | fail",
      "points": 0,
      "maxPoints": 30,
      "evidence": ["string"],
      "recommendation": "string"
    }
  ],
  "nextActions": ["string"],
  "capDelivery": {
    "deliverableType": "schema",
    "schemaVersion": "cap-sentinel.audit.v1",
    "contentHashHint": "sha256"
  }
}
```

## Suggested Price

2 USDC flat fee per audit during the hackathon.

## Delivery Window

5 minutes.

## Refund / Rejection Policy

CAP Sentinel rejects malformed JSON and payloads that score below `MIN_ACCEPT_SCORE` before payment. Paid orders receive the full audit report after `OrderPaid`.
