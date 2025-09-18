import { UserModel } from "../../config/models/user.model.js";
import { asyncHandler, successResponse } from "../../utils/response.js";
import { generateEncryption } from "../../utils/security/encryption.security.js";
import { compareHash, generateHash } from "../../utils/security/hash.security.js";
import { generateLogin } from '../../utils/security/token.security.js'
export const signup = asyncHandler(async (req, res, next) => {
  const { firstName, lastName, email, password, phone } = req.body
  if (await UserModel.findOne({ email })) {
    return res.status(400).json({ message: "User already exists" });
  }
  const hashedPassword = await generateHash({ plaintext: password })
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
  const match = await compareHash({ plaintext: password, hash: user.password });
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
