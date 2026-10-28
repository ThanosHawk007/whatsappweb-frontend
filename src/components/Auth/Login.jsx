import { useEffect, useState } from "react";
import {
  Button,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Input,
  InputGroup,
  InputRightElement,
  VStack,
} from "@chakra-ui/react";

import { useToast } from "@chakra-ui/react";
import Axios from "./axiosConfig";
import { useNavigate } from "react-router-dom";
import { useChatContext } from "../../context/ChatProvider";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function Login() {
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const toast = useToast();

  const { setUser, setJwtToken, handleWebSocketConnection } = useChatContext();
  const navigate = useNavigate();

  function handleClick() {
    setShow((sh) => !sh);
  }

  function submitHandler(e) {
    e.preventDefault();

    setEmailError("");
    setPasswordError("");

    //Logic for extracting the entered data into form fields
    const formData = new FormData(e.currentTarget);

    //data variable, then will contain an object having the collected input field's data.
    const data = Object.fromEntries(formData);

    // console.log({ data });

    setLoading(true);

    //Logic to send Login Details to the backend
    Axios.post(`${API_BASE_URL}/api/user/login`, data, {
      withCredentials: true, // This option is necessary to include cookies in the request
    })
      .then((res) => {
        const { token, user } = res.data;

        localStorage.setItem("userInfo", JSON.stringify(user));

        toast({
          title: "Success",
          description: "Login Successful",
          status: "success",
          duration: 4000,
          isClosable: true,
        });

        // handleWebSocketConnection(token, user);
        handleWebSocketConnection(user);
        setUser(user);
        setLoading(false);

        navigate("/chats");
      })
      .catch((error) => {
        // console.log("LOGIN ERROR:", error);
        // console.log("STATUS:", error.response?.status);
        // console.log("RESPONSE:", error.response?.data);

        const message =
          error.response?.data?.statusMsg || "Something went wrong";

        if (message === "Invalid Email") {
          setEmailError(message);
        } else if (message === "Invalid Password") {
          setPasswordError(message);
        } else {
          toast({
            title: "Login Failed",
            description: message || "Something went wrong",
            status: "error",
            duration: 4000,
            isClosable: true,
          });
        }

        setLoading(false);
      });
  }

  function handleGuest(e) {
    e.preventDefault();

    setEmailError("");
    setPasswordError("");

    const guestDetails = {
      email: "admin@eazyschool.com",
      password: "admin",
    };

    setLoading(true);

    Axios.post(`${API_BASE_URL}/api/user/guest`, guestDetails, {
      withCredentials: true,
    })
      .then((res) => {
        const { token, user } = res.data;

        localStorage.setItem("userInfo", JSON.stringify(user));

        toast({
          title: "Guest Login Success",
          status: "success",
          duration: 4000,
          isClosable: true,
        });

        handleWebSocketConnection(user);
        setUser(user);

        setLoading(false);

        navigate("/chats");
      })
      .catch(() => {
        toast({
          title: "Guest Login Failed",
          status: "error",
          duration: 4000,
          isClosable: true,
        });
        setLoading(false);
      });
  }

  // 🔥 NEW: OAuth handlers
  function handleGoogleLogin() {
    window.location.href = `${API_BASE_URL}/oauth2/authorization/google`;
  }

  function handleGithubLogin() {
    window.location.href = `${API_BASE_URL}/oauth2/authorization/github`;
  }

  return (
    <form onSubmit={submitHandler}>
      <VStack spacing={5} color="#000">
        {/* Email Login */}
        <FormControl id="email" isRequired isInvalid={!!emailError}>
          <FormLabel>Enter your Email</FormLabel>

          <Input type="email" placeholder="Enter Your Email" name="email" />

          {emailError && <FormErrorMessage>{emailError}</FormErrorMessage>}
        </FormControl>

        <FormControl id="password" isRequired isInvalid={!!passwordError}>
          <FormLabel>Enter your Password</FormLabel>

          <InputGroup>
            <Input
              type={show ? "text" : "password"}
              placeholder="Enter Your password"
              name="password"
            />

            <InputRightElement>
              <Button type="button" size="sm" onClick={handleClick}>
                {show ? "HIDE" : "SHOW"}
              </Button>
            </InputRightElement>
          </InputGroup>

          {passwordError && (
            <FormErrorMessage>{passwordError}</FormErrorMessage>
          )}
        </FormControl>

        <Button
          type="submit"
          colorScheme="blue"
          width="100%"
          isLoading={loading}
        >
          Login
        </Button>

        <Button
          colorScheme="red"
          width="100%"
          isLoading={loading}
          onClick={handleGuest}
        >
          Guest Login
        </Button>

        {/* 🔥 NEW OAuth Buttons */}
        <Button colorScheme="teal" width="100%" onClick={handleGoogleLogin}>
          Login with Google
        </Button>

        <Button colorScheme="gray" width="100%" onClick={handleGithubLogin}>
          Login with GitHub
        </Button>
      </VStack>
    </form>
  );
}

export default Login;
