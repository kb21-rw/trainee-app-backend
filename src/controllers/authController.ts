import { NextFunction, Request, Response } from "express"
import {
  registerSchema,
  loginSchema,
  resetPasswordSchema,
  applicantRegisterSchema,
} from "../validations/authValidation"
import {
  applicantRegisterService,
  googleAuthService,
  loginService,
  registerService,
  resetPasswordService,
  verifyApplicantService,
} from "../services/authService"

export const register = async (req: any, res: Response, next: NextFunction) => {
  try {
    const user = req.user
    const body = req.body
    await registerSchema.validateAsync(body)
    const newUser = await registerService(user, body)
    return res.status(201).send(newUser)
  } catch (error: unknown) {
    return next(error)
  }
}

export const applicantRegister = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const body = req.body
    await applicantRegisterSchema.validateAsync(body)
    const newUser = await applicantRegisterService(body)
    return res.status(201).send({ userId: newUser._id })
  } catch (error: unknown) {
    return next(error)
  }
}

export const verifyApplicant = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const verifiedUser = await verifyApplicantService(String(req.query.userId))
    return res
      .status(201)
      .send({ userId: verifiedUser._id, verified: verifiedUser.verified })
  } catch (error: unknown) {
    return next(error)
  }
}

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    await loginSchema.validateAsync(req.body)
    const accessToken = await loginService(req.body)
    return res
      .status(200)
      .cookie("access_token", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
      })
      .json({ accessToken })
  } catch (error) {
    return next(error)
  }
}

export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const body = req.body
    await resetPasswordSchema.validateAsync(body)
    const userId = await resetPasswordService(req.body)
    return res.status(200).json({ userId })
  } catch (error: unknown) {
    return next(error)
  }
}

export const googleAuthController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { token } = req.body

  try {
    const accessToken = await googleAuthService(token)
    return res
      .status(200)
      .cookie("access_token", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
      })
      .json({ accessToken })
  } catch (error) {
    return next(error)
  }
}
