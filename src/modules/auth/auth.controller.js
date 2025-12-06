import * as validators from "./auth.validation.js"
import * as authService from "./auth.service.js"
import { validation } from "../../middleware/validation.middleware.js";
import { Router } from "express"
const router=Router();
router.post('/signup',validation(validators.signup),authService.signup)
router.post('/login',validation(validators.login),authService.login)
router.patch('/send-reset-password',validation(validators.sendResetPassword),authService.sendResetPassword)
router.patch('/reset-password',validation(validators.resetPassword),authService.resetPassword)

export default router