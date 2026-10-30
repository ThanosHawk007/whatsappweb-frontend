import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "@chakra-ui/react";
import axios from "./axiosConfig";
import { useChatContext } from "../../context/ChatProvider";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function OAuthSuccess() {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  // console.log("OAuthSuccess component rendered");
  // console.log("OAuthSuccess current URL:", window.location.href);

  const { handleWebSocketConnection, setUser, setJwtToken } = useChatContext();

  useEffect(() => {
    async function fetchUser() {
      console.log("OAuthSuccess useEffect executed");

      try {
        const res = await axios.get(`${API_BASE_URL}/api/user/me`, {
          withCredentials: true,
        });

        const user = res.data;

        // console.log("/api/user/me response status:", res.status);
        // console.log("/api/user/me response data:", res.data);

        localStorage.setItem("userInfo", JSON.stringify(user));

        handleWebSocketConnection(user);
        setUser(user);

        toast({
          title: "OAuth Login Success",
          status: "success",
          duration: 4000,
        });

        // console.log("Navigating to /chats");

        navigate("/chats");
      } catch (error) {
        // console.error("Failed to fetch user:", error);
        console.error("OAuthSuccess fetchUser failed:", error);
        console.error("Error response status:", error.response?.status);
        console.error("Error response data:", error.response?.data);
        navigate("/");
      }
    }

    fetchUser();
  }, [location.search, navigate, toast, handleWebSocketConnection]);

  // return null;
  return <div>Completing Google login...</div>;
}

export default OAuthSuccess;
