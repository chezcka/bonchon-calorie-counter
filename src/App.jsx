import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";
import CalorieCounterHome from "./CalorieCounterHome";
import AdminLogin from "./admin/AdminLogin";
import AdminPanel from "./admin/AdminPanel";
import chicken from "./assets/chicken.png";

function Loader() {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const intervals = [0, 500, 1000, 1500];

    intervals.forEach((t, i) => {
      setTimeout(() => {
        setFrame(i);
      }, t);
    });
  }, []);

  return (
    <div className="loader">
      <div className="stage">
        <img
          src={chicken}
          alt="chicken"
          className={`chicken-img frame-${frame}`}
        />
      </div>
      <p className="loading-text">Taking bites...</p>
    </div>
  );
}

function HomeWithLoader() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setLoading(false);
    }, 1700);
  }, []);

  if (loading) return <Loader />;

  return <CalorieCounterHome />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* customer */}
        <Route path="/" element={<HomeWithLoader />} />

        {/* admin */}
        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/admin/panel" element={<AdminPanel />} />
      </Routes>
    </BrowserRouter>
  );
}
