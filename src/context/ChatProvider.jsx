import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
} from "react";

import { Client } from "@stomp/stompjs";

import Axios from "../components/Auth/axiosConfig";

// import SockJS from "sockjs-client";

// const ENDPOINT = "http://localhost:8080/ws"; // Spring Boot endpoint
const ENDPOINT = "https://whatsapp-server-0qfp.onrender.com/ws";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// const ENDPOINT = "wss://scm20.space/ws";

// const ENDPOINT = "wss://whatsapp-server-t4hn.onrender.com/ws"; // ✅ Native WebSocket URL

const ChatContext = createContext();

function ChatProvider({ children }) {
  const [user, setUser] = useState({});
  const [selectedChat, setSelectedChat] = useState({});
  const [chats, setChats] = useState([]);
  const [notification, setNotification] = useState([]);
  const [notificationFromBackend, setNotificationFromBackend] = useState([]);
  const [fetchChatsAgain, setFetchChatsAgain] = useState(false);
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [reconnectSocket, setReconnectSocket] = useState(false);
  const [applyBlueTick, setApplyBlueTick] = useState(false);
  const [refetchMessages, setRefetchMessages] = useState(false);

  // jwtToken: the current access token, held only in React memory for your STOMP connection.
  const [jwtToken, setJwtToken] = useState(null);

  // Do not render protected pages until restoration finishes.
  const [authLoading, setAuthLoading] = useState(true);

  // Keep track of the current STOMP client so we don't
  // accidentally leave multiple WebSocket connections open.
  const socketRef = useRef(null);

  /*
    console.log("ChatProvider Context");
    console.log({ user });
    console.log({ selectedChat });
    console.log({ socket });
    console.log({ onlineUsers });
  */

  const handleWebSocketConnection = useCallback((currUser) => {
    if (!currUser?.id) {
      console.warn("Cannot connect WebSocket: missing user");
      return;
    }

    // Disconnect an older client before creating another.
    if (socketRef.current) {
      void socketRef.current.deactivate();
      socketRef.current = null;
    }

    const stompClient = new Client({
      brokerURL: ENDPOINT, // ✅ Use native WebSocket (no SockJS)

      // No Authorization header is required.
      // Browser automatically sends eligible HttpOnly cookies
      // during the WebSocket HTTP handshake.

      heartbeatIncoming: 0, // ✅ Ping server every 10s
      heartbeatOutgoing: 0, // ✅ Expect server ping every 10s
      reconnectDelay: 5000,

      debug: (message) => {
        // console.log("[STOMP]", message);
      },

      onConnect: (frame) => {
        // console.log("Connected to WebSocket", frame);
        setSocket(stompClient);
      },

      onStompError: (frame) => {
        // console.error("STOMP broker error:", frame.headers);
        // console.error("STOMP error details:", frame.body);
      },

      onWebSocketError: (event) => {
        // console.error("WebSocket transport error:", event);
      },

      onWebSocketClose: (event) => {
        // console.warn("WebSocket closed:", {
        //   code: event.code,
        //   reason: event.reason,
        //   wasClean: event.wasClean,
        // });

        if (socketRef.current === stompClient) {
          setSocket(null);
        }
      },
    });

    socketRef.current = stompClient;
    stompClient.activate();
  }, []);

  // Restore authentication after every full page load.
  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      // Check your existing cached user profile.
      // No cached profile usually means a first-time visitor.
      const cachedUser = localStorage.getItem("userInfo");

      if (!cachedUser) {
        // console.log(
        //   "Inside ChatProvider's useEffect hook's restoreSession() cachedUser invalid",
        // );
        setUser({});
        // setJwtToken(null);
        setAuthLoading(false);
        return; // Don't call '/refresh'
      }

      try {
        const response = await Axios.post(
          `${API_BASE_URL}/api/user/refresh`,
          {},
          { withCredentials: true },
        );

        const { token, user: restoredUser } = response.data;

        if (!token || !restoredUser?.id) {
          throw new Error("Invalid session response");
        }

        if (cancelled) return;

        setUser(restoredUser);

        setSelectedChat({});

        // This is only cached profile data, not authentication proof.
        localStorage.setItem("userInfo", JSON.stringify(restoredUser));

        // Connect only after we have a valid access token.
        // handleWebSocketConnection(token, restoredUser);

        // No JWT argument required anymore.
        handleWebSocketConnection(restoredUser);
      } catch (error) {
        if (cancelled) return;

        // console.log(
        //   "Session restoration failed:",
        //   error.response?.status ?? error.message,
        // );

        setUser(null);

        setSelectedChat({});
        setSocket(null);

        // Remove legacy values from the old authentication design.
        // localStorage.removeItem("JwtToken");
        localStorage.removeItem("userInfo");
      } finally {
        if (!cancelled) {
          setAuthLoading(false);
        }
      }
    }

    restoreSession();

    return () => {
      cancelled = true;

      if (socketRef.current) {
        void socketRef.current.deactivate();
        socketRef.current = null;
      }
    };
  }, [handleWebSocketConnection]);

  return (
    <ChatContext.Provider
      value={{
        user,
        setUser,
        selectedChat,
        setSelectedChat,
        chats,
        setChats,
        notification,
        setNotification,
        fetchChatsAgain,
        setFetchChatsAgain,
        onlineUsers,
        setOnlineUsers,
        socket,
        setSocket,
        notificationFromBackend,
        setNotificationFromBackend,
        reconnectSocket,
        setReconnectSocket,
        applyBlueTick,
        setApplyBlueTick,
        refetchMessages,
        setRefetchMessages,
        jwtToken,
        setJwtToken,
        handleWebSocketConnection,
        authLoading,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useChatContext() {
  const data = useContext(ChatContext);

  if (data === undefined) {
    throw new Error(
      "You are accessing the Context Provider's value object outside its scope !!!",
    );
  }

  return data;
}

export default ChatProvider;
