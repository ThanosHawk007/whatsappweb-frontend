import { useEffect, useState } from "react";
import { useChatContext } from "../context/ChatProvider";
import { useToast } from "@chakra-ui/react";
import styles from "./MyChats.module.css";

import Axios from "./Auth/axiosConfig";
import GroupChatModal from "./GroupChatModal";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function MyChats() {
  const [showGroupChatModal, setShowGroupChatModal] = useState(false);

  const {
    user,
    selectedChat,
    setSelectedChat,
    chats,
    setChats,
    fetchChatsAgain,
    setFetchChatsAgain,
    onlineUsers,
    setOnlineUsers,
    socket,
    notification,
    notificationFromBackend,
    setNotification,
    setNotificationFromBackend,
  } = useChatContext();

  let loggedUser =
    Object.keys(user || {}).length === 0
      ? JSON.parse(localStorage.getItem("userInfo"))
      : user;

  const toast = useToast();

  // console.log("MyChats component");
  // console.log({ chats });
  // console.log({ onlineUsers });

  const fetchAllChats = async () => {
    try {
      const { data } = await Axios.get(`${API_BASE_URL}/api/chat/allchats`, {
        withCredentials: true,
      });
      // console.log({ allChats: data });

      setChats(data || []);
    } catch (err) {
      // console.log(err.message);
      toast({
        title: "Error Occured!!",
        description: "Failed to Load the chats",
        status: "error",
        duration: "4000",
        isClosable: true,
        position: "bottom-left",
      });
    }
  };

  useEffect(() => {
    // console.log("MyChats UseEffect");
    fetchAllChats();
  }, [fetchChatsAgain]);

  useEffect(() => {
    // console.log("useEffect-MyChats-socketUsage");

    const isSocketReady = socket && socket.active && socket.connected;

    if (!isSocketReady || !user?.id) return;

    // Subscribe to all those online users list, with whom i have chatted with (sent after login/setup)
    const allUsersSubscription = socket.subscribe(
      "/user/queue/onlineUsersChattedWith",
      (message) => {
        const usersConnected = JSON.parse(message.body);
        // console.log("/user/queue/onlineUsersChattedWith");
        // console.log({ usersConnected });
        setOnlineUsers(usersConnected);
        // setOnlineUsers(usersConnected.map(String));
      },
    );

    // Subscribe to user online notification
    const userOnlineSubscription = socket.subscribe(
      // "/topic/user/online",
      "/user/queue/online",
      (message) => {
        const userId = message.body;
        // console.log(`user connected ${userId}`);
        setOnlineUsers((prevUsers) => [...prevUsers, userId]);
      },
    );

    // Subscribe to user offline (You need to implement this on backend)
    const userOfflineSubscription = socket.subscribe(
      // "/topic/user/offline",
      "/user/queue/offline",
      (message) => {
        const userId = message.body;
        // console.log(`disconnected user's ${userId}`);
        setOnlineUsers((prevUsers) => prevUsers.filter((id) => id !== userId));
      },
    );

    // Subscribe to refetchChats trigger
    const refetchChatsSubscription = socket.subscribe(
      "/user/queue/refetchChats",
      (message) => {
        const payload = JSON.parse(message.body); // Parse the JSON payload

        // console.log("/user/queue/refetchChats subscription", payload);

        if (payload.deletedChat) {
          // console.log("Deleted Chat received:", payload.deletedChat);
          const deletedChat = payload.deletedChat;

          if (selectedChat.id === deletedChat.id) {
            setSelectedChat({}); // Clear if currently selected
          }

          //Remove notifications(i.e. notification objts.) associated with this deleted chat's Message's
          setNotificationFromBackend((prevNtfs) =>
            prevNtfs.filter((nt) => nt.currMessage.chat.id !== deletedChat.id),
          );

          //Remove currMessages as notifications associated with this deleted chat
          setNotification((prevCurrMessgs) =>
            prevCurrMessgs.filter(
              (currMsg) => currMsg.chat.id !== deletedChat.id,
            ),
          );
        } else if (payload.updatedChat) {
          // console.log("Updated Chat received:", payload.updatedChat);
          const updatedChat = payload.updatedChat;

          // console.log({
          //   updatedChatID: updatedChat.id,
          //   selectedChatID: selectedChat.id,
          // });

          if (selectedChat.id === updatedChat.id) {
            // console.log("setSelectedChat setter method called");
            setSelectedChat(updatedChat); // Replace if currently selected
          }
        }
        setFetchChatsAgain((prev) => !prev);
      },
    );

    //Remove notifications associated with currently deleted message
    const refetchNotificationsSubscription = socket.subscribe(
      "/user/queue/refetchNotifications",
      (message) => {
        const deletedMessagePayload = JSON.parse(message.body);
        // console.log({ deletedMessagePayload });

        setNotification((prevCurrMessgs) =>
          prevCurrMessgs.filter((msg) => msg?.id !== deletedMessagePayload?.id),
        );

        setNotificationFromBackend((prevNtfs) =>
          prevNtfs.filter(
            (ntf) => ntf?.currMessage?.id !== deletedMessagePayload?.id,
          ),
        );
      },
    );

    return () => {
      allUsersSubscription.unsubscribe();
      userOnlineSubscription.unsubscribe();
      userOfflineSubscription.unsubscribe();
      refetchChatsSubscription.unsubscribe();
      refetchNotificationsSubscription.unsubscribe();
    };
  }, [socket, fetchChatsAgain, selectedChat?.id, notification?.length]);

  const getChatName = (loggedUser, users) => {
    return loggedUser.id === users[0].id ? users[1].name : users[0].name;
  };

  function handleGroupChat() {
    setShowGroupChatModal(true);
  }

  function isUserOnline(loggedInUser, users) {
    let otherUserId =
      loggedInUser.id === users[0].id ? users[1].id : users[0].id;

    // console.log({ otherUser: otherUserId, loggedInUser: loggedInUser.id });

    let userOnline = onlineUsers.includes(otherUserId.toString());
    return userOnline;
  }

  function getChatImgUrl(loggedInUser, users) {
    let otherUserId = loggedInUser.id === users[0].id ? users[1] : users[0];

    // console.log(otherUserId);

    return otherUserId?.pic;
  }

  //How many unseen messages which are in notification[] are associated with current chatItem(chat obj.)
  function getNotificationMessgsCountForCurrChat(chatId) {
    return notification.filter((msg) => String(msg.chat?.id) === String(chatId))
      .length;
  }

  async function handleDeleteChat(chatObj) {
    // console.log({ chatObj });

    try {
      const { data } = await Axios.delete(
        `${API_BASE_URL}/api/chat/deletechat`,
        {
          headers: { "Content-Type": "application/json" },
          data: { chatId: chatObj.id },
          withCredentials: true,
        },
      );

      // console.log(data.deletedChatDoc);
      setChats(chats.filter((ct) => ct.id !== data.deletedChatDoc.id));
      //  socket.emit("refetchingChats", data);

      // Clear out chatName or set a flag to help backend identify deletion
      const deletedData = { ...data.deletedChatDoc, chatName: null };

      //💡 'socket' should be the STOMP client you connected during 'onConnect'.
      socket.publish({
        destination: "/app/chat/refetch",
        body: JSON.stringify(deletedData),
      });

      if (selectedChat.id === data.deletedChatDoc.id) {
        setSelectedChat({});
      }

      //Remove notifications(i.e. notification objts.) associated with this deleted chat's Message's
      setNotificationFromBackend((prevNtfs) =>
        prevNtfs.filter(
          (nt) => nt.currMessage.chat.id !== data.deletedChatDoc.id,
        ),
      );

      //Remove currMessages as notifications associated with this deleted chat
      setNotification((prevCurrMessgs) =>
        prevCurrMessgs.filter(
          (currMsg) => currMsg.chat.id !== data.deletedChatDoc.id,
        ),
      );

      toast({
        title: "Chat Successfully Deleted!!",
        description: "Deleted Chat",
        status: "success",
        duration: "4000",
        isClosable: true,
        position: "top-left",
      });
    } catch (err) {
      // console.log(err.message);
      toast({
        title: "Error Occured!!",
        description: "Failed to Delete the chat",
        status: "error",
        duration: "4000",
        isClosable: true,
        position: "bottom-left",
      });
    }
  }

  return (
    <>
      <div className={styles.myChatsContainer}>
        <div className={styles.header}>
          <h2>My Chats</h2>
          <button className={styles.newGroupButton} onClick={handleGroupChat}>
            New Group Chat +
          </button>
        </div>
        <div className={styles.chatList}>
          {chats.length > 0 &&
            chats.map((chat) => {
              return (
                <div
                  key={chat.id}
                  className={`${styles.chatItem} ${
                    selectedChat.id === chat.id ? styles.selecChat : ""
                  }`}
                  onClick={() => {
                    localStorage.removeItem("messages");
                    setSelectedChat(chat);
                  }}
                >
                  <span className={styles.userItem}>
                    {!chat.groupChat ? (
                      <img
                        src={getChatImgUrl(user, chat.users)}
                        alt={"profile pic"}
                        className={styles.avatar}
                      />
                    ) : (
                      <img
                        // src={chat?.groupAdmin?.pic}
                        src={
                          chat?.groupChatPic
                            ? chat?.groupChatPic
                            : chat?.groupAdmin?.pic
                        }
                        alt={"profile pic"}
                        className={styles.avatar}
                      />
                    )}
                    {!chat.groupChat
                      ? getChatName(user, chat.users)
                      : chat.chatName}
                    {!chat.groupChat ? (
                      isUserOnline(user, chat.users) ? (
                        <span className={styles.isOnline}>{"online"}</span>
                      ) : (
                        <span className={styles.isOffline}>{"offline"}</span>
                      )
                    ) : (
                      ""
                    )}
                    {getNotificationMessgsCountForCurrChat(chat.id) > 0 && (
                      <span className={styles.unseenCount}>
                        {getNotificationMessgsCountForCurrChat(chat.id)}
                      </span>
                    )}
                  </span>
                  {chat?.latestMessage?.sender.email ? (
                    <p>
                      {chat.latestMessage.sender.name}:{" "}
                      {!chat.latestMessage.content
                        ? "image sent"
                        : chat.latestMessage.content}
                    </p>
                  ) : (
                    ""
                  )}
                  {!chat.groupChat && (
                    <button
                      className={styles.deleteBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteChat(chat);
                      }}
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  )}
                </div>
              );
            })}
        </div>
      </div>
      {showGroupChatModal && <GroupChatModal onClose={setShowGroupChatModal} />}
    </>
  );
}

export default MyChats;
