import bcrypt from "bcrypt";

export const generateHash = ({
  plaintext = "",
  saltRounds = process.env.SALT || 10,
} = {}) => {
  if (!plaintext || typeof plaintext !== "string") {
    throw new Error("plaintext must be a non-empty string");
  }

  const rounds = parseInt(saltRounds, 10);
  if (isNaN(rounds)) {
    throw new Error("SALT must be a number");
  }

  return bcrypt.hashSync(plaintext, rounds);
};

export const compareHash = ({ plaintext, hash } = {}) => {
  if (!plaintext || typeof plaintext !== "string") {
    throw new Error("plaintext must be a non-empty string");
  }
  if (!hash) {
    throw new Error("hash is required");
  }

  return bcrypt.compareSync(plaintext, hash);
};
