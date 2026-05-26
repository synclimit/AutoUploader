import { useEffect, useState } from "react"
import axios from "axios"

export default function Dashboard() {

  const [tasks, setTasks] = useState([])

  useEffect(() => {

    loadTasks()

    const interval = setInterval(() => {

      loadTasks()

    }, 3000)

    return () => clearInterval(interval)

  }, [])


  const loadTasks = async () => {

    try {

      const response = await axios.get(
        "http://127.0.0.1:8000/tasks"
      )

      setTasks(response.data)

    } catch (error) {

      console.error(error)
    }
  }


  return (

    <div>

      <h1 style={{
        fontSize: "28px",
        marginBottom: "20px"
      }}>
        Realtime Upload Queue
      </h1>

      <div style={{
        display: "flex",
        flexDirection: "column",
        gap: "12px"
      }}>

        {tasks.map((task, index) => (

          <div
            key={index}
            style={{
              background: "#1a1f2b",
              padding: "16px",
              borderRadius: "12px",
              border: "1px solid rgba(255,255,255,0.05)"
            }}
          >

            <div style={{
              fontSize: "18px",
              marginBottom: "8px"
            }}>
              {task.title}
            </div>

            <div style={{
              opacity: 0.7,
              fontSize: "14px"
            }}>
              VIDEO ID: {task.video_id}
            </div>

            <div style={{
              opacity: 0.7,
              fontSize: "14px"
            }}>
              PLATFORM: {task.platform}
            </div>

            <div style={{
              marginTop: "10px",
              color: "#4ade80"
            }}>
              STATUS: {task.status}
            </div>

          </div>

        ))}

      </div>

    </div>

  )
}