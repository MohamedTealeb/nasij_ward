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
        phone:generalFields.phone
    }).required(),

}
export const sendResetPassword={
    body:Joi.object().keys({
        email:generalFields.email.required(),
    }).required()
}

export const resetPassword={
    body:Joi.object().keys({
        email:generalFields.email.required(),
        otp:Joi.string().length(6).required(),
        newPassword:generalFields.password.required(),
    }).required()
}