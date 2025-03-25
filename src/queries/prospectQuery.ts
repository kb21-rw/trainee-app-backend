import User from "../models/User"

export async function getProspect(email: string) {
  const prospect = await User.findOne({ email: email })
  return prospect
}
