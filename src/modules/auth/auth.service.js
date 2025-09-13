import { UserModel } from "../../config/models/user.model.js";
import { asyncHandler, successResponse } from "../../utils/response.js";
import { generateEncryption } from "../../utils/security/encryption.security.js";
import { generateHash } from "../../utils/security/hash.security.js";




export const signup=asyncHandler(async(req,res,next)=>{

    const {firstName, lastName,email,password,phone}=req.body
    if(await UserModel.findOne({email})){
  return res.status(400).json({ message: "User already exists" });
    }

     const hashedPassword=await generateHash({plaintext:password})
        const encphone= await generateEncryption({plaintext:phone})
    const NewUser=await UserModel.create({
        firstName,
        lastName,
        email,
        password:hashedPassword,
        phone:encphone
    })  
    return successResponse({
  res,
  message: "User created successfully",
  data: { NewUser }
});

    


})