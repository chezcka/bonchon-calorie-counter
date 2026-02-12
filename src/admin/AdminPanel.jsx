import { useState } from "react";
import { useNavigate } from "react-router-dom";
import baseMenu from "../data/menu.json";
import { getAdminMenu, saveAdminMenu } from "../utils/menuStorage";
import trashIcon from "../assets/trash-solid.svg";
import penIcon from "../assets/pen-solid.svg";
import reorderIcon from "../assets/reorder.svg";

import { DndContext, closestCenter } from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import "./AdminPanel.css";

export default function AdminPanel() {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const [category, setCategory] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [name, setName] = useState("");
  const [calories, setCalories] = useState("");
  const [image, setImage] = useState("");
  const [preview, setPreview] = useState("");

  const [refresh, setRefresh] = useState(false);

  const adminMenu = getAdminMenu() || {};

  const handleLogout = () => {
    localStorage.removeItem("adminLoggedIn");
    navigate("/admin");
  };

  /* ================= GROUP BASE ================= */
  const grouped = {};

  baseMenu.forEach((item, index) => {
    const cat = item.category || "Uncategorized";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push({
      ...item,
      id: `base-${index}`,
      isBase: true,
    });
  });

  /* ================= MERGE ADMIN ================= */
  for (const cat in adminMenu) {
    if (!Array.isArray(adminMenu[cat])) continue;
    if (!grouped[cat]) grouped[cat] = [];

    const items = adminMenu[cat].filter((i) => !i.deleted);

    items.forEach((adminItem) => {
      const index = grouped[cat].findIndex((b) => b.id === adminItem.id);
      if (index !== -1) grouped[cat][index] = adminItem;
      else grouped[cat].push(adminItem);
    });
  }

  /* ⭐ IMPORTANT: APPLY SAVED ORDER */
  Object.keys(grouped).forEach((cat) => {
    grouped[cat].sort((a, b) => (a.order ?? 9999) - (b.order ?? 9999));
  });

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
    if (!Array.isArray(updated[finalCategory])) updated[finalCategory] = [];

    updated[finalCategory].push({
      id: Date.now(),
      category: finalCategory,
      name,
      calories: Number(calories),
      image,
    });

    saveAdminMenu(updated);
    window.dispatchEvent(new Event("menuUpdated"));
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

    const updated = { ...adminMenu };
    const cat = item.category;

    if (!Array.isArray(updated[cat])) updated[cat] = [];
    updated[cat] = updated[cat].filter((i) => i.id !== item.id);

    if (item.isBase) updated[cat].push({ ...item, deleted: true });

    saveAdminMenu(updated);
    window.dispatchEvent(new Event("menuUpdated"));
    setRefresh((p) => !p);
  };

  /* ================= EDIT ================= */
  const openEdit = (item) => {
    setEditingItem(item);
    setName(item.name);
    setCalories(item.calories);
    setShowEdit(true);
  };

  const handleEditSave = (e) => {
    e.preventDefault();

    const updated = { ...adminMenu };
    const cat = editingItem.category;

    if (!Array.isArray(updated[cat])) updated[cat] = [];

    const index = updated[cat].findIndex((i) => i.id === editingItem.id);

    const newItem = {
      ...editingItem,
      name,
      calories: Number(calories),
      isBase: false,
    };

    if (index !== -1) updated[cat][index] = newItem;
    else updated[cat].push(newItem);

    saveAdminMenu(updated);
    window.dispatchEvent(new Event("menuUpdated"));
    setShowEdit(false);
    setEditingItem(null);
    setRefresh((p) => !p);
  };

  /* ================= DRAG END (uses SAME save logic) ================= */
  const handleDragEnd = (event, cat) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = grouped[cat].findIndex((i) => i.id === active.id);
    const newIndex = grouped[cat].findIndex((i) => i.id === over.id);

    const newList = arrayMove(grouped[cat], oldIndex, newIndex);

    const updated = { ...adminMenu };
    updated[cat] = newList.map((item, i) => ({
      ...item,
      order: i,
      isBase: false,
    }));

    saveAdminMenu(updated);
    window.dispatchEvent(new Event("menuUpdated"));
    setRefresh((p) => !p);
  };

  /* ================= SORTABLE ITEM ================= */
  function SortableItem({ item, children }) {
    const { attributes, listeners, setNodeRef, transform, transition } =
      useSortable({ id: item.id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    };

    return (
      <div ref={setNodeRef} style={style} {...attributes}>
        {children(listeners)}
      </div>
    );
  }

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h2>BonChon Calorie Counter Items</h2>
        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>

      {categories.map((cat) => (
        <div key={cat} className="category-block">
          <h3>{cat}</h3>

          <DndContext
            collisionDetection={closestCenter}
            onDragEnd={(e) => handleDragEnd(e, cat)}
          >
            <SortableContext
              items={grouped[cat].map((i) => i.id)}
              strategy={horizontalListSortingStrategy}
            >
              <div className="items-grid">
                {grouped[cat].map((item) => (
                  <SortableItem key={item.id} item={item}>
                    {(listeners) => (
                      <div className="admin-card">
                        <div className="image-area">
                          <img src={getImage(item.image)} alt={item.name} />
                        </div>

                        <button className="edit-btn" onClick={() => openEdit(item)}>
                          <img src={penIcon} alt="edit" />
                        </button>

                        <button
                          className="delete-btn"
                          onClick={() => handleDelete(item)}
                          title="Delete"
                        >
                          <img src={trashIcon} alt="delete" className="trash-img" />
                        </button>

                        <button className="reorder-btn" {...listeners}>
                          <img src={reorderIcon} alt="reorder" />
                        </button>

                        <div className="card-info">
                          <p className="item-name">{item.name}</p>
                          <p className="item-cal">{item.calories} cal</p>
                        </div>
                      </div>
                    )}
                  </SortableItem>
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      ))}

      <button className="fab" onClick={() => setShowModal(true)}>
        +
      </button>

      {/* ================= ADD MODAL ================= */}
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

      {/* ================= EDIT MODAL ================= */}
      {showEdit && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Edit Item</h3>

            <form onSubmit={handleEditSave}>
              <label>Item Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} />

              <label>Calories</label>
              <input
                type="number"
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
              />

              <div className="modal-actions">
                <button type="button" onClick={() => setShowEdit(false)}>
                  Cancel
                </button>
                <button type="submit">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

