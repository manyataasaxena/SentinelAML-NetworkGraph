import { and, eq, gte, or, sql } from "drizzle-orm";
import {
  db,
  customersTable,
  transactionsTable,
  alertsTable,
  type RiskLevel,
} from "@workspace/db";
import { detectCycles } from "./graphAnalytics";

export interface TriggeredRule {
  rule: string;
  points: number;
  description: string;
}

const HIGH_VALUE_THRESHOLD = 10000;
const HIGH_FREQUENCY_THRESHOLD = 8;
const STRUCTURING_THRESHOLD = 9000;
const STRUCTURING_MIN_COUNT = 3;

function riskLevelFromScore(score: number): RiskLevel {
  if (score >= 75) return "critical";
  if (score >= 50) return "high";
  if (score >= 25) return "medium";
  return "low";
}

async function evaluateCustomer(
  customerId: string,
  cycleAccountIds: Set<string>,
): Promise<{ score: number; rules: TriggeredRule[] }> {
  const rules: TriggeredRule[] = [];
  let score = 0;

  const txns = await db
    .select()
    .from(transactionsTable)
    .where(
      or(
        eq(transactionsTable.senderId, customerId),
        eq(transactionsTable.receiverId, customerId),
      ),
    );

  const highValueTxns = txns.filter(
    (t) => Number(t.amount) >= HIGH_VALUE_THRESHOLD,
  );
  if (highValueTxns.length > 0) {
    const points = Math.min(30, highValueTxns.length * 10);
    score += points;
    rules.push({
      rule: "high_value_transaction",
      points,
      description: `${highValueTxns.length} transaction(s) at or above ₹${HIGH_VALUE_THRESHOLD.toLocaleString()}`,
    });
  }

  if (txns.length >= HIGH_FREQUENCY_THRESHOLD) {
    const points = 20;
    score += points;
    rules.push({
      rule: "high_frequency_activity",
      points,
      description: `${txns.length} transactions recorded, exceeding the ${HIGH_FREQUENCY_THRESHOLD}-transaction activity threshold`,
    });
  }

  const nearThresholdTxns = txns.filter(
    (t) =>
      Number(t.amount) >= STRUCTURING_THRESHOLD &&
      Number(t.amount) < HIGH_VALUE_THRESHOLD,
  );
  if (nearThresholdTxns.length >= STRUCTURING_MIN_COUNT) {
    const points = 25;
    score += points;
    rules.push({
      rule: "structuring_pattern",
      points,
      description: `${nearThresholdTxns.length} transactions between ₹${STRUCTURING_THRESHOLD.toLocaleString()}-₹${HIGH_VALUE_THRESHOLD.toLocaleString()}, suggesting deliberate structuring below the reporting threshold`,
    });
  }

  const outbound = txns.filter((t) => t.senderId === customerId);
  const inbound = txns.filter((t) => t.receiverId === customerId);
  const distinctCounterparties = new Set([
    ...outbound.map((t) => t.receiverId),
    ...inbound.map((t) => t.senderId),
  ]);
  if (outbound.length >= 4 && distinctCounterparties.size >= 4) {
    const points = 15;
    score += points;
    rules.push({
      rule: "fan_out_dispersal",
      points,
      description: `Funds dispersed to ${distinctCounterparties.size} distinct counterparties in ${outbound.length} outbound transactions`,
    });
  }
  if (inbound.length >= 4 && distinctCounterparties.size >= 4) {
    const points = 15;
    score += points;
    rules.push({
      rule: "fan_in_aggregation",
      points,
      description: `Funds aggregated from ${distinctCounterparties.size} distinct counterparties in ${inbound.length} inbound transactions`,
    });
  }

  if (cycleAccountIds.has(customerId)) {
    const points = 25;
    score += points;
    rules.push({
      rule: "circular_transaction_chain",
      points,
      description:
        "Account participates in a circular transaction chain (funds returning to origin)",
    });
  }

  return { score: Math.min(100, score), rules };
}

export async function recomputeAllRisk(): Promise<{
  updated: number;
  alertsCreated: number;
}> {
  const customers = await db.select().from(customersTable);
  const txns = await db.select().from(transactionsTable);
  const cycles = detectCycles(
    txns.map((t) => ({ source: t.senderId, target: t.receiverId })),
  );
  const cycleAccountIds = new Set(cycles.flat());

  let updated = 0;
  let alertsCreated = 0;

  for (const customer of customers) {
    const { score, rules } = await evaluateCustomer(
      customer.id,
      cycleAccountIds,
    );
    const level = riskLevelFromScore(score);

    if (score !== customer.riskScore || level !== customer.riskLevel) {
      await db
        .update(customersTable)
        .set({ riskScore: score, riskLevel: level })
        .where(eq(customersTable.id, customer.id));
      updated++;
    }

    if (level === "high" || level === "critical") {
      for (const rule of rules) {
        const existing = await db
          .select()
          .from(alertsTable)
          .where(
            and(
              eq(alertsTable.customerId, customer.id),
              eq(alertsTable.ruleTriggered, rule.rule),
              eq(alertsTable.resolved, false),
            ),
          )
          .limit(1);
        if (existing.length === 0) {
          await db.insert(alertsTable).values({
            customerId: customer.id,
            ruleTriggered: rule.rule,
            severity: level,
            description: rule.description,
            resolved: false,
          });
          alertsCreated++;
        }
      }
    }
  }

  return { updated, alertsCreated };
}

export async function getRiskBreakdown(customerId: string) {
  const [customer] = await db
    .select()
    .from(customersTable)
    .where(eq(customersTable.id, customerId))
    .limit(1);
  if (!customer) return null;

  const txns = await db.select().from(transactionsTable);
  const cycles = detectCycles(
    txns.map((t) => ({ source: t.senderId, target: t.receiverId })),
  );
  const cycleAccountIds = new Set(cycles.flat());
  const { rules } = await evaluateCustomer(customerId, cycleAccountIds);

  return {
    customerId,
    riskScore: customer.riskScore,
    riskLevel: customer.riskLevel,
    triggeredRules: rules,
  };
}

export { riskLevelFromScore };
