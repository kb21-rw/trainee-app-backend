import { compare, hash } from "bcryptjs"
import CustomError from "../middlewares/customError"
import {
  DUPLICATE_USER,
  INVALID_CREDENTIAL,
  NOT_ALLOWED,
  USER_NOT_FOUND,
} from "../utils/errorCodes"
import { sendEmail } from "../utils/helpers/email"
import { generateRandomPassword } from "../utils/helpers/password"
import User, { IUser } from "../models/User"
import { ACCESS_TOKEN_EXPIRATION, secret } from "../constants"
import jwt from "jsonwebtoken"
import { RegisterUserDto, Role } from "../utils/types"
import { generateUserIdService, getUserService } from "./userService"
import { OAuth2Client } from "google-auth-library"
import { googleClientId } from "../constants"

const client = new OAuth2Client(googleClientId)

export const registerService = async (
  loggedInUser: IUser,
  body: RegisterUserDto,
) => {
  if (loggedInUser.role !== Role.Admin) {
    throw new CustomError(NOT_ALLOWED, "Only admins can register users", 403)
  }

  if (await User.findOne({ email: body.email })) {
    throw new CustomError(DUPLICATE_USER, "Email is already in use", 409)
  }

  const name = body.name.trim().replace(/\s+/g, " ") // Remove unnecessary extra spaces in names
  const password: string = generateRandomPassword(10)
  const hashedPassword = await hash(password, 10)

  const createdUser = await User.create({
    ...body,
    userId: await generateUserIdService(),
    name,
    password: hashedPassword,
    verified: true,
  })

  await sendEmail(createdUser.email, {
    name: createdUser.name,
    email: createdUser.email,
    role: createdUser.role,
    password,
  })

  return createdUser
}

export const applicantRegisterService = async (body: any) => {
  if (await User.findOne({ email: body.email })) {
    throw new CustomError(DUPLICATE_USER, "User already exists", 409)
  }

  const name = body.name.trim().replace(/\s+/g, " ") // Remove unnecessary extra spaces in names
  const hashedPassword = await hash(body.password, 10)

  const createdUser = await User.create({
    ...body,
    name,
    userId: await generateUserIdService(),
    password: hashedPassword,
  })

  await sendEmail(createdUser.email, {
    name: createdUser.name,
    userId: createdUser.id,
  })

  return createdUser
}

export const verifyApplicantService = async (userId: string) => {
  const user = await User.findByIdAndUpdate(
    userId,
    { verified: true },
    { new: true },
  )
  if (!user) throw new CustomError(USER_NOT_FOUND, "User not found!", 404)
  return user
}

export const loginService = async (body: any) => {
  const { email, password } = body
  const user: any = await User.findOne({ email })
  if (!user) {
    throw new CustomError(USER_NOT_FOUND, "User not found", 404)
  }

  if (!user.verified) {
    throw new CustomError(
      NOT_ALLOWED,
      "Please verify your email before logging in ",
      401,
    )
  }

  if (user.role === Role.Trainee) {
    throw new CustomError(
      NOT_ALLOWED,
      "Trainees are not allowed to login yet",
      409,
    )
  }

  const match = await compare(password, user.password)
  if (!match) {
    throw new CustomError(INVALID_CREDENTIAL, "Invalid credential", 401)
  }

  const accessToken = jwt.sign({ id: user._id }, secret, {
    expiresIn: ACCESS_TOKEN_EXPIRATION,
  })
  return accessToken
}

export const resetPasswordService = async (body: any) => {
  const { email } = body
  const user = await getUserService({ email })

  const password = generateRandomPassword(10)
  const hashedPassword = await hash(password, 10)
  user.password = hashedPassword
  await user.save()
  await sendEmail(user.email, { name: user.name, password })
  return user._id
}

export const googleAuthService = async (token: string) => {
  const ticket = await client.verifyIdToken({
    idToken: token,
    audience: googleClientId,
  })
  const payload = ticket.getPayload()

  const user = await User.findOne<IUser>({ email: payload?.email })

  if (user) {
    if (user.role === Role.Trainee) {
      throw new CustomError(
        NOT_ALLOWED,
        "Trainees are not allowed to login yet",
        409,
      )
    }

    const accessToken = jwt.sign({ id: user._id }, secret, {
      expiresIn: ACCESS_TOKEN_EXPIRATION,
    })
    return accessToken
  }

  const createdUser = await User.create({
    userId: await generateUserIdService(),
    name: payload?.name ?? "",
    email: payload?.email ?? "",
    verified: true,
    googleId: payload?.sub ?? "",
    role: Role.Prospect,
  })

  const accessToken = jwt.sign({ id: createdUser._id }, secret, {
    expiresIn: ACCESS_TOKEN_EXPIRATION,
  })

  return accessToken
}
