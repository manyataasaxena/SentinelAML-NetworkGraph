import { Router, type IRouter } from "express";
import { GetRiskBreakdownParams } from "@workspace/api-zod";
import { requireAuth } from "../middleware/requireAuth";
import { recomputeAllRisk, getRiskBreakdown } from "../lib/riskEngine";
import { logAudit } from "../lib/audit";

const router: IRouter = Router();
router.use(requireAuth);

router.post("/risk/recompute", async (req, res) => {
  const result = await recomputeAllRisk();
  await logAudit(req.session!.sub, "recompute_risk", "system", "all");
  res.json(result);
});

router.get("/risk/:customerId", async (req, res) => {
  const parsed = GetRiskBreakdownParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const breakdown = await getRiskBreakdown(parsed.data.customerId);
  if (!breakdown) {
    res.status(404).json({ error: "Customer not found" });
    return;
  }
  res.json(breakdown);
});

export default router;
