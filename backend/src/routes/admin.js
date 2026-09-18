import express from "express"; 
import adminController from "../controller/admin.js";

const router = express.Router();

router.get("/activity", adminController.getActivity);
router.get("/logs", adminController.getLogs);

export default router;