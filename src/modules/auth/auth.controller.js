import * as validators from "./auth.validation.js"
import * as authService from "./auth.service.js"
import { validation } from "../../middleware/validation.middleware.js";

import { Router } from "express"
const router=Router();
router.post('/signup',validation(validators.signup),authService.signup)

export default router