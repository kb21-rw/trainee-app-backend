import { Request, Response } from "express";
import {
  registerSchema,
  loginSchema,
  coachAssignSchema
} from "../validations/authValidation";
import User from "../models/User";
import {
  generateRandomPassword,
  sendEmail,
  generateMessage,
} from "../utils/helpers";
import { hash, compare } from "bcryptjs";
import dotenv from "dotenv"
import jwt from "jsonwebtoken"

dotenv.config()

const secret = process.env.ACCESS_TOKEN_KEY ||""
const ACCESS_TOKEN_EXPIRATION = 5*60*1000    // 5 minutes

export const register = async (req: any, res: Response) => {
  let newUser;
  try {
    const {role} = req.user
    if(role !== "ADMIN"){
      return res.status(400).send("Only admins can register users")
    }
    const result = await registerSchema.validateAsync(req.body);
    let password: string = "";
    if (result.role === "COACH" || result.role === "ADMIN") {
      password = generateRandomPassword(10);
      const hashedPassword = await hash(password, 10);
      newUser = { ...result, password: hashedPassword };
    } else {
      newUser = { ...result };
    }
    const createdUser: any = await User.create(newUser);
    sendEmail(
      createdUser.name,
      createdUser.email,
      "Welcome " + createdUser.name,
      generateMessage(
        createdUser.name,
        createdUser.email,
        createdUser.role,
        password
      )
    ).catch((error) => console.error(error));
    return res.status(201).send({ ...result, password });
  } catch (error) {
    return res.status(400).send(error);
  }
};
export const login = async (req: Request, res: Response) => {
  try {
    const result = await loginSchema.validateAsync(req.body);
    const user: any = await User.findOne({ email: result.email });
    if(!user){
      return res.status(403).send("User not found");
    }
    if (user.role === "TRAINEE") {
      return res.status(403).send("Trainees are not allowed to login");
    }
    const match = await compare(result.password, user.password);
    if (!match) {
      return res.status(403).send("Invalid credential");
    }
    const accessToken = jwt.sign({ id:user._id,name:user.name,email:user.email,role:user.role}, secret, {
      expiresIn: ACCESS_TOKEN_EXPIRATION,
    });
    return res.status(200).send({ accessToken });
  } catch (error) {
    return res.status(400).send(error);
  }
};

export const assignCoach = async (req: any, res: Response) => {
  const { id } = req.params;
  try {
    const {role} = req.user
    if(role !== "ADMIN"){
      return res.status(400).send("Only admins can assign coach to trainees")
    }
    const result = await coachAssignSchema.validateAsync(req.body);
    const user: any = await User.findById(id);
    if (user.role !== "TRAINEE") {
      return res.status(403).send("coach is assigned only to trainee");
    }
    const coach: any = await User.findById(result.coachId);
    console.log({coach})
    if (coach.role !== "COACH") {
      return res
        .status(403)
        .send("only user with coach role can be assigned to be a coach");
    }
    user.coach = coach._id;
    await user.save();
    return res.status(200).send("coach was assigned succesfully");
  } catch (error) {
    res.status(400).send(error);
  }
};