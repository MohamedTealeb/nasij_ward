import { UserModel } from "../../config/models/user.model.js";
import { asyncHandler, successResponse } from "../../utils/response.js";
import { generateEncryption } from "../../utils/security/encryption.security.js";
import { compareHash, generateHash } from "../../utils/security/hash.security.js";
import { generateLogin } from '../../utils/security/token.security.js'
import { generateNumberOtp } from "../../utils/otp.js";
import { sendResetEmail } from "../../utils/email/email.js";
export const signup = asyncHandler(async (req, res, next) => {
  const { firstName, lastName, email, password, phone } = req.body
  if (await UserModel.findOne({ email })) {
    return res.status(400).json({ message: "User already exists" });
  }
  const hashedPassword = generateHash({ plaintext: password })
  const encphone = await generateEncryption({ plaintext: phone })
  const NewUser = await UserModel.create({
    firstName,
    lastName,
    email,
    password: hashedPassword,
    phone: encphone
  })
  return successResponse({
    res,
    message: "User created successfully",
    data: { NewUser }
  });
})
export const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;
  const user = await UserModel.findOne({ email }).select('+password');
  if (!user) {
    return next(new Error("user not found", { cause: 404 }));
  }
  const match = compareHash({ plaintext: password, hash: user.password });
  if (!match) {
    return next(new Error("invalid login data", { cause: 401 }));
  }
  const credentials = await generateLogin({ user });
  const cleanUser = await UserModel.findById(user._id).select('-password -phone -__v');
  return successResponse({
    res,
    message: "Login successful",
    data: { user: cleanUser, credentials },
  });
});
export const sendResetPassword = asyncHandler(async (req, res, next) => {
  const { email } = req.body;
  const user = await UserModel.findOne({ email });
  if (!user) {
    return next(new Error("user not found", { cause: 404 }));
  }
    const otp = generateNumberOtp();
  const resetPasswordExpires = new Date(Date.now() + 10 * 60 * 1000); 
  user.resetPasswordToken = otp;
  user.resetPasswordExpires = resetPasswordExpires;
  await user.save();
    try {
    await sendResetEmail({ 
      to: email, 
      resetUrl: `Your reset code is: ${otp}` 
    });
  } catch (emailError) {
    console.error('Failed to send reset email:', emailError);
    return next(new Error("Failed to send reset email", { cause: 500 }));
  }
  
  return successResponse({
    res,
    message: "Reset code sent successfully to your email",
   
  });
});

export const resetPassword = asyncHandler(async (req, res, next) => {
  const { email, otp, newPassword } = req.body;
  const user = await UserModel.findOne({
    email,
    resetPasswordToken: otp,
    resetPasswordExpires: { $gt: Date.now() }
  });
  
  if (!user) {
    return next(new Error("Invalid or expired reset code", { cause: 400 }));
  }
  const hashedPassword = generateHash({ plaintext: newPassword });
  
  user.password = hashedPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();
  
  return successResponse({
    res,
    message: "Password reset successfully",
  });
});
