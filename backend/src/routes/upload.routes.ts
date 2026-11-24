import { Router } from "express";
import { UploadController } from "../controllers/upload.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { upload } from "../middleware/upload.middleware.js";

const router = Router();

router.post("/single", authenticate, upload.single("image"), UploadController.uploadSingle);
router.post("/multiple", authenticate, upload.array("images", 5), UploadController.uploadMultiple);

export default router;
