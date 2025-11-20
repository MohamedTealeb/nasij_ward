
import { Router } from "express";
import * as reviewService from "./review.service.js";

const router=Router();

router.post("/",reviewService.createReview)
router.get("/",reviewService.getReviews)


export default router;