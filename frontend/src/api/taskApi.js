import API from "./backend"

export const fetchTasks = async () => {

  const response = await API.get("/tasks")

  return response.data
}