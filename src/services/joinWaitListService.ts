import CustomError from "../middlewares/customError"
import { getProspect } from "../queries/prospectQuery"
import { addProspectToTheWaitList } from "../queries/waitListQuery"
import { io } from "../server"
import { USER_NOT_FOUND } from "../utils/errorCodes"
import { JoinWaitListDto } from "../utils/types"

const joinWaitListService = async (joinWaitListData: JoinWaitListDto) => {
  console.log("TESTING --- TESTING --- JOIN WAIT LIST SERVICE --- TESTING ---")
  const formEmail = joinWaitListData.responses.email

  console.log("=== EMAIL COMPARISON ===")
  console.log("Form email:", formEmail)
  console.log("Form email type:", typeof formEmail)
  console.log("Form email length:", formEmail?.length)

  const prospect = await getProspect(formEmail)

  if (prospect) {
    console.log("Found prospect with email:", prospect.email)
    console.log("Prospect email type:", typeof prospect.email)
    console.log("Prospect email length:", prospect.email?.length)
    console.log("Emails match:", formEmail === prospect.email)

    const addedProspect = await addProspectToTheWaitList(formEmail)

    console.log("Emitting to room:", formEmail)
    io.to(formEmail).emit("joinedTheWaitList", { email: formEmail })

    return addedProspect
  }

  console.log("Emitting waitListError to:", formEmail) // Add this
  io.to(formEmail).emit("waitListError", {
    errorMessage: "Provide the email you used while registering into the app!",
  })

  throw new CustomError(
    USER_NOT_FOUND,
    "Provide the email you used for signing up on this app!",
    500,
  )
}

export { joinWaitListService }
