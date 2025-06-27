import Coach from "../models/Coach"

export const getCoachesQuery = async (cohortId: string) => {
  const coaches = await Coach.find({ cohortId: cohortId })
  return coaches
}
