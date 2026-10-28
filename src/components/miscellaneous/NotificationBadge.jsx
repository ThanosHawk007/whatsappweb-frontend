import styles from "./NotificationBadge.module.css"; // Importing CSS module

function NotificationBadge({ count, effect }) {
  // Determine the class based on the effect prop
  const effectClass = effect === "SCALE" ? styles.scaleEffect : "";

  if (count === 0) {
    return <></>;
  }

  return (
    <span className={`${styles.notificationBadge} ${effectClass}`}>
      {count}
    </span>
  );
}

export default NotificationBadge;
