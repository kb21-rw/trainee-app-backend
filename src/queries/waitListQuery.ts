import User from "../models/User"
import { Role, UserStatus } from "../utils/types"

export async function addProspectToTheWaitList(email: string) {
  const query = { email, role: Role.Prospect }
  const addedProspect = await User.findOneAndUpdate(
    query,
    {
      status: UserStatus.ON_WAIT_LIST,
    },
    { new: true },
  )
  return addedProspect
}

export async function removeProspectFromTheWaitList(email: string) {
  const query = { email, role: Role.Prospect }
  const removedProspect = await User.findOneAndUpdate(
    query,
    {
      isOnWaitList: false,
    },
    { new: true },
  )
  return removedProspect
}
