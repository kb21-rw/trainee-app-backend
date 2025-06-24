import Coach from "../models/Coach"

export const getCoachesQuery = async (cohortId: string) => {
  const coaches = await Coach.find({ cohortId: cohortId })
  console.log("Coaches found:", coaches)

  return coaches
}
