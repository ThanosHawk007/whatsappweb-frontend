import styles from "../miscellaneous/TypingIndicator.module.css";

function TypingIndicator() {
  return (
    <div className={styles.typing}>
      <div className={styles.dot}></div>
      <div className={styles.dot}></div>
      <div className={styles.dot}></div>
    </div>
  );
}

export default TypingIndicator;
