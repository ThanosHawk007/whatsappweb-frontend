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

  const { handleWebSocketConnection, setUser, setJwtToken } = useChatContext();

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/user/me`, {
          withCredentials: true,
        });

        const user = res.data;

        // console.log(`OAuthSuccess user: ${user}`);
        // console.log(typeof user?.pic);

        localStorage.setItem("userInfo", JSON.stringify(user));

        handleWebSocketConnection(user);
        setUser(user);

        toast({
          title: "OAuth Login Success",
          status: "success",
          duration: 4000,
        });

        navigate("/chats");
      } catch (error) {
        // console.error("Failed to fetch user:", error);
        navigate("/login");
      }
    }

    fetchUser();
  }, [location.search, navigate, toast, handleWebSocketConnection]);

  return null;
}

export default OAuthSuccess;
