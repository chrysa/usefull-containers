import { Outlet } from "react-router-dom";
import Header from "./Header";
import Sidebar from "./Sidebar";
import styles from "./Layout.module.scss";

export default function Layout() {
  return (
    <div className={styles.layout}>
      <Header />
      <div className={styles.body}>
        <Sidebar />
        <main className={styles.content}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
