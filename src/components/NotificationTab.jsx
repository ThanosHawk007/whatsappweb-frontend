import { useChatContext } from "../context/ChatProvider";
import styles from "./NotificationTab.module.css";
import Axios from "./Auth/axiosConfig";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function NotificationTab({ onCloseTab }) {
  const {
    notification,
    setNotification,
    user,
    setSelectedChat,
    notificationFromBackend,
    setNotificationFromBackend,
  } = useChatContext();

  const getChatName = (loggedUser, users) => {
    return loggedUser.id === users[0].id ? users[1].name : users[0].name;
  };

  async function removeNotificationFromBackend(notifyObj) {
    let isPresent = notificationFromBackend.find(
      (el) => el.currMessage.id === notifyObj.id,
    );

    if (isPresent !== undefined) {
      // console.log("Notification deleted from backend !!! ");

      try {
        //Logic to delete notification Obj./doc. from backend.
        const { data } = await Axios.delete(
          `${API_BASE_URL}/api/notification/notificationdelete`,
          {
            headers: { "Content-Type": "application/json" },
            data: { notifyId: isPresent.id }, // Pass chatId here
            withCredentials: true,
          },
        );

        // console.log({ deletedNotificationDoc: data });
        setNotificationFromBackend(
          notificationFromBackend.filter(
            (el) => el.currMessage.id !== notifyObj.id,
          ),
        );
      } catch (err) {
        // console.log(err.message);
      }
    }
  }

  return (
    <div className={styles.notificationContainer}>
      {!notification.length && "No New Messages"}
      {notification.length !== 0 &&
        notification.map((notify) => {
          return (
            <li
              key={notify.id}
              className={styles.notifyItem}
              onClick={() => {
                setSelectedChat(notify.chat);
                setNotification((notification) =>
                  notification.filter((el) => el.id !== notify.id),
                );
                removeNotificationFromBackend(notify);
                onCloseTab(false);
              }}
            >
              {notify.chat.isGroupChat
                ? `New Message in ${notify.chat.chatName}`
                : `New Message from ${getChatName(user, notify.chat.users)}`}
            </li>
          );
        })}
    </div>
  );
}

export default NotificationTab;
