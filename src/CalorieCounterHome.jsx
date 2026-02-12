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

  /* ================= MERGE BASE + ADMIN ================= */

  const adminMenu = getAdminMenu() || {};
  const adminItems = Object.values(adminMenu)
    .flat()
    .filter((i) => !i.deleted);

  // give ids to base items
  let menu = data.map((item, index) => ({
    ...item,
    id: item.id ?? `base-${index}`,
  }));

  // replace or add
  adminItems.forEach((adminItem) => {
    const index = menu.findIndex((b) => b.id === adminItem.id);

    if (index !== -1) {
      menu[index] = adminItem; // replace, keep position
    } else {
      menu.push(adminItem); // new item
    }
  });

  /* ================= APPLY ADMIN ORDER ================= */
  menu.sort((a, b) => (a.order ?? 9999) - (b.order ?? 9999));

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

  /* ================= IMAGE ================= */
  const getImage = (img) => {
    if (!img) return "https://via.placeholder.com/150";
    if (img.startsWith("data:")) return img;
    if (img.startsWith("http")) return img;
    return new URL(`./assets/menu/${img}`, import.meta.url).href;
  };

  /* ================= ADD TO PLATE ================= */
  const addToPlate = (item) => {
    setPlate((prev) => {
      const existing = prev.find((p) => p.id === item.id);
      if (existing) {
        return prev.map((p) =>
          p.id === item.id ? { ...p, qty: p.qty + 1 } : p
        );
      }
      return [...prev, { ...item, qty: 1 }];
    });
  };

  const removeFromPlate = (id) => {
    setPlate((prev) => prev.filter((p) => p.id !== id));
  };

  const changeQty = (id, delta) => {
    setPlate((prev) =>
      prev
        .map((p) =>
          p.id === id ? { ...p, qty: p.qty + delta } : p
        )
        .filter((p) => p.qty > 0)
    );
  };

  const totalCalories = useMemo(() => {
    return plate.reduce((sum, item) => sum + item.calories * item.qty, 0);
  }, [plate]);

  const percent = Math.min((totalCalories / goal) * 100, 100);
  const isOver = totalCalories > goal;

  /* ================= UI ================= */
  return (
    <div className="wrapper">
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
              {filtered.map((item) => (
                <div
                  key={item.id}
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
              <div className="over-warning">
                ⚠ You exceeded your goal by {totalCalories - goal} kcal
              </div>
            )}

            {plate.length === 0 ? (
              <div className="empty">
                No items yet — add items from the left.
              </div>
            ) : (
              <div className="plate-items">
                {plate.map((item) => (
                  <div key={item.id} className="plate-item">
                    <img src={getImage(item.image)} alt={item.name} />

                    <div className="plate-info">
                      <div className="plate-name">{item.name}</div>
                      <div className="plate-cal">
                        {item.calories * item.qty} kcal
                      </div>
                    </div>

                    <div className="qty">
                      <button onClick={() => changeQty(item.id, -1)}>-</button>
                      <span>{item.qty}</span>
                      <button onClick={() => changeQty(item.id, 1)}>+</button>
                    </div>

                    <button
                      className="remove"
                      onClick={() => removeFromPlate(item.id)}
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

      <footer className="footer">
        © 2026 Scottland Food Group Corp. IT Solutions
      </footer>
    </div>
  );
}

export default CalorieCounterHome;
