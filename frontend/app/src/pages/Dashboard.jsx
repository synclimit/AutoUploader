import { useEffect, useState } from "react"
import axios from "axios"

export default function Dashboard() {

  const [tasks, setTasks] = useState([])

  useEffect(() => {

    loadTasks()

  }, [])


  const loadTasks = async () => {

    try {

      const response = await axios.get(
        "http://127.0.0.1:8000/tasks"
      )

      console.log("API RESPONSE:")
      console.log(response.data)

      setTasks(response.data)

    } catch (error) {

      console.error("API ERROR:")
      console.error(error)
    }
  }


  return (

    <div style={{
      color: "white",
      padding: "20px"
    }}>

      <h1 style={{
        fontSize: "32px",
        marginBottom: "20px"
      }}>
        Realtime Upload Queue
      </h1>

      <div style={{
        marginBottom: "20px",
        fontSize: "18px",
        color: "#4ade80"
      }}>
        TOTAL TASKS: {tasks.length}
      </div>

      {tasks.length === 0 && (

        <div style={{
          color: "red",
          fontSize: "18px"
        }}>
          NO TASKS FOUND
        </div>

      )}

      <div style={{
        display: "flex",
        flexDirection: "column",
        gap: "16px"
      }}>

        {tasks.map((task, index) => (

          <div
            key={index}
            style={{
              background: "#1a1f2b",
              padding: "20px",
              borderRadius: "12px",
              border: "1px solid rgba(255,255,255,0.08)"
            }}
          >

            <div style={{
              fontSize: "20px",
              color: "white",
              marginBottom: "10px"
            }}>
              {task.title}
            </div>

            <div style={{
              color: "#9ca3af",
              marginBottom: "6px"
            }}>
              VIDEO ID: {task.video_id}
            </div>

            <div style={{
              color: "#9ca3af",
              marginBottom: "6px"
            }}>
              PLATFORM: {task.platform}
            </div>

            <div style={{
              color: "#4ade80",
              fontWeight: "bold"
            }}>
              STATUS: {task.status}
            </div>

          </div>

        ))}

      </div>

    </div>

  )
}