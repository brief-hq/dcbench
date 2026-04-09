#!/usr/bin/env npx tsx
/**
 * Benchmark Seed Script
 *
 * Seeds a Brief workspace with synthetic product context for the benchmark
 * framework. Uses the Brief HTTP API — no direct DB access or monorepo imports.
 *
 * Usage:
 *   npx tsx benchmark/seed.ts --api-url https://app.briefhq.com --api-key sk_...
 *   npx tsx benchmark/seed.ts --api-url <url> --api-key <key> --verify
 *   npx tsx benchmark/seed.ts --api-url <url> --api-key <key> --dry-run
 *
 * Environment variables (alternative to CLI flags):
 *   BRIEF_API_URL — Base URL of the Brief instance
 *   BRIEF_API_KEY — API key for authentication
 *
 * Idempotent: safe to run multiple times. Decisions use built-in dedup,
 * signals upsert by theme, personas and competitors check before creating.
 */

import * as fs from 'fs';
import * as path from 'path';

import {
  BENCHMARK_DECISIONS,
  BENCHMARK_PERSONAS,
  BENCHMARK_SIGNALS,
  BENCHMARK_COMPETITORS,
  type DecisionPayload,
  type PersonaPayload,
  type SignalPayload,
  type CompetitorPayload,
} from './seed-data';

// ---------------------------------------------------------------------------
// CLI args + env vars
// ---------------------------------------------------------------------------

function getArg(name: string): string | undefined {
  const arg = process.argv.find((a) => a.startsWith(`--${name}=`));
  return arg?.split('=').slice(1).join('=');
}

const API_URL = getArg('api-url') || process.env.BRIEF_API_URL;
const API_KEY = getArg('api-key') || process.env.BRIEF_API_KEY;
const VERIFY = process.argv.includes('--verify');
const DRY_RUN = process.argv.includes('--dry-run');

const SNAPSHOT_PATH = path.resolve(__dirname, 'seed-snapshot.json');

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SeedCounts {
  created: number;
  skipped: number;
  failed: number;
}

interface SnapshotDecision {
  id: string;
  topic: string;
  decision: string;
}

interface SnapshotPersona {
  id: string;
  segment_name: string;
}

interface SnapshotSignal {
  id: string;
  theme: string;
}

interface SnapshotCompetitor {
  id: string;
  domain: string;
}

interface Snapshot {
  version: number;
  api_url: string;
  created_at: string;
  entities: {
    decisions: SnapshotDecision[];
    personas: SnapshotPersona[];
    signals: SnapshotSignal[];
    competitors: SnapshotCompetitor[];
  };
  counts: {
    decisions: number;
    personas: number;
    signals: number;
    competitors: number;
  };
}

// ---------------------------------------------------------------------------
// HTTP helpers
// ---------------------------------------------------------------------------

async function apiGet<T>(endpoint: string): Promise<T> {
  const res = await fetch(`${API_URL}/api/v1${endpoint}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GET ${endpoint} failed (${res.status}): ${text}`);
  }
  return res.json() as Promise<T>;
}

async function apiPost<T>(endpoint: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_URL}/api/v1${endpoint}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`POST ${endpoint} failed (${res.status}): ${text}`);
  }
  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Verify mode
// ---------------------------------------------------------------------------

async function runVerify(): Promise<boolean> {
  if (!fs.existsSync(SNAPSHOT_PATH)) {
    console.error('No snapshot file found at', SNAPSHOT_PATH);
    console.error('Run the seed script first to create a snapshot.');
    return false;
  }

  const snapshot: Snapshot = JSON.parse(fs.readFileSync(SNAPSHOT_PATH, 'utf-8'));
  console.log(`\nVerifying benchmark data against ${snapshot.api_url}...\n`);
  let passed = 0;
  let failed = 0;

  // Decisions
  const { decisions } = await apiGet<{ decisions: Array<{ decision: string; id: string; topic: string }> }>('/decisions?limit=100');
  console.log(`Decisions (expecting ${snapshot.entities.decisions.length}):`);
  for (const sd of snapshot.entities.decisions) {
    const found = decisions?.find((d) => d.decision === sd.decision);
    if (found) {
      console.log(`  ✓ ${found.id}: ${sd.topic}`);
      passed++;
    } else {
      console.log(`  ✗ MISSING: ${sd.topic}`);
      failed++;
    }
  }

  // Personas
  const { personas } = await apiGet<{ personas: Array<{ segmentName: string; id: string }> }>('/user-intelligence/personas');
  console.log(`\nPersonas (expecting ${snapshot.entities.personas.length}):`);
  for (const sp of snapshot.entities.personas) {
    const found = personas?.find((p) => p.segmentName === sp.segment_name);
    if (found) {
      console.log(`  ✓ ${sp.segment_name}`);
      passed++;
    } else {
      console.log(`  ✗ MISSING: ${sp.segment_name}`);
      failed++;
    }
  }

  // Signals
  const { signals } = await apiGet<{ signals: Array<{ theme: string; id: string }> }>('/research-signals?limit=100');
  console.log(`\nSignals (expecting ${snapshot.entities.signals.length}):`);
  for (const ss of snapshot.entities.signals) {
    const found = signals?.find((s) => s.theme === ss.theme);
    if (found) {
      console.log(`  ✓ ${ss.theme.slice(0, 60)}`);
      passed++;
    } else {
      console.log(`  ✗ MISSING: ${ss.theme.slice(0, 60)}`);
      failed++;
    }
  }

  // Competitors
  const { competitors } = await apiGet<{ competitors: Array<{ domain: string; id: string }> }>('/competitors');
  console.log(`\nCompetitors (expecting ${snapshot.entities.competitors.length}):`);
  for (const sc of snapshot.entities.competitors) {
    const found = competitors?.find((c) => c.domain === sc.domain);
    if (found) {
      console.log(`  ✓ ${sc.domain}`);
      passed++;
    } else {
      console.log(`  ✗ MISSING: ${sc.domain}`);
      failed++;
    }
  }

  const total = passed + failed;
  console.log(`\nResult: ${passed}/${total} passed${failed > 0 ? `, ${failed} missing` : ''}`);
  return failed === 0;
}

