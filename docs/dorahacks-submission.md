# DoraHacks BUIDL Submission Draft

## Project Name

CAP Sentinel

## Tagline

A paid CROO CAP verification agent that tells builders whether their agent is ready to list, sell, and survive hackathon review.

## Tracks

- Developer Tooling Agents
- Data & Verification Agents

## Short Description

CAP Sentinel is a callable CROO provider agent for CAP builders. It accepts a structured project payload, scores the submission against CROO Agent Hackathon requirements, and delivers a deterministic JSON audit with evidence, risk flags, and prioritized fixes.

## Problem

CROO builders must satisfy several checks at once: CAP integration, Agent Store listing, public permissive-license repository, demo video, documentation, and anti-sybil evidence. Teams often discover gaps only at final submission time or during human spot checks.

## Solution

CAP Sentinel converts those requirements into a paid, composable verification service. A requester agent or human buyer submits project details through CROO. CAP Sentinel accepts the negotiation, waits for payment, audits the payload, and delivers a schema-based report through `deliverOrder`.

## CAP Integration

The provider runtime uses `@croo-network/sdk`:

- `AgentClient` for authenticated CROO runtime operations
- `connectWebSocket()` for live CAP events
- `EventType.NegotiationCreated` to inspect and accept or reject requests
- `acceptNegotiation()` or `acceptNegotiationWithFundAddress()` to create orders
- `EventType.OrderPaid` to trigger delivery only after payment
- `deliverOrder()` with `DeliverableType.Schema` for the final audit

## What Makes It Useful

- Deterministic scoring, so buyers can reproduce and compare audits
- Clear pass/warn/fail findings tied to evidence from the payload
- Practical next actions for missing repo, license, demo, listing, SDK usage, pricing, delivery schema, and buyer/counterparty evidence
- Usable locally without credentials and callable as a paid CROO provider when configured with an SDK key

## Repository

`https://github.com/2514636556/croo-cap-auditor`

## Demo Video

Use the generated demo asset after publishing the repository, or upload it to YouTube/Loom:

- Local file: `media/cap-sentinel-demo.mp4`
- Public link: `https://raw.githubusercontent.com/2514636556/croo-cap-auditor/main/media/cap-sentinel-demo.mp4`

## Agent Store Listing

Pending wallet/Agent Store authorization: `https://agent.croo.network/pending-cap-sentinel-listing`

## License

MIT

## How To Run

```bash
npm install
npm run demo
cp .env.example .env
npm run provider
```

## Demo Script

1. Show `npm run demo` producing the local markdown audit.
2. Show the JSON payload and explain the fields a buyer submits.
3. Show provider mode reading `CROO_API_URL`, `CROO_WS_URL`, and `CROO_SDK_KEY`.
4. Explain the runtime flow: negotiation created, accepted, order paid, schema report delivered.
5. Open `docs/service-listing.md` and show the Agent Store input/output schema.
