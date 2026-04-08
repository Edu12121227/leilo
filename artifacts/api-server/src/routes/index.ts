import { Router, type IRouter } from "express";
import healthRouter from "./health";
import pixRouter from "./pix";
import cpfRouter from "./cpf";

const router: IRouter = Router();

router.use(healthRouter);
router.use(pixRouter);
router.use(cpfRouter);

export default router;