// ---------------------------------------------------------------------------
// Seed phases
// ---------------------------------------------------------------------------

async function seedDecisions(): Promise<{ counts: SeedCounts; entities: SnapshotDecision[] }> {
  console.log('\n── Decisions ──');
  const counts: SeedCounts = { created: 0, skipped: 0, failed: 0 };
  const entities: SnapshotDecision[] = [];

  // Load existing decisions for idempotency
  const { decisions: existing } = await apiGet<{ decisions: Array<{ decision: string; id: string; topic: string }> }>('/decisions?limit=100');

  for (const d of BENCHMARK_DECISIONS) {
    try {
      const found = existing?.find((e) => e.decision === d.decision);
      if (found) {
        console.log(`  - ${found.id}: ${d.topic} (exists, skipped)`);
        counts.skipped++;
        entities.push({ id: found.id, topic: d.topic, decision: d.decision });
        continue;
      }
      if (DRY_RUN) {
        console.log(`  ~ ${d.topic} (dry-run, would create)`);
        counts.skipped++;
        continue;
      }

      const result = await apiPost<{ record: { id: string; topic: string }; deduplicated: boolean }>(
        '/decisions/record',
        d
      );

      if (result.deduplicated) {
        console.log(`  - ${result.record.id}: ${d.topic} (deduplicated by API)`);
        counts.skipped++;
      } else {
        console.log(`  ✓ ${result.record.id}: ${d.topic}`);
        counts.created++;
      }
      entities.push({ id: result.record.id, topic: d.topic, decision: d.decision });
    } catch (error) {
      console.error(`  ✗ ${d.topic}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      counts.failed++;
    }
  }

  return { counts, entities };
}

async function seedPersonas(): Promise<{ counts: SeedCounts; entities: SnapshotPersona[] }> {
  console.log('\n── Personas ──');
  const counts: SeedCounts = { created: 0, skipped: 0, failed: 0 };
  const entities: SnapshotPersona[] = [];

  // Load existing personas for idempotency
  const { personas: existing } = await apiGet<{ personas: Array<{ segmentName: string; id: string }> }>('/user-intelligence/personas');

  for (const p of BENCHMARK_PERSONAS) {
    const name = p.persona.segment_name;
    try {
      const found = existing?.find((e) => e.segmentName === name);
      if (found) {
        console.log(`  - ${name} (exists, skipped)`);
        counts.skipped++;
        entities.push({ id: found.id, segment_name: name });
        continue;
      }
      if (DRY_RUN) {
        console.log(`  ~ ${name} (dry-run, would create)`);
        counts.skipped++;
        continue;
      }

      const result = await apiPost<{ persona: { id: string } }>(
        '/user-intelligence/personas',
        p
      );
      console.log(`  ✓ ${name}`);
      counts.created++;
      entities.push({ id: result.persona.id, segment_name: name });
    } catch (error) {
      console.error(`  ✗ ${name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      counts.failed++;
    }
  }

  return { counts, entities };
}

async function seedSignals(): Promise<{ counts: SeedCounts; entities: SnapshotSignal[] }> {
  console.log('\n── Customer Signals ──');
  const counts: SeedCounts = { created: 0, skipped: 0, failed: 0 };
  const entities: SnapshotSignal[] = [];

  // Load existing signals for idempotency
  const { signals: existing } = await apiGet<{ signals: Array<{ theme: string; id: string }> }>('/research-signals?limit=100');

  for (const s of BENCHMARK_SIGNALS) {
    try {
      const found = existing?.find((e) => e.theme === s.theme);
      if (found) {
        console.log(`  - ${s.theme.slice(0, 60)} (exists, skipped)`);
        counts.skipped++;
        entities.push({ id: found.id, theme: s.theme });
        continue;
      }
      if (DRY_RUN) {
        console.log(`  ~ ${s.theme.slice(0, 60)} (dry-run, would create)`);
        counts.skipped++;
        continue;
      }

      // The signals API upserts by theme — safe to call multiple times
      const result = await apiPost<{ signal_id: string }>(
        '/research-signals',
        s
      );
      console.log(`  ✓ ${s.theme.slice(0, 60)}`);
      counts.created++;
      entities.push({ id: result.signal_id, theme: s.theme });
    } catch (error) {
      console.error(`  ✗ ${s.theme.slice(0, 60)}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      counts.failed++;
    }
  }

  return { counts, entities };
}

async function seedCompetitors(): Promise<{ counts: SeedCounts; entities: SnapshotCompetitor[] }> {
  console.log('\n── Competitors ──');
  const counts: SeedCounts = { created: 0, skipped: 0, failed: 0 };
  const entities: SnapshotCompetitor[] = [];

  // Load existing competitors for idempotency
  const { competitors: existing } = await apiGet<{ competitors: Array<{ domain: string; id: string }> }>('/competitors');

  for (const c of BENCHMARK_COMPETITORS) {
    try {
      const found = existing?.find((e) => e.domain === c.domain);
      if (found) {
        console.log(`  - ${c.domain} (exists, skipped)`);
        counts.skipped++;
        entities.push({ id: found.id, domain: c.domain });
        continue;
      }
      if (DRY_RUN) {
        console.log(`  ~ ${c.domain} (dry-run, would create)`);
        counts.skipped++;
        continue;
      }

      const result = await apiPost<{ competitor: { id: string } }>(
        '/competitors',
        c
      );
      console.log(`  ✓ ${c.domain}`);
      counts.created++;
      entities.push({ id: result.competitor.id, domain: c.domain });
    } catch (error) {
      console.error(`  ✗ ${c.domain}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      counts.failed++;
    }
  }

  return { counts, entities };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  if (!API_URL || !API_KEY) {
    console.error('Usage: npx tsx benchmark/seed.ts --api-url=<url> --api-key=<key> [--verify] [--dry-run]');
    console.error('  Or set BRIEF_API_URL and BRIEF_API_KEY environment variables.');
    process.exit(1);
  }

  // Verify mode
  if (VERIFY) {
    const ok = await runVerify();
    process.exit(ok ? 0 : 1);
  }

  const mode = DRY_RUN ? ' (dry-run)' : '';
  console.log(`🌱 Seeding benchmark data to ${API_URL}${mode}...`);

  // Phase 1: Decisions
  const decisionResult = await seedDecisions();

  // Phase 2: Personas
  const personaResult = await seedPersonas();

  // Phase 3: Signals
  const signalResult = await seedSignals();

  // Phase 4: Competitors (Firecrawl will attempt enrichment on synthetic domains)
  const competitorResult = await seedCompetitors();

  // Summary
  console.log('\n── Summary ──');
  console.log(`  Decisions:   ${decisionResult.counts.created} created, ${decisionResult.counts.skipped} skipped, ${decisionResult.counts.failed} failed`);
  console.log(`  Personas:    ${personaResult.counts.created} created, ${personaResult.counts.skipped} skipped, ${personaResult.counts.failed} failed`);
  console.log(`  Signals:     ${signalResult.counts.created} created, ${signalResult.counts.skipped} skipped, ${signalResult.counts.failed} failed`);
  console.log(`  Competitors: ${competitorResult.counts.created} created, ${competitorResult.counts.skipped} skipped, ${competitorResult.counts.failed} failed`);

  // Write snapshot (skip in dry-run)
  if (!DRY_RUN) {
    const snapshot: Snapshot = {
      version: 1,
      api_url: API_URL,
      created_at: new Date().toISOString(),
      entities: {
        decisions: decisionResult.entities,
        personas: personaResult.entities,
        signals: signalResult.entities,
        competitors: competitorResult.entities,
      },
      counts: {
        decisions: decisionResult.entities.length,
        personas: personaResult.entities.length,
        signals: signalResult.entities.length,
        competitors: competitorResult.entities.length,
      },
    };

    fs.writeFileSync(SNAPSHOT_PATH, JSON.stringify(snapshot, null, 2), 'utf-8');
    console.log(`\n✅ Snapshot saved to ${path.relative(process.cwd(), SNAPSHOT_PATH)}`);
  }

  const totalFailed =
    decisionResult.counts.failed +
    personaResult.counts.failed +
    signalResult.counts.failed +
    competitorResult.counts.failed;

  if (totalFailed > 0) {
    console.error(`\n⚠️  ${totalFailed} entities failed to seed.`);
  }

  console.log('\n✅ Done!');
  process.exit(totalFailed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
