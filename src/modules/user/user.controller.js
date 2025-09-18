import { authMiddleware } from '../../middleware/authentication.middleware.js';
import * as userService from'./user.service.js'
import { Router } from "express"
const router=Router();

router.get('/all-users',userService.AllUsers)
router.get('/profile',authMiddleware,userService.profile)
router.delete('/delete/:id',authMiddleware,userService.deleteUser)
export default router