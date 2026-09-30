import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import customersRouter from "./customers";
import transactionsRouter from "./transactions";
import graphRouter from "./graph";
import analyticsRouter from "./analytics";
import riskRouter from "./risk";
import dashboardRouter from "./dashboard";
import alertsRouter from "./alerts";
import auditLogsRouter from "./auditLogs";
import searchRouter from "./search";
import notificationsRouter from "./notifications";
import reportsRouter from "./reports";
import aiRouter from "./ai";
import intelligenceRouter from "./intelligence";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(customersRouter);
router.use(transactionsRouter);
router.use(graphRouter);
router.use(analyticsRouter);
router.use(riskRouter);
router.use(dashboardRouter);
router.use(alertsRouter);
router.use(auditLogsRouter);
router.use(searchRouter);
router.use(notificationsRouter);
router.use(reportsRouter);
router.use(aiRouter);
router.use(intelligenceRouter);

export default router;
