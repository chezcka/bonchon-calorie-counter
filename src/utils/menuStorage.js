const STORAGE_KEY = "bonchon_admin_menu";

export const getAdminMenu = () => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : {};
};

export const saveAdminMenu = (menu) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(menu));
};
