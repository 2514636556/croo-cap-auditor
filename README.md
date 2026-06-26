# CAP Sentinel

CAP Sentinel is a paid, callable CROO agent that audits CAP hackathon submissions before teams file their final BUIDL. It scores a project against CROO Agent Hackathon requirements, flags CAP integration gaps, and delivers a verifiable JSON report through the CROO Agent Protocol.

Built for the **Developer Tooling Agents** and **Data & Verification Agents** tracks.

## Why It Exists

CROO builders need more than working code. A strong submission needs a public permissive-license repo, a short demo, Agent Store listing, CAP payment/delivery integration, clean setup docs, and evidence that the service can survive human spot checks. CAP Sentinel turns those requirements into a composable paid audit service.

## What It Checks

- Public repository and permissive license
- Demo video readiness
- CROO Agent Store listing and pricing clarity
- CAP SDK lifecycle: `connectWebSocket`, negotiation acceptance, `OrderPaid`, `deliverOrder`
- Paid service shape and output schema
- Buyer-wallet and counterparty-agent evidence
- README/setup quality
- Track fit for at most two hackathon tracks

## CAP Integration

The provider runtime uses the official `@croo-network/sdk` package:

- `AgentClient`
- `connectWebSocket()`
- `EventType.NegotiationCreated`
- `acceptNegotiation()` / `acceptNegotiationWithFundAddress()`
- `EventType.OrderPaid`
- `deliverOrder()`
- `DeliverableType.Schema`

The local CLI runs without credentials for demos. Provider mode requires a CROO Agent Store service and SDK key.

## Quick Start

```bash
npm install
npm run demo
```

Run the same audit as JSON:

```bash
npm run demo:json
```

Generate the short demo video used for hackathon submission:

```bash
npm run demo:video
```

Audit your own payload:

```bash
npm run dev -- audit --input path/to/submission.json --format markdown
```

## Provider Mode

Create an `.env` file from `.env.example`:

```bash
cp .env.example .env
```

Set:

```bash
CROO_API_URL=https://api.croo.network
CROO_WS_URL=wss://api.croo.network/ws
CROO_SDK_KEY=croo_sk_your_key
```

Then run:

```bash
npm run provider
```

CAP Sentinel will:

1. Listen for `EventType.NegotiationCreated`.
2. Fetch and parse the negotiation requirements JSON.
3. Reject malformed or very weak requests before payment.
4. Accept valid negotiations.
5. Wait for `EventType.OrderPaid`.
6. Deliver a `cap-sentinel.audit.v1` schema report with `deliverOrder()`.

## Input Payload

See [examples/sample-submission.json](examples/sample-submission.json).

Important fields:

- `projectName`
- `shortDescription`
- `tracks`
- `repoUrl`
- `demoVideoUrl`
- `storeListingUrl`
- `license`
- `pricingModel`
- `deliveryFormat`
- `sdkMethodsUsed`
- `capIntegrationNotes`
- `buyerWalletEvidence`
- `counterpartyAgentEvidence`
- `readme`

## Output

The report includes:

- score out of 100
- `ready`, `needs_work`, or `blocked` verdict
- findings with pass/warn/fail levels
- evidence cited from the buyer payload
- prioritized next actions
- `contentHashHint` for reproducibility checks

## Development

```bash
npm run typecheck
npm test
npm run build
```

## Hackathon Materials

- Agent Store listing draft: [docs/service-listing.md](docs/service-listing.md)
- DoraHacks submission draft: [docs/dorahacks-submission.md](docs/dorahacks-submission.md)
- Demo video asset: [media/cap-sentinel-demo.mp4](media/cap-sentinel-demo.mp4)
- Public repository: <https://github.com/2514636556/croo-cap-auditor>
- Public demo video: <https://raw.githubusercontent.com/2514636556/croo-cap-auditor/main/media/cap-sentinel-demo.mp4>

## License

MIT
