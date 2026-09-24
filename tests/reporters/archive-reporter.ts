import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { FullConfig, FullResult, Reporter, Suite } from '@playwright/test/reporter';

// Archives each completed run as test-history/<started>/run.json, which the quality report reads
// as "what actually executed". Scoped runs that replace the reporter list are not archived.
export default class ArchiveReporter implements Reporter {
  private suite!: Suite;
  private projects: string[] = [];

  onBegin(config: FullConfig, suite: Suite) {
    this.suite = suite;
    this.projects = config.projects.map((p) => p.name);
  }

  onEnd(result: FullResult) {
    const tests = this.suite.allTests().map((t) => ({
      title: t.title,
      file: t.location.file,
      project: t.parent.project()?.name ?? '',
      outcome: t.outcome(),
    }));
    const count = (outcome: string) => tests.filter((t) => t.outcome === outcome).length;
    const started = result.startTime.toISOString();
    const run = {
      started,
      status: result.status,
      total: tests.length,
      expected: count('expected'),
      unexpected: count('unexpected'),
      flaky: count('flaky'),
      skipped: count('skipped'),
      duration: Math.round(result.duration),
      scope: `${this.projects.join(', ')}|npx playwright ${process.argv.slice(2).join(' ')}`,
      tests,
    };
    const dir = join('test-history', started.replace(/[:.]/g, ''));
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'run.json'), `${JSON.stringify(run, null, 2)}\n`);
  }
}
