import express from "express";
import imageController from "../controller/image.js";
import imageValidators from "../utils/validators/image.js";
import validateRequest from "../utils/validateRequest.js";
import uploadImage from "../middlewares/uploadImage.js";

const router = express.Router();

router.get("/", imageValidators.appIdBodyValidator, validateRequest, imageController.getAppImages);
router.post("/", uploadImage.single("image"), imageValidators.appIdBodyValidator, validateRequest, imageController.addAppImage);
router.delete("/", imageValidators.deleteAppImageValidator, validateRequest, imageController.deleteAppImage);
router.get("/appImage", imageValidators.getImageFileValidator, validateRequest, imageController.getImageFile);

export default router;
