import { Outlet } from "react-router-dom";
import Header from "./Header";
import Sidebar from "./Sidebar";
import AssistantWidget from "../Assistant/AssistantWidget";
import ToastContainer from "../ui/Toast/Toast";
import SetupWizard from "../SetupWizard/SetupWizard";
import { useSetupWizard } from "../SetupWizard/useSetupWizard";
import styles from "./Layout.module.scss";

export default function Layout() {
  const wizard = useSetupWizard();

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
      {wizard.isOpen && (
        <SetupWizard
          onClose={wizard.complete}
          onComplete={wizard.complete}
        />
      )}
    </div>
  );
}
