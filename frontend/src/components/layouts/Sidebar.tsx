import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import styles from "./Sidebar.module.scss";

export default function Sidebar() {
  const { t } = useTranslation();
  return (
    <nav className={styles.sidebar}>
      <NavLink to="/">{t("nav.home")}</NavLink>
      <NavLink to="/blueprints">{t("nav.blueprints")}</NavLink>
    </nav>
  );
}
