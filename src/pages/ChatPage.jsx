import { useEffect, useState } from "react";
import styles from "./ChatPage.module.css";
import { useChatContext } from "../context/ChatProvider";
import SideDrawer from "../components/miscellaneous/SideDrawer";
import MyChats from "../components/MyChats";
import ChatBox from "../components/ChatBox";
import { useNavigate } from "react-router-dom";

function ChatPage() {
  const { user, setUser } = useChatContext();
  const navigate = useNavigate();

  console.log("ChatPage component");

  useEffect(() => {
    console.log("ChatPage UseEffect");

    if (!user) {
      navigate("/");
    }
  }, []);

  return (
    <>
      {user ? (
        <div style={{ width: "100%" }}>
          <SideDrawer />
          <div
            className={styles.chatPageContainer}
            style={{
              display: "flex",
              justifyContent: "space-between",
              flexDirection: "row",
              padding: "10px",
              height: "91.5vh",
              gap: "12px",
              width: "100%",
            }}
          >
            <MyChats />
            <ChatBox />
          </div>
        </div>
      ) : (
        <p>User is Not Logged in Yet !!!</p>
      )}
    </>
  );
}

export default ChatPage;
