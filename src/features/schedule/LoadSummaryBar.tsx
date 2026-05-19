import styles from "./LoadSummaryBar.module.css";

// Goal-coverage rollup is implemented in slice 4. For slice 1 the bar
// renders a minimal placeholder so the schedule page composes cleanly.
export function LoadSummaryBar() {
  return (
    <div className={styles.bar}>
      <div className={styles.entries}>
        <span className={styles.emptyHint}>
          Goal coverage coming soon — set goals from the Skill Tree page.
        </span>
      </div>
    </div>
  );
}
