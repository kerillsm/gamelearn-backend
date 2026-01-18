import { appConfig } from "../../../config/appConfig";
import jwt from "jsonwebtoken";

export const generateToken = ({
  email,
  id,
  role,
  expiresInMinutes = 15,
  tokenType,
}: {
  email: string;
  id: string;
  role: string;
  expiresInMinutes?: number;
  tokenType: "accessToken" | "refreshToken";
}) => {
  const secret =
    tokenType === "refreshToken"
      ? appConfig.auth.refreshTokenSecret
      : appConfig.auth.jwtSecret;

  return {
    token: jwt.sign({ email, id, role }, secret, {
      expiresIn: `${expiresInMinutes}m`,
    }),
    expiresAt: Date.now() + expiresInMinutes * 60 * 1000,
  };
};
