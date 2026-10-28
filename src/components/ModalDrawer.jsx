import { useState } from "react";
import styles from "./ModalDrawer.module.css";
import { Spinner, useToast } from "@chakra-ui/react";
import Axios from "./Auth/axiosConfig";
import { useChatContext } from "../context/ChatProvider";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function ModalDrawer({ onClose, isOpen }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingChat, setLoadingChat] = useState(false);
  const toast = useToast();

  const { setSelectedChat, chats, setChats, socket } = useChatContext();

  // console.log("ModalDrawer Component");
  // console.log({ searchResults });

  async function handleSearch() {
    if (!searchQuery.trim().length) {
      toast({
        title: "Please enter a valid user name !!",
        status: "warning",
        duration: "4000",
        isClosable: true,
        position: "top-left",
      });
      return;
    }

    try {
      setLoading(true);
      const { data } = await Axios.get(
        `${API_BASE_URL}/api/user?search=${searchQuery}`,
        { withCredentials: true },
      );

      // console.log(data);
      setSearchResults(data);
    } catch (err) {
      // console.log(err.message);
    } finally {
      setLoading(false);
    }
  }

  //Func. to create the chat with the clicked User.
  async function accessChat(userId) {
    // console.log({ userId });

    try {
      setLoadingChat(true);
      const { data } = await Axios.post(
        `${API_BASE_URL}/api/chat/access`,
        { userId },
        { withCredentials: true },
      );

      // console.log(data);

      if (!chats.find((el) => el.id === data.id)) {
        console.log("New chat doc added");
        setChats([data, ...chats]);
      }

      setSelectedChat(data);
      //  socket.emit("refetchingChats", data);

      socket.publish({
        destination: "/app/chat/refetch",
        body: JSON.stringify(data), // data is created ChatDTOFE
      });

      socket.publish({
        destination: "/app/newChat/onlineUsersNotify",
        body: JSON.stringify(data), // data is created ChatDTOFE
      });

      onClose(false);
    } catch (err) {
      toast({
        title: "Invalid userId (Chat not created)",
        status: "error",
        duration: "4000",
        isClosable: true,
        position: "top-left",
      });
      // console.log(err.message);
    } finally {
      setLoadingChat(false);
    }
  }

  return (
    <div className={`${styles.modalDrawer} ${isOpen ? styles.open : ""}`}>
      <div className={styles.modalContent}>
        <div className={styles.header}>
          <h2>Search Users</h2>
          <button className={styles.closeBtn} onClick={() => onClose(false)}>
            &times;
          </button>
        </div>
        <input
          type="text"
          className={styles.searchInput}
          placeholder="Search Users..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <button className={styles.GoBtn} onClick={handleSearch}>
          Go
        </button>
        {loading ? (
          <Spinner
            thickness="4px"
            speed="0.65s"
            emptyColor="gray.200"
            color="blue.500"
            size="xl"
          />
        ) : (
          searchResults.length > 0 && (
            <ul className={styles.userList}>
              {searchResults.map((user) => (
                <li
                  key={user.id}
                  className={styles.userItem}
                  onClick={() => accessChat(user.id)}
                >
                  <img
                    src={user.pic}
                    alt={user.name}
                    className={styles.avatar}
                  />
                  <div>
                    <p className={styles.userName}>{user.name}</p>
                    <p className={styles.userEmail}>Email: {user.email}</p>
                  </div>
                </li>
              ))}
            </ul>
          )
        )}
        {loadingChat ? (
          <Spinner
            thickness="3px"
            speed="0.65s"
            emptyColor="gray.200"
            color="blue.500"
            size="xl"
          />
        ) : (
          ""
        )}
      </div>
    </div>
  );
}

export default ModalDrawer;
