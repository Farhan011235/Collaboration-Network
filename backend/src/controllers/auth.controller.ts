import { Request, Response } from "express";
import * as userModel from "../models/user.model";
import { hashPassword, comparePassword } from "../utils/hash";
import { signToken } from "../utils/jwt";
import { sendSuccess } from "../utils/apiResponse";
import { ApiError } from "../utils/apiError";
import { asyncHandler } from "../utils/asyncHandler";
import { RegisterInput, LoginInput } from "../validators/auth.validator";

// CONTROLLER LAYER
// Reads the request, calls the model, sends the response.
// It never imports prisma directly.

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { fullName, email, password, institution, designation } =
    req.body as RegisterInput;

  if (await userModel.emailExists(email)) {
    throw ApiError.conflict("An account with this email already exists");
  }

  const passwordHash = await hashPassword(password);

  const user = await userModel.createUser({
    fullName,
    email,
    passwordHash,
    institution: institution || undefined,
    designation: designation || undefined,
  });

  const token = signToken({ userId: user.userId, email: user.email });

  return sendSuccess(res, { user, token }, "Account created", 201);
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body as LoginInput;

  const user = await userModel.findByEmail(email);

  // Same message for both cases so we don't reveal which emails exist.
  if (!user || !(await comparePassword(password, user.passwordHash))) {
    throw ApiError.unauthorized("Email or password is incorrect");
  }

  const token = signToken({ userId: user.userId, email: user.email });

  const { passwordHash, ...safeUser } = user;

  return sendSuccess(res, { user: safeUser, token }, "Signed in");
});

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const user = await userModel.findById(req.user!.userId);

  if (!user) {
    throw ApiError.notFound("Account not found");
  }

  return sendSuccess(res, { user });
});
