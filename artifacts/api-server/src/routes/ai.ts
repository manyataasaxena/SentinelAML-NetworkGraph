import { Router, type IRouter } from "express";
import { requireAuth } from "../middleware/requireAuth";

const router: IRouter = Router();
router.use(requireAuth);

router.post("/ai/assistant", (_req, res) => {
  res.status(501).json({
    error:
      "The AI investigation assistant is not yet enabled for this deployment.",
  });
});

export default router;
