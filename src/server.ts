import express, { Request, Response } from "express"
import mongoose from "mongoose"
import authRoute from "./routes/authRoute"
import cors from "cors"
import userRoute from "./routes/userRoute"
import traineeRoute from "./routes/traineeRoute"
import coachRoute from "./routes/coachRoute"
import formRoute from "./routes/formRoute"
import cohortRoutes from "./routes/cohortRoutes"
import questionRoute from "./routes/questionRoute"
import responseRoute from "./routes/responseRoute"
import overviewRoute from "./routes/overviewRoute"
import participantRoutes from "./routes/participantRoutes"
import { errorHandler } from "./middlewares/errorHandler"
import CustomError from "./middlewares/customError"
import { URL_NOT_FOUND } from "./utils/errorCodes"
import swaggerUI from "swagger-ui-express"
import YAML from "yamljs"
import { htmlDocumentationResponse } from "./utils/helpers/htmlDocumentationResponse"
import morgan from "morgan"
import { frontendUrl } from "./constants"

const swaggerDocumentation = YAML.load("./swagger.yaml")

const PORT = process.env.PORT || 3000
const mongodb_url = process.env.MONGODB_URL || ""
const app = express()

mongoose.connect(mongodb_url)
mongoose.connection.once("open", () => {
  app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`The app is running on port ${PORT}`)
  })
})

app.use(morgan("tiny"))

app.get("/", (_req: Request, res: Response) => {
  res.status(200).send(htmlDocumentationResponse)
})
app.use("/api-docs", swaggerUI.serve, swaggerUI.setup(swaggerDocumentation))

app.use(cors({ origin: frontendUrl, credentials: true }))
app.use(express.json())
app.use("/auth", authRoute)
app.use("/users", userRoute)
app.use("/trainees", traineeRoute)
app.use("/participants", participantRoutes)
app.use("/coaches", coachRoute)
app.use("/cohorts", cohortRoutes)
app.use("/forms", formRoute)
app.use("/questions", questionRoute)
app.use("/responses", responseRoute)
app.use("/overview", overviewRoute)

app.all("*", (req, _res, next) => {
  const err = new CustomError(
    URL_NOT_FOUND,
    `Can't find ${req.originalUrl} on the server`,
    404,
  )
  next(err)
})

app.use(errorHandler)
