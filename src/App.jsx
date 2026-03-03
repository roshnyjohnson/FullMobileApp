import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Login from "./components/Auth/Login";
import Signup from "./components/Auth/Signup";

import OwnerDashboard from "./pages/OwnerDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import VolunteerDashboard from "./pages/VolunteerDashboard";

function App() {
  return (
    <Router>
      <Routes>
        {/* Auth Pages */}
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Dashboards */}
        <Route path="/owner" element={<OwnerDashboard />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/volunteer" element={<VolunteerDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
