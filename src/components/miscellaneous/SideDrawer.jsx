import { useEffect, useState } from "react";
import styles from "./SideDrawer.module.css";
import { useChatContext } from "../../context/ChatProvider";
import ProfileInfo from "../ProfileInfo";
import ProfileModal from "../ProfileModal";
import ModalDrawer from "../ModalDrawer";
import NotificationBadge from "./NotificationBadge";
import NotificationTab from "../NotificationTab";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

import Axios from "../Auth/axiosConfig";

function SideDrawer() {
  const [showProfile, setShowProfile] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showSidePanel, setShowSidePanel] = useState(false);
  const [showNotificationTab, setShowNotificationTab] = useState(false);

  const { user, notification, setNotification, setNotificationFromBackend } =
    useChatContext();

  // console.log("SideDrawer component");
  // console.log("SideDrawer user", user?.pic);

  let loggedUser =
    Object.keys(user || {}).length === 0
      ? JSON.parse(localStorage.getItem("userInfo"))
      : user;

  // console.log("SideDrawer loggedUser", loggedUser?.pic);

  const toggleDrawer = () => {
    setShowSidePanel((show) => !show);
  };

  function handleNotificationBell() {
    setShowNotificationTab(!showNotificationTab);
  }

  async function fetchNotifications() {
    if (!user?.id) return;

    try {
      const { data } = await Axios.get(
        `${API_BASE_URL}/api/notification/user/${loggedUser.id}`,
        { withCredentials: true },
      );
      // console.log({ notifications: data });
      setNotification(data.map((el) => el.currMessage));
      setNotificationFromBackend(data.map((el) => el));
    } catch (err) {
      // console.log(err.message);
    }
  }

  useEffect(() => {
    fetchNotifications();
  }, []);

  return (
    <>
      <header className={styles.header}>
        <div className={styles.searchContainer}>
          <input
            type="text"
            placeholder="Search User"
            className={styles.searchInput}
            onFocus={toggleDrawer} // Open drawer on focus
          />
          <button className={styles.SearchBtn}>
            <i className="fa-solid fa-magnifying-glass"></i>
          </button>
        </div>
        <div className={styles.logo}>Talk-A-Tive</div>
        <div className={styles.profileContainer}>
          {/* Notification bell icon */}
          <div className={styles.notificationcontainer}>
            <span
              onClick={handleNotificationBell}
              style={{ cursor: "pointer" }}
              className={styles.notificationBellSec}
            >
              <span className={styles.bellNotify}>
                <NotificationBadge count={notification.length} effect="SCALE" />
              </span>
              <i className="fas fa-bell"></i>
            </span>
            {showNotificationTab && (
              <NotificationTab onCloseTab={setShowNotificationTab} />
            )}
          </div>
          <div
            className={styles.picContainer}
            onClick={() => setShowProfile((sh) => !sh)}
          >
            <img
              src={user.pic} // Replace with actual profile image URL
              alt="Profile"
              className={styles.profileImage}
            />
            <button>
              <i className={`fas fa-chevron-down ${styles.dropdownIcon}`}></i>
            </button>
          </div>
        </div>
        {showProfile && (
          <ProfileInfo
            onCloseProfile={setShowProfile}
            onOpenModal={setShowModal}
          />
        )}
        {showModal && <ProfileModal onClose={setShowModal} />}
        {showSidePanel && (
          <ModalDrawer isOpen={showSidePanel} onClose={setShowSidePanel} />
        )}
      </header>
    </>
  );
}

export default SideDrawer;
