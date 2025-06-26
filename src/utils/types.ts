import { Date, Types } from "mongoose"
import { Except, SetOptional } from "type-fest"
import { IUser } from "../models/User"

interface MetaType {
  _id: string
  createdAt: Date
  updatedAt: Date
  __v: number
}

export enum StageName {
  InterviewOne = "Interview One",
  InterviewTwo = "Interview Two",
  JSFundamentals = "JS Fundamentals",
  JSDOM = "JS DOM",
  ES6 = "ES6",
  React = "React",
  AsynchronousJS = "Asynchronous JS",
}

export type TraineeDto = {
  userId: string
  cohortId: string
  coachId: string
  stage: string
  status: TraineeStatus
}

export interface IFeedback {
  stageId: string
  description: string
}

export interface DecisionDto {
  traineeId: string
  decision: Decision
  feedback: string
}

export interface IStage {
  name: StageName
  id: string
  description?: string
  participantsCount: number
  isPreselection: boolean
  isCurrent: boolean
}

export interface ICoach {
  _id: string
  userId: IUser["_id"]
  applicants: IUser["_id"][] // refer to applicants IDs in the trainees model
  trainees: IUser["_id"][] // refer to trainees IDs in the trainees model
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
  startDate: Date
  endDate: Date
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
  startDate?: string
  endDate?: string
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
  Pick<IUser, "name" | "email" | "verified" | "password" | "role" | "active">
>
export interface ICohortOverviewRequest {
  cohortId?: string
  overviewType: FormType.Applicant | FormType.Trainee
  coachId?: string
}

export interface RegisterUserDto {
  name: string
  email: string
  role: Exclude<Role, Role.Trainee>
}

export interface AddApplicantsDto {
  prospectIds: string[]
}
export interface StageDto {
  name: StageName
  description?: string
  isCurrent: boolean
  isPreselection: boolean
}

// responses left in lowercase for smoother integration with Apps Script
export interface JoinWaitListDto {
  respondentEmail: string
  timestamp: string
  responses: {
    email: string
    firstname: string
    lastname: string
  }
}

// New types for New User model
export enum Role {
  Prospect = "Prospect",
  Admin = "Admin",
  Coach = "Coach",
  Trainee = "Trainee",
}

export enum TraineeStatus {
  ENROLLED = "ENROLLED",
  DROPPED_OUT = "DROPPED_OUT",
  REJECTED = "REJECTED",
  GRADUATED = "GRADUATED",
}

export enum UserStatus {
  REGISTERED = "REGISTERED",
  ON_WAIT_LIST = "ON_WAIT_LIST",
  APPLIED = "APPLIED",
  ENROLLED = "ENROLLED",
  REJECTED = "REJECTED",
  STAFF = "STAFF",
}
