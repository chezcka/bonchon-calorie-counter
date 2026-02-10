import { useMemo, useState, useEffect } from "react";
import "./CalorieCounterHome.css";
import logo from "./assets/bonchon-logo.png";
import data from "./data/menu.json";
import { getAdminMenu } from "./utils/menuStorage";

/* categories */
const categories = [
  "Korean Fried Chicken",
  "Group Meals",
  "Beef",
  "Seafood",
  "Mandu Korean Dumplings",
  "Korean Rice Bowls",
  "Sandwiches",
  "Noodle & Soup",
  "Sides",
  "Desserts",
  "Beverages",
];

function CalorieCounterHome() {
  /* ================= REALTIME REFRESH ================= */
  const [refresh, setRefresh] = useState(false);

  useEffect(() => {
    const update = () => setRefresh((p) => !p);
    window.addEventListener("menuUpdated", update);
    return () => window.removeEventListener("menuUpdated", update);
  }, []);

  const [selectedCategory, setSelectedCategory] = useState(
    "Korean Fried Chicken"
  );
  const [search, setSearch] = useState("");
  const [plate, setPlate] = useState([]);
  const [goal, setGoal] = useState(2000);

  /* ================= MERGE MENUS ================= */

  const adminMenu = getAdminMenu() || {};
  const adminItems = Object.values(adminMenu).flat();

  const menu = [...data, ...adminItems];

  /* ================= FILTER ================= */
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (term.length > 0) {
      return menu.filter((i) =>
        i.name.toLowerCase().includes(term)
      );
    }

    return menu.filter((i) => i.category === selectedCategory);
  }, [selectedCategory, search, refresh]);

  /* ================= IMAGE LOADER ================= */
  const getImage = (img) => {
    if (!img) return "https://via.placeholder.com/150";

    // uploaded image
    if (img.startsWith("data:")) return img;

    // external
    if (img.startsWith("http")) return img;

    // file from assets
    return new URL(`./assets/menu/${img}`, import.meta.url).href;
  };

  /* ================= ADD ITEM ================= */
  const addToPlate = (item) => {
    setPlate((prev) => {
      const existing = prev.find((p) => p.name === item.name);
      if (existing) {
        return prev.map((p) =>
          p.name === item.name ? { ...p, qty: p.qty + 1 } : p
        );
      }
      return [...prev, { ...item, qty: 1 }];
    });
  };

  /* ================= REMOVE ================= */
  const removeFromPlate = (name) => {
    setPlate((prev) => prev.filter((p) => p.name !== name));
  };

  /* ================= CHANGE QTY ================= */
  const changeQty = (name, delta) => {
    setPlate((prev) =>
      prev
        .map((p) =>
          p.name === name ? { ...p, qty: p.qty + delta } : p
        )
        .filter((p) => p.qty > 0)
    );
  };

  /* ================= TOTAL ================= */
  const totalCalories = useMemo(() => {
    return plate.reduce((sum, item) => sum + item.calories * item.qty, 0);
  }, [plate]);

  const percent = Math.min((totalCalories / goal) * 100, 100);
  const isOver = totalCalories > goal;

  /* ================= UI ================= */
  return (
    <div className="wrapper">
      {/* HEADER */}
      <div className="intro">
        <div className="intro-inner">
          <img src={logo} alt="Bonchon logo" className="logo" />
          <div className="intro-text">
            <h1>BonChon Calorie Counter – Track Calories & Nutrition Facts</h1>
            <p>
              Track nutrition for chicken, rice meals, noodles, desserts and
              more.
            </p>
          </div>
        </div>
      </div>

      {/* PAGE */}
      <div className="page">
        <div className="app-layout">
          {/* LEFT */}
          <div className="menu-panel">
            <div className="controls">
              <input
                className="search"
                placeholder="Search items"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />

              <select
                className="category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                {categories.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="items-grid">
              {filtered.map((item, i) => (
                <div
                  key={i}
                  className="item-card"
                  onClick={() => addToPlate(item)}
                >
                  <img
                    src={getImage(item.image)}
                    alt={item.name}
                    className="food-img"
                  />
                  <div className="item-name">{item.name}</div>
                  <div className="item-cal">{item.calories} kcal</div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT */}
          <div className="plate-panel">
            <div className="goal-box">
              <label>Daily Goal</label>
              <input
                type="number"
                value={goal}
                onChange={(e) => setGoal(Number(e.target.value))}
              />
            </div>

            <div className="total-box">
              <p>Total calories in plate</p>
              <h2>{totalCalories} kcal</h2>
            </div>

            <div className="progress-bar">
              <div
                className="progress"
                style={{
                  width: percent + "%",
                  background: isOver ? "#ff3b30" : "#e10600",
                }}
              />
            </div>

            {isOver && (
              <div className="warning">
                ⚠ You exceeded your daily calorie goal.
              </div>
            )}

            {plate.length === 0 ? (
              <div className="empty">
                No items yet — add items from the left.
              </div>
            ) : (
              <div className="plate-items">
                {plate.map((item) => (
                  <div key={item.name} className="plate-item">
                    <img src={getImage(item.image)} alt={item.name} />

                    <div className="plate-info">
                      <div className="plate-name">{item.name}</div>
                      <div className="plate-cal">
                        {item.calories * item.qty} kcal
                      </div>
                    </div>

                    <div className="qty">
                      <button onClick={() => changeQty(item.name, -1)}>-</button>
                      <span>{item.qty}</span>
                      <button onClick={() => changeQty(item.name, 1)}>+</button>
                    </div>

                    <button
                      className="remove"
                      onClick={() => removeFromPlate(item.name)}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="actions">
              <button
                onClick={() =>
                  navigator.clipboard.writeText(totalCalories)
                }
              >
                Copy
              </button>

              <button>Share</button>

              <button className="clear" onClick={() => setPlate([])}>
                Clear
              </button>
            </div>

            <p className="hint">Tip: click food to add more.</p>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="footer">
        © 2026 Scottland Food Group Corp. IT Solutions
      </footer>
      
    </div>
  );
}

export default CalorieCounterHome;
