import CustomError from "../middlewares/customError"
import { getProspect } from "../queries/prospectQuery"
import { addProspectToTheWaitList } from "../queries/waitListQuery"
import { io } from "../server"
import { USER_NOT_FOUND } from "../utils/errorCodes"
import { JoinWaitListDto } from "../utils/types"

const joinWaitListService = async (joinWaitListData: JoinWaitListDto) => {
  const email = joinWaitListData.responses.email
  const prospect = await getProspect(email)

  if (prospect) {
    const addedProspect = await addProspectToTheWaitList(email)

    io.to(email).emit("join", { email })

    return addedProspect
  }

  throw new CustomError(
    USER_NOT_FOUND,
    "Provide the email you used for signing up on this app!",
    500,
  )
}

export { joinWaitListService }
