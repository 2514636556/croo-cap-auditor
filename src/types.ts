import { z } from 'zod';

export const EvidenceSchema = z.object({
  label: z.string().min(1),
  url: z.string().url().optional(),
  value: z.string().min(1).optional(),
});

export const SubmissionSchema = z.object({
  projectName: z.string().min(1),
  shortDescription: z.string().min(1),
  tracks: z.array(z.string().min(1)).min(1).max(2),
  repoUrl: z.string().url().optional(),
  demoVideoUrl: z.string().url().optional(),
  storeListingUrl: z.string().url().optional(),
  license: z.string().optional(),
  readme: z.string().optional(),
  capIntegrationNotes: z.string().optional(),
  sdkMethodsUsed: z.array(z.string().min(1)).optional(),
  pricingModel: z.string().optional(),
  deliveryFormat: z.string().optional(),
  buyerWalletEvidence: z.array(EvidenceSchema).optional(),
  counterpartyAgentEvidence: z.array(EvidenceSchema).optional(),
  sourceSnippets: z.array(z.string().min(1)).optional(),
  requestedChecks: z.array(z.string().min(1)).optional(),
});

export type SubmissionInput = z.infer<typeof SubmissionSchema>;

export type RiskLevel = 'pass' | 'warn' | 'fail';

export interface Finding {
  id: string;
  title: string;
  level: RiskLevel;
  points: number;
  maxPoints: number;
  evidence: string[];
  recommendation: string;
}

export interface AuditReport {
  agent: {
    name: string;
    version: string;
    generatedAt: string;
  };
  project: {
    name: string;
    tracks: string[];
    repoUrl?: string;
    storeListingUrl?: string;
  };
  score: number;
  maxScore: number;
  verdict: 'ready' | 'needs_work' | 'blocked';
  summary: string;
  findings: Finding[];
  nextActions: string[];
  capDelivery: {
    deliverableType: 'schema';
    schemaVersion: string;
    contentHashHint: string;
  };
}
