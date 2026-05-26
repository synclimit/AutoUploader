import { BrowserRouter, Routes, Route, Link } from "react-router-dom"

import Dashboard from "./pages/Dashboard"
import Upload from "./pages/Upload"
import Accounts from "./pages/Accounts"
import History from "./pages/History"
import Settings from "./pages/Settings"


export default function App() {

  return (

    <BrowserRouter>

      <div style={{
        display: "flex",
        height: "100vh",
        background: "#0f1115",
        color: "white"
      }}>

        <div style={{
          width: "220px",
          background: "#151922",
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          gap: "12px"
        }}>

          <h2>AutoUploader</h2>

          <Link to="/">Dashboard</Link>

          <Link to="/upload">Upload</Link>

          <Link to="/accounts">Accounts</Link>

          <Link to="/history">History</Link>

          <Link to="/settings">Settings</Link>

        </div>

        <div style={{
          flex: 1,
          padding: "30px"
        }}>

          <Routes>

            <Route path="/" element={<Dashboard />} />

            <Route path="/upload" element={<Upload />} />

            <Route path="/accounts" element={<Accounts />} />

            <Route path="/history" element={<History />} />

            <Route path="/settings" element={<Settings />} />

          </Routes>

        </div>

      </div>

    </BrowserRouter>
  )
}