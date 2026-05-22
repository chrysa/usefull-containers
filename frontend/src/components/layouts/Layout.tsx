import { Outlet } from "react-router-dom";
import Header from "./Header";
import Sidebar from "./Sidebar";
import AssistantWidget from "../Assistant/AssistantWidget";
import ToastContainer from "../ui/Toast/Toast";
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
      <AssistantWidget />
      <ToastContainer />
    </div>
  );
}
