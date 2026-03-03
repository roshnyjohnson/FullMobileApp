import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./components/Auth/Login";
import Signup from "./components/Auth/Signup";
import OwnerDashboard from "./pages/OwnerDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import VolunteerDashboard from "./pages/VolunteerDashboard";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        <Route path="/owner" element={<OwnerDashboard />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/volunteer" element={<VolunteerDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
