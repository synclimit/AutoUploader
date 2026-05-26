import { useState } from "react"
import axios from "axios"

export default function Upload() {

  const [title, setTitle] = useState("")
  const [video, setVideo] = useState(null)
  const [thumbnail, setThumbnail] = useState(null)

  const [loading, setLoading] = useState(false)

  const submitUpload = async () => {

    try {

      if (!video || !thumbnail) {

        alert("SELECT VIDEO + THUMBNAIL")

        return
      }

      setLoading(true)

      const formData = new FormData()

      formData.append("title", title)
      formData.append("platform", "YouTube")

      formData.append("video", video)
      formData.append("thumbnail", thumbnail)

      await axios.post(
        "http://127.0.0.1:8000/upload",
        formData
      )

      alert("UPLOAD CREATED")

      setTitle("")

    } catch (error) {

      console.error(error)

      alert("UPLOAD FAILED")
    }

    setLoading(false)
  }


  return (

    <div style={{
      color: "white",
      padding: "30px"
    }}>

      <h1 style={{
        fontSize: "32px",
        marginBottom: "30px"
      }}>
        Upload Module
      </h1>

      <div style={{
        display: "flex",
        flexDirection: "column",
        gap: "20px",
        maxWidth: "600px"
      }}>

        <input
          placeholder="Video Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{
            padding: "16px",
            borderRadius: "10px",
            border: "none",
            background: "#1a1f2b",
            color: "white"
          }}
        />

        <input
          type="file"
          accept="video/mp4"
          onChange={(e) => setVideo(e.target.files[0])}
        />

        <input
          type="file"
          accept="image/*"
          onChange={(e) => setThumbnail(e.target.files[0])}
        />

        <button
          onClick={submitUpload}
          disabled={loading}
          style={{
            padding: "16px",
            borderRadius: "10px",
            border: "none",
            background: "#4ade80",
            color: "black",
            fontWeight: "bold",
            cursor: "pointer"
          }}
        >

          {loading ? "UPLOADING..." : "CREATE UPLOAD"}

        </button>

      </div>

    </div>

  )
}