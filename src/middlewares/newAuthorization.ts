import { NextFunction, Response } from "express"
import { NewRole } from "../utils/types"

export const isAdmin = (req: any, res: Response, next: () => void) => {
  const { role } = req.user
  if (role !== NewRole.Admin) {
    return res.status(401).json({ message: "Only admins are allowed " })
  }

  return next()
}

export const isCoach = (req: any, res: Response, next: () => void) => {
  const { role } = req.user
  if (role !== NewRole.Coach) {
    return res.status(401).json({ message: "Only coaches are allowed " })
  }

  return next()
}

export const isAdminOrCoach = (req: any, res: Response, next: () => void) => {
  const { role } = req.user
  if (role !== NewRole.Admin && role !== NewRole.Coach) {
    return res
      .status(401)
      .json({ message: "Only coaches and admins are allowed" })
  }

  return next()
}

export const isApplicant = (req: any, res: Response, next: () => void) => {
  const { role } = req.user
  if (role !== NewRole.Trainee) {
    return res.status(401).json({ message: "Only applicants are allowed" })
  }

  return next()
}

export const isProspect = (req: any, res: Response, next: () => void) => {
  const { role } = req.user
  if (role !== NewRole.Trainee) {
    return res.status(401).json({ message: "Only prospects are allowed" })
  }

  return next()
}

export const isAuthorized = (roles: NewRole[]) => {
  return (req: any, res: Response, next: NextFunction) => {
    const { role } = req.user
    if (!roles.includes(role)) {
      const pluralizedRoles = roles.map(
        (role) => `${role.toLocaleLowerCase()}s`,
      )
      return res
        .status(401)
        .json({ message: `Only ${pluralizedRoles.join(",")} are allowed` })
    }

    return next()
  }
}
