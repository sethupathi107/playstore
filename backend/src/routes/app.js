import express from "express";
import appController from "../controller/app.js";
import appValidators from "../utils/validators/app.js";
import validateRequest from "../utils/validateRequest.js";
import upload from "../middlewares/upload.js";

const router = express.Router();

router.get("/", appController.getAllApps);
router.get("/download",appValidators.downloadAppValidator,validateRequest,appController.downloadApp)
router.get("/", appValidators.appIdBodyValidator, validateRequest, appController.getAppById);
router.post("/", upload.single("appFile"), appValidators.createAppValidator, validateRequest, appController.createApp);
router.put("/", upload.single("appFile"), appValidators.updateAppValidator, validateRequest, appController.updateApp);
router.delete("/", appValidators.appIdBodyValidator, validateRequest, appController.deleteApp);

export default router;
