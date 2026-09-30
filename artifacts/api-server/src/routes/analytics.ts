import { Router, type IRouter } from "express";
import { db, customersTable, transactionsTable } from "@workspace/db";
import { GetShortestPathQueryParams, GetMostConnectedQueryParams } from "@workspace/api-zod";
import { requireAuth } from "../middleware/requireAuth";
import {
  degreeCentrality,
  connectedComponents,
  detectCycles,
  shortestPath,
} from "../lib/graphAnalytics";

const router: IRouter = Router();
router.use(requireAuth);

async function loadGraph() {
  const customers = await db.select().from(customersTable);
  const txns = await db.select().from(transactionsTable);
  const edges = txns.map((t) => ({ source: t.senderId, target: t.receiverId }));
  const byId = new Map(customers.map((c) => [c.id, c]));
  return { customers, edges, byId };
}

router.get("/analytics/centrality", async (_req, res) => {
  const { customers, edges, byId } = await loadGraph();
  const degrees = degreeCentrality(customers.map((c) => c.id), edges);
  const result = customers
    .map((c) => ({
      accountId: c.id,
      accountNo: c.accountNo,
      customerName: c.fullName,
      degree: degrees.get(c.id) ?? 0,
      riskLevel: c.riskLevel,
    }))
    .sort((a, b) => b.degree - a.degree);
  res.json(result);
});

router.get("/analytics/components", async (_req, res) => {
  const { customers, edges, byId } = await loadGraph();
  const components = connectedComponents(customers.map((c) => c.id), edges);
  const result = components
    .filter((c) => c.length > 1)
    .map((c, index) => ({
      componentId: index,
      size: c.length,
      accountNos: c.map((id) => byId.get(id)?.accountNo ?? id),
    }))
    .sort((a, b) => b.size - a.size);
  res.json(result);
});

router.get("/analytics/cycles", async (_req, res) => {
  const { edges, byId } = await loadGraph();
  const cycles = detectCycles(edges);
  res.json(
    cycles.map((cycle) => ({
      accountNos: cycle.map((id) => byId.get(id)?.accountNo ?? id),
      length: cycle.length,
    })),
  );
});

router.get("/analytics/shortest-path", async (req, res) => {
  const parsed = GetShortestPathQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { customers, edges, byId } = await loadGraph();
  const byAccountNo = new Map(customers.map((c) => [c.accountNo, c.id]));
  const fromId = byAccountNo.get(parsed.data.from) ?? parsed.data.from;
  const toId = byAccountNo.get(parsed.data.to) ?? parsed.data.to;
  const result = shortestPath(fromId, toId, edges);
  res.json({
    found: result.found,
    path: result.path.map((id) => byId.get(id)?.accountNo ?? id),
    length: result.length,
  });
});

router.get("/analytics/most-connected", async (req, res) => {
  const parsed = GetMostConnectedQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { customers, edges } = await loadGraph();
  const degrees = degreeCentrality(customers.map((c) => c.id), edges);
  const result = customers
    .map((c) => ({
      accountId: c.id,
      accountNo: c.accountNo,
      customerName: c.fullName,
      degree: degrees.get(c.id) ?? 0,
      riskLevel: c.riskLevel,
    }))
    .sort((a, b) => b.degree - a.degree)
    .slice(0, parsed.data.limit);
  res.json(result);
});

export default router;
