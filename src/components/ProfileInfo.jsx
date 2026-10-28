import { useNavigate } from "react-router-dom";
import styles from "./ProfileInfo.module.css";
import { useChatContext } from "../context/ChatProvider";
import Axios from "./Auth/axiosConfig";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function ProfileInfo({ onCloseProfile, onOpenModal }) {
  // console.log("ProfileInfo component");
  const navigate = useNavigate();

  const {
    setChats,
    setSelectedChat,
    setUser,
    socket,
    setSocket,
    setJwtToken,
    setOnlineUsers,
    setNotification,
    setNotificationFromBackend,
  } = useChatContext();

  function handleModal() {
    onCloseProfile(false);
    onOpenModal(true);
  }

  async function handleLogout() {
    try {
      await Axios.get(`${API_BASE_URL}/api/user/logout`, {
        withCredentials: true, // ✅ required to send HttpOnly cookie
      });

      localStorage.removeItem("userInfo");
      localStorage.removeItem("messages");

      setChats([]);
      setSelectedChat({});
      setOnlineUsers([]);
      setNotificationFromBackend([]);
      setNotification([]);
      setUser({});
      setSocket(null);

      // Disconnect STOMP client
      if (socket && socket.connected) {
        socket.deactivate(); // Graceful shutdown (recommended)
      }

      navigate("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }

  return (
    <div className={styles.ProfileCont}>
      <button className={styles.BtnProfile} onClick={handleModal}>
        My Profile
      </button>
      <button className={styles.BtnProfile} onClick={handleLogout}>
        Logout
      </button>
    </div>
  );
}

export default ProfileInfo;
