import { Date, Types } from "mongoose"
import { Except, SetOptional } from "type-fest"
import { IUser } from "../models/User"

interface MetaType {
  _id: string
  createdAt: Date
  updatedAt: Date
  __v: number
}

export interface IStage {
  id: string
  name: string
  description: string
  participantsCount: number
}
export interface CreateApplicantTraineeFormDto {
  type: FormType.Applicant | FormType.Trainee
  name: string
  description: string
}

export interface CreateApplicationFormDto {
  type: FormType.Application
  name: string
  description: string
  startDate: string
  endDate: string
  stages: Except<IStage, "id">[]
}

export interface CreateCohortDto {
  name: string
  description?: string
  stages: Except<IStage, "id">[]
  trainingStartDate: Date
}
export interface UpdateFormDto {
  name?: string
  description?: string
  startDate?: string
  endDate?: string
  stages?: StageDto[]
}

export interface UpdateCohortDto {
  name?: string
  description?: string
  stages?: SetOptional<IStage, "id">[]
  trainingStartDate?: string
}

export interface CreateQuestionDto {
  prompt: string
  type: QuestionType
  required: boolean
  options: string[]
}

export interface UpdateQuestionDto {
  prompt?: string
  type?: QuestionType
  isRequired?: boolean
  options?: string[]
}

export interface CreateResponseDto {
  userId: string
  questionId: string
  value: string
}

export interface CreateApplicationResponseDto {
  questionId: string
  answer: string | string[]
}

export type IQuestion = CreateQuestionDto & MetaType

export interface Search {
  searchString?: string
  typeQuery?: string
}

export type GetCohortDto = { _id: Types.ObjectId } | { isActive: true }

export enum FormType {
  Application = "Application",
  Applicant = "Applicant",
  Trainee = "Trainee",
}
export enum Role {
  Admin = "Admin",
  Coach = "Coach",
  Trainee = "Trainee",
  Applicant = "Applicant",
  Prospect = "Prospect",
}

export enum Decision {
  Accepted = "Accepted",
  Rejected = "Rejected",
}
export enum QuestionType {
  Text = "Text",
  SingleSelect = "SingleSelect",
  MultiSelect = "MultiSelect",
}

export interface DecisionDto {
  userId: string
  decision: Decision
  feedback: string
}

export type updateUserDto = Partial<
  Pick<IUser, "name" | "email" | "verified" | "password" | "role" | "coach">
>
export interface ICohortOverviewRequest {
  cohortId?: string
  overviewType: FormType.Applicant | FormType.Trainee
  coachId?: string
}

export interface RegisterUserDto {
  name: string
  email: string
  role: Exclude<Role, Role.Applicant | Role.Trainee>
}

export interface AddApplicantsDto {
  prospectIds: string[]
}

export interface StageDto {
  name: string
  description: string
}
