
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import UploadVideo from "./pages/UploadVideo";
import CreateBot from "./pages/CreateBot";
import MyMeetings from "./pages/MyMeetings";
import Settings from "./pages/Settings";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import Landing from "./pages/Landing";

function App() {
  return (
    <>
      <Navbar />
      <div className="pt-4">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/upload" element={<UploadVideo />} />
          <Route path="/create-bot" element={<CreateBot />} />
          <Route path="/meetings" element={<MyMeetings />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </div>
    </>
  );
}

export default App;