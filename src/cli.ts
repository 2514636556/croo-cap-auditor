#!/usr/bin/env node
import { Command } from 'commander';
import pc from 'picocolors';
import { auditSubmission } from './analyzer.js';
import { readJsonFile } from './io.js';
import { renderJson, renderMarkdown } from './renderer.js';

const program = new Command();

program
  .name('cap-sentinel')
  .description('Audit CROO CAP hackathon submissions for integration readiness.')
  .version('0.1.0');

program
  .command('audit')
  .description('Audit a submission JSON payload.')
  .requiredOption('-i, --input <file>', 'Path to a submission JSON file')
  .option('-f, --format <format>', 'Output format: json or markdown', 'json')
  .action(async (options: { input: string; format: string }) => {
    const payload = await readJsonFile(options.input);
    const report = auditSubmission(payload);
    const format = options.format.toLowerCase();

    if (format === 'markdown' || format === 'md') {
      process.stdout.write(renderMarkdown(report));
      return;
    }

    if (format === 'json') {
      process.stdout.write(renderJson(report));
      return;
    }

    process.stderr.write(pc.red(`Unsupported format: ${options.format}\n`));
    process.exitCode = 1;
  });

program.parseAsync().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(pc.red(`${message}\n`));
  process.exitCode = 1;
});
