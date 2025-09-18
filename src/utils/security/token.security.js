import jwt from "jsonwebtoken";
import { UserModel } from "../../config/models/user.model.js";
import { nanoid } from "nanoid";

export const signatureLevelEnum = {
  Bearer: "Bearer",
  System: "System",
};

export const tokenTypeEnum = {
  Access: "access",
  Refresh: "refresh",
};

export const generateToken = ({
  payload,
  signature = process.env.ACCESS_USER_TOKEN_SIGNATURE,
  options = { expiresIn: Number(process.env.ACCESS_TOKEN_EXPIRES_IN) },
}) => {
  return jwt.sign(payload, signature, options);
};

export const verifyToken = ({
  token = "",
  signature = process.env.ACCESS_USER_TOKEN_SIGNATURE,
}) => {
  if (!token || typeof token !== "string" || token.split(".").length !== 3) {
    throw new Error("JWT malformed: invalid format or empty token");
  }
  return jwt.verify(token, signature);
};

export const getSignatures = async ({
  signatureLevel = signatureLevelEnum.Bearer,
} = {}) => {
  let signatures = {
    accessSignature: undefined,
    refreshSignature: undefined,
  };

  switch (signatureLevel) {
    case signatureLevelEnum.System:
      signatures.accessSignature = process.env.ACCESS_SYSTEM_TOKEN_SIGNATURE;
      signatures.refreshSignature = process.env.REFRESH_SYSTEM_TOKEN_SIGNATURE;
      break;
    default:
      signatures.accessSignature = process.env.ACCESS_USER_TOKEN_SIGNATURE;
      signatures.refreshSignature = process.env.REFRESH_USER_TOKEN_SIGNATURE;
  }
  return signatures;
};

export const decodedToken = async ({
  authorization,
  tokenType = tokenTypeEnum.Access,
} = {}) => {
  const [bearer, token] = authorization?.split(" ") || [];
  console.log({ bearer, token });

  if (!bearer || !token) {
    throw new Error("missing token");
  }

  const normalizedSignatureLevel =
    bearer === "System" ? signatureLevelEnum.System : signatureLevelEnum.Bearer;

  let signatures = await getSignatures({
    signatureLevel: normalizedSignatureLevel,
  });

  const decoded = await verifyToken({
    token,
    signature:
      tokenType === tokenTypeEnum.Access
        ? signatures.accessSignature
        : signatures.refreshSignature,
  });

  if (!decoded?._id) {
    throw new Error("Invalid token");
  }

  const user = await UserModel.findById(decoded._id);
  if (!user) {
    throw new Error("not register acc", { cause: 404 });
  }

  // ✅ check if credentials changed after token issued
  if (
    tokenType === tokenTypeEnum.Access &&
    user.changeLoginCredentials &&
    decoded.iat * 1000 < new Date(user.changeLoginCredentials).getTime()
  ) {
    throw new Error("old login credentials", { cause: 401 });
  }

  return { user, decoded };
};

export const generateLogin = async ({ user }) => {
  let signatures = await getSignatures({
    signatureLevel:
      user.role !== "user" ? signatureLevelEnum.System : signatureLevelEnum.Bearer,
  });

  const idToken = nanoid();

  const access_token = await generateToken({
    payload: { _id: user._id },
    signature: signatures.accessSignature,
    options: {
      jwtid: idToken,
      expiresIn: Number(process.env.ACCESS_TOKEN_EXPIRES_IN),
    },
  });

  const refresh_token = await generateToken({
    payload: { _id: user._id },
    signature: signatures.refreshSignature,
    options: {
      expiresIn: Number(process.env.REFRESH_TOKEN_EXPIRES_IN),
    },
  });

  return { access_token, refresh_token };
};
