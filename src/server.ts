/* eslint-disable no-console */
import ngrok from "@ngrok/ngrok"
import cors from "cors"
import express, { Request, Response } from "express"
import http from "http"
import mongoose from "mongoose"
import morgan from "morgan"
import { Server } from "socket.io"
import swaggerUI from "swagger-ui-express"
import YAML from "yamljs"
import CustomError from "./middlewares/customError"
import { errorHandler } from "./middlewares/errorHandler"
import newAuthRoute from "./routes/newAuthRoute"
import authRoute from "./routes/authRoute"
import coachRoute from "./routes/coachRoute"
import cohortRoutes from "./routes/cohortRoutes"
import formRoute from "./routes/formRoute"
import joinWaitListRoute from "./routes/joinWaitListRoute"
import overviewRoute from "./routes/overviewRoute"
import participantRoutes from "./routes/participantRoutes"
import questionRoute from "./routes/questionRoute"
import responseRoute from "./routes/responseRoute"
import traineeRoute from "./routes/traineeRoute"
import newUserRoute from "./routes/newUserRoute"
import userRoute from "./routes/userRoute"
import { URL_NOT_FOUND } from "./utils/errorCodes"
import { htmlDocumentationResponse } from "./utils/helpers/htmlDocumentationResponse"

const swaggerDocumentation = YAML.load("./swagger.yaml")

const PORT = process.env.PORT || 3000
const mongodb_url = process.env.MONGODB_URL || ""
const app = express()
const server = http.createServer(app)

export const room: string[] = []

export const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL,
    credentials: true,
  },
})

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id)

  socket.on("join-room", (email) => {
    console.log("Received: " + email)
    room.push(email)
    socket.join(email)
  })

  socket.on("disconnect", () => {
    room.pop()
    console.log("Client disconnected:", socket.id)
  })
})

mongoose.connect(mongodb_url)

mongoose.connection.once("open", () => {
  server.listen(PORT, () => {
    console.log(`The app is running on port ${PORT}`)

    if (process.env.NODE_ENV === "development") {
      ngrok
        .connect({
          addr: PORT,
          authtoken: process.env.NGROK_TOKEN,
        })
        .then((listener) =>
          console.log(`Ingress established at: ${listener.url()}`),
        )
    }
  })
})

app.use(morgan("tiny"))

app.get("/", (_req: Request, res: Response) => {
  res.status(200).send(htmlDocumentationResponse)
})
app.use("/api-docs", swaggerUI.serve, swaggerUI.setup(swaggerDocumentation))

app.use(cors({ origin: "*", credentials: true }))
app.use(express.json())
app.use("/new-auth", newAuthRoute)
app.use("/auth", authRoute)
app.use("/users", userRoute)
app.use("/new-users", newUserRoute)
app.use("/trainees", traineeRoute)
app.use("/participants", participantRoutes)
app.use("/coaches", coachRoute)
app.use("/cohorts", cohortRoutes)
app.use("/forms", formRoute)
app.use("/questions", questionRoute)
app.use("/responses", responseRoute)
app.use("/overview", overviewRoute)
app.use("/join-wait-list", joinWaitListRoute)

app.all("*", (req, _res, next) => {
  const err = new CustomError(
    URL_NOT_FOUND,
    `Can't find ${req.originalUrl} on the server`,
    404,
  )
  next(err)
})

app.use(errorHandler)
