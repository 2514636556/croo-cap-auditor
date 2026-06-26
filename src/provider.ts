import 'dotenv/config';
import { AgentClient, DeliverableType, EventType, isInvalidStatus } from '@croo-network/sdk';
import pc from 'picocolors';
import { auditSubmission } from './analyzer.js';
import { parseRequirements } from './io.js';
import { renderJson } from './renderer.js';

const required = ['CROO_API_URL', 'CROO_WS_URL', 'CROO_SDK_KEY'] as const;
const missing = required.filter((key) => !process.env[key]);

if (missing.length > 0) {
  throw new Error(`Missing required environment variable(s): ${missing.join(', ')}`);
}

const client = new AgentClient(
  {
    baseURL: process.env.CROO_API_URL!,
    wsURL: process.env.CROO_WS_URL!,
    rpcURL: process.env.BASE_RPC_URL,
    logger: console,
  },
  process.env.CROO_SDK_KEY!,
);

const minAcceptScore = Number(process.env.MIN_ACCEPT_SCORE ?? '40');
const providerFundAddress = process.env.PROVIDER_FUND_ADDRESS;

console.log(pc.cyan('CAP Sentinel provider starting...'));
const stream = await client.connectWebSocket();
console.log(pc.green('Connected to CROO event stream.'));

stream.on(EventType.NegotiationCreated, async (event) => {
  if (!event.negotiation_id) return;

  try {
    const negotiation = await client.getNegotiation(event.negotiation_id);
    const payload = parseRequirements(negotiation.requirements);
    const report = auditSubmission(payload);

    if (report.score < minAcceptScore) {
      await client.rejectNegotiation(
        negotiation.negotiationId,
        `CAP Sentinel rejected this request because the initial payload scored ${report.score}/${report.maxScore}. Add repo, CAP integration notes, and delivery details.`,
      );
      console.log(pc.yellow(`Rejected weak negotiation ${negotiation.negotiationId}: ${report.score}/${report.maxScore}`));
      return;
    }

    const accepted = providerFundAddress
      ? await client.acceptNegotiationWithFundAddress(negotiation.negotiationId, providerFundAddress)
      : await client.acceptNegotiation(negotiation.negotiationId);

    console.log(pc.green(`Accepted negotiation ${negotiation.negotiationId}; order ${accepted.order.orderId}`));
  } catch (error) {
    await rejectNegotiationSafely(event.negotiation_id, error);
  }
});

stream.on(EventType.OrderPaid, async (event) => {
  if (!event.order_id) return;

  try {
    const order = await client.getOrder(event.order_id);
    const negotiation = await client.getNegotiation(order.negotiationId);
    const payload = parseRequirements(negotiation.requirements);
    const report = auditSubmission(payload);

    await client.deliverOrder(order.orderId, {
      deliverableType: DeliverableType.Schema,
      deliverableSchema: 'cap-sentinel.audit.v1',
      deliverableText: renderJson(report),
    });

    console.log(pc.green(`Delivered audit for order ${order.orderId}: ${report.score}/${report.maxScore}`));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(pc.red(`Failed to deliver order ${event.order_id}: ${message}`));
  }
});

stream.onAny((event) => {
  console.log(pc.dim(`event=${event.type} negotiation=${event.negotiation_id ?? '-'} order=${event.order_id ?? '-'}`));
});

process.on('SIGINT', () => {
  console.log(pc.yellow('Closing CAP Sentinel provider...'));
  stream.close();
  process.exit(0);
});

async function rejectNegotiationSafely(negotiationId: string, error: unknown): Promise<void> {
  const message = error instanceof Error ? error.message : String(error);
  console.error(pc.red(`Negotiation ${negotiationId} failed validation: ${message}`));

  try {
    await client.rejectNegotiation(negotiationId, `CAP Sentinel could not parse or validate the request: ${message}`);
  } catch (rejectError) {
    if (isInvalidStatus(rejectError)) {
      console.error(pc.yellow(`Negotiation ${negotiationId} was no longer rejectable.`));
      return;
    }
    const rejectMessage = rejectError instanceof Error ? rejectError.message : String(rejectError);
    console.error(pc.red(`Failed to reject negotiation ${negotiationId}: ${rejectMessage}`));
  }
}
