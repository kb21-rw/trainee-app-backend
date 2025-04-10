import User from "../models/User"

export async function getProspect(email: string) {
  return await User.findOne({ email: email })
}
