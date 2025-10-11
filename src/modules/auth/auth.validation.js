import Joi from "joi";
import { generalFields } from "../../middleware/validation.middleware.js";
export const login={
    body:Joi.object().keys({
        email:generalFields.email.required(),
        password:generalFields.password.required(),  
    }).required()
}
export const signup={
    body:Joi.object().keys({
        email:generalFields.email.required(),
        password:generalFields.password.required(),
     firstName:generalFields.firstName.required(),
     lastName:generalFields.lastName.required(),
        // confirmPassword:generalFields.confirmPassword.required(),
        phone:generalFields.phone
    }).required(),

}
export const sendResetPassword={
    body:Joi.object().keys({
        email:generalFields.email.required(),
    }).required()
}