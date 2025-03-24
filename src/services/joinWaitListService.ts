import CustomError from "../middlewares/customError"
import { getProspect } from "../queries/prospectQuery"
import { addProspectToTheWaitList } from "../queries/waitListQuery"
import { io, room } from "../server"
import { USER_NOT_FOUND } from "../utils/errorCodes"
import { JoinWaitListDto } from "../utils/types"

const joinWaitListService = async (joinWaitListData: JoinWaitListDto) => {
  const joinRoom = room[0]
  const email = joinWaitListData.responses.email

  const prospect = await getProspect(email)

  if (prospect && !prospect.isOnWaitList) {
    const addedProspect = await addProspectToTheWaitList(email)

    io.to(joinRoom).emit("joinedTheWaitList", { email })

    return addedProspect
  } else {
    io.to(joinRoom).emit("waitListError", {
      errorMessage:
        "Provide the email you used while registering into the app!",
    })

    throw new CustomError(
      USER_NOT_FOUND,
      "Provide the email you used for signing up on this app!",
      500,
    )
  }
}

export { joinWaitListService }
