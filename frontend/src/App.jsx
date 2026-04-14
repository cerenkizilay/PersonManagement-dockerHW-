import { BrowserRouter, Link, Route, Routes, Navigate, NavLink } from "react-router-dom";
import "./App.css";
import RegisterPage from "./pages/RegisterPage.jsx";
import PeoplePage from "./pages/PeoplePage.jsx";

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <header className="topbar">
          <div className="topbar__inner">
            <Link className="brand" to="/">
              Person Management
            </Link>
            <nav className="nav">
              <NavLink to="/" end>
                Register
              </NavLink>
              <NavLink to="/people">People</NavLink>
            </nav>
          </div>
        </header>

        <main className="container">
          <Routes>
            <Route path="/" element={<RegisterPage />} />
            <Route path="/people" element={<PeoplePage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
