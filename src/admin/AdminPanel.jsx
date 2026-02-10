import { useState } from "react";
import { useNavigate } from "react-router-dom";
import baseMenu from "../data/menu.json";
import { getAdminMenu, saveAdminMenu } from "../utils/menuStorage";
import trashIcon from "../assets/trash-solid.svg";
import "./AdminPanel.css";

const HIDDEN_KEY = "bonchon_hidden_items";

export default function AdminPanel() {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);

  const [category, setCategory] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [name, setName] = useState("");
  const [calories, setCalories] = useState("");
  const [image, setImage] = useState("");
  const [preview, setPreview] = useState("");

  const [refresh, setRefresh] = useState(false);

  const adminMenu = getAdminMenu() || {};
  const hidden = JSON.parse(localStorage.getItem(HIDDEN_KEY) || "[]");

  /* ================= LOGOUT ================= */
  const handleLogout = () => {
    localStorage.removeItem("adminLoggedIn"); // change if your key is different
    navigate("/admin"); // go back to login page
  };

  /* ================= GROUP BASE ================= */
  const grouped = {};

  baseMenu.forEach((item) => {
    if (hidden.includes(item.name)) return;

    const cat = item.category || "Uncategorized";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(item);
  });

  /* ================= MERGE ADMIN ================= */
  for (const cat in adminMenu) {
    if (!Array.isArray(adminMenu[cat])) continue;
    if (!grouped[cat]) grouped[cat] = [];

    const items = adminMenu[cat].filter((i) => !hidden.includes(i.name));
    grouped[cat] = [...grouped[cat], ...items];
  }

  const categories = Object.keys(grouped);

  /* ================= IMAGE ================= */
  const getImage = (img) => {
    if (!img) return "https://via.placeholder.com/150";
    if (img.startsWith("data:")) return img;
    if (img.startsWith("http")) return img;
    return new URL(`../assets/menu/${img}`, import.meta.url).href;
  };

  /* ================= FILE ================= */
  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setImage(reader.result);
      setPreview(reader.result);
    };

    reader.readAsDataURL(file);
  };

  /* ================= ADD ================= */
  const handleSubmit = (e) => {
    e.preventDefault();

    const finalCategory = newCategory || category;
    if (!finalCategory) return alert("Select or create category");

    const updated = { ...adminMenu };

    if (!Array.isArray(updated[finalCategory])) {
      updated[finalCategory] = [];
    }

    updated[finalCategory].push({
      category: finalCategory,
      name,
      calories: Number(calories),
      image,
    });

    saveAdminMenu(updated);
    window.dispatchEvent(new Event("menuUpdated"));

    alert("Item added!");

    setShowModal(false);
    setName("");
    setCalories("");
    setImage("");
    setPreview("");
    setNewCategory("");

    setRefresh((p) => !p);
  };

  /* ================= DELETE ================= */
  const handleDelete = (item) => {
    if (!window.confirm(`Delete "${item.name}" ?`)) return;

    const hiddenNow = JSON.parse(localStorage.getItem(HIDDEN_KEY) || "[]");

    if (!hiddenNow.includes(item.name)) {
      hiddenNow.push(item.name);
      localStorage.setItem(HIDDEN_KEY, JSON.stringify(hiddenNow));
    }

    window.dispatchEvent(new Event("menuUpdated"));
    setRefresh((p) => !p);
  };

  return (
    <div className="admin-panel">
      {/* HEADER */}
      <div className="admin-header">
        <h2>BonChon Calorie Counter Items</h2>
        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>

      {categories.map((cat) => (
        <div key={cat} className="category-block">
          <h3>{cat}</h3>

          <div className="items-grid">
            {grouped[cat].map((item, i) => (
              <div key={i} className="admin-card">
                {/* IMAGE */}
                <div className="image-area">
                  <img src={getImage(item.image)} alt={item.name} />
                </div>

                {/* DELETE BUTTON */}
                <button
                  className="delete-btn"
                  onClick={() => handleDelete(item)}
                  title="Delete"
                >
                  <img src={trashIcon} alt="delete" className="trash-img" />
                </button>

                {/* INFO */}
                <div className="card-info">
                  <p className="item-name">{item.name}</p>
                  <p className="item-cal">{item.calories} cal</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* FAB */}
      <button className="fab" onClick={() => setShowModal(true)}>
        +
      </button>

      {/* MODAL */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Add New Item</h3>

            <form onSubmit={handleSubmit}>
              <label>Select Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="">-- choose --</option>
                {categories.map((cat) => (
                  <option key={cat}>{cat}</option>
                ))}
              </select>

              <label>OR New Category</label>
              <input
                placeholder="Category name"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
              />

              <label>Item Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} />

              <label>Calories</label>
              <input
                type="number"
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
              />

              <label>Upload Image</label>
              <input type="file" accept="image/*" onChange={handleFile} />

              {preview && (
                <img
                  src={preview}
                  alt="preview"
                  style={{
                    width: "100%",
                    height: 120,
                    objectFit: "contain",
                    marginTop: 10,
                  }}
                />
              )}

              <div className="modal-actions">
                <button type="button" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
