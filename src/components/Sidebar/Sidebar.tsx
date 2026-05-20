import { NavLink } from "react-router-dom";
import { VolumeMark } from "../Brand/VolumeMark";
import styles from "./Sidebar.module.css";

const NAV_ITEMS = [
  { to: "/schedule", label: "Schedule" },
  { to: "/activities", label: "Activities" },
  { to: "/goals", label: "Skill Tree" },
] as const;

export function Sidebar() {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <div className={styles.brandMark}>
          <VolumeMark />
        </div>
        <div className={styles.brandText}>VOLUME</div>
      </div>
      <nav className={styles.nav}>
        {NAV_ITEMS.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `${styles.navItem}${isActive ? ` ${styles.active}` : ""}`
            }
          >
            <span className={styles.navDot} aria-hidden />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
