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

import { useState } from "react";

import { useToast } from "@chakra-ui/react";

import Axios from "./axiosConfig";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useChatContext } from "../../context/ChatProvider";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const cloudinaryAxios = axios.create({
  withCredentials: false,
});

function SignUp() {
  const [show, setShow] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [image, setImage] = useState(null);
  const [formErrors, setFormErrors] = useState({}); // New state for field errors
  // console.log("SignUp component");

  const toast = useToast();
  const navigate = useNavigate();

  const { setUser, setJwtToken, handleWebSocketConnection } = useChatContext();

  function handleSignUpWithoutPic(data, e, isPic) {
    isPic ? "" : setUploading(true);
    const uploadData = isPic ? { ...data, pic: isPic } : data;
    // console.log({ uploadData });

    Axios.post(
      `${API_BASE_URL}/api/user/register`,
      {
        ...uploadData,
      },
      {
        withCredentials: true, // This option is necessary to include cookies in the request
      },
    )
      .then((res) => {
        // console.log(res);

        const { token, user } = res.data;

        localStorage.setItem("userInfo", JSON.stringify(user));
        // localStorage.setItem("JwtToken", JSON.stringify(token));

        // handleWebSocketConnection(token, user);
        handleWebSocketConnection(user);

        setUser(user);

        toast({
          title: "Success",
          description: "Your account has been created successfully.",
          status: "success",
          duration: 9000,
          isClosable: true,
        });

        setFormErrors({});
        e.target.reset();
        navigate("/chats");
      })
      .catch((err) => {
        // throw new Error("Failed to create the Account !!!");
        // Check for errorMap in the response
        // const errorMap = err?.response?.data?.errorMap;
        const errorMap = err?.response?.data;

        if (errorMap) {
          setFormErrors(errorMap);
        } else {
          toast({
            title: "Sign Up Failed",
            description: "Something went wrong. Please try again.",
            status: "error",
            duration: 9000,
            isClosable: true,
          });
        }
      })
      .finally(() => {
        setUploading(false);
      });
  }

  function handleClick() {
    // console.log("handleClick");
    setShow((sh) => !sh);
  }

  async function uploadImageToCloudinary() {
    const formData = new FormData();
    formData.append("file", image);
    formData.append("upload_preset", "chat-app"); // Use your Cloudinary upload preset
    formData.append("cloud_name", "dizk5mov0");

    const cloud_name = "dizk5mov0";

    try {
      const response = await cloudinaryAxios.post(
        `https://api.cloudinary.com/v1_1/${cloud_name}/image/upload`, // Your Cloudinary endpoint
        formData,
      );

      return response.data.secure_url; // Get the uploaded image URL
    } catch (error) {
      // console.error(
      //   "Cloudinary upload failed:",
      //   error.response?.data || error.message,
      // );
      return null;
    }
  }

  async function submitHandler(e) {
    // console.log("submitHandler");
    e.preventDefault();

    //Logic for extracting the entered data into form fields
    const formData = new FormData(e.currentTarget);

    const data = Object.fromEntries(formData); //here

    // console.log(data);

    // Check if the pic is a valid File object
    if (!(data.pic instanceof File && data.pic?.name)) {
      // console.log("File is not uploaded");
      handleSignUpWithoutPic(data, e, "");
      return;
    }

    setUploading(true);
    const imageUrl = await uploadImageToCloudinary();

    if (!imageUrl) {
      toast({
        title: "Image Upload Failed",
        description: "There was an error uploading your image.",
        status: "error",
        duration: 9000,
        isClosable: true,
      });

      setUploading(false);
      return;
    }

    // console.log(data);
    // console.log("Form Data with Image URL:", { ...data, pic: imageUrl });

    //Connecting to backend (sending the signup details to backend)
    handleSignUpWithoutPic(data, e, imageUrl);
  }

  /*
     The 'VStack' component from Chakra UI stacks its child components vertically with a spacing of 5 units 
     between each item.

     The color="#000" property sets the color of text within the stack to black.
  
  */

  return (
    <form onSubmit={submitHandler}>
      <VStack spacing={5} color="#000">
        <FormControl id="first-name" isRequired isInvalid={!!formErrors.name}>
          <FormLabel>Name</FormLabel>
          <Input placeholder="Enter Your Name" name="name" />
          <FormErrorMessage>{formErrors.name}</FormErrorMessage>
        </FormControl>

        <FormControl id="email" isRequired isInvalid={!!formErrors.email}>
          <FormLabel>Enter your Email</FormLabel>
          <Input type="email" placeholder="Enter Your Email" name="email" />
          <FormErrorMessage>{formErrors.email}</FormErrorMessage>
        </FormControl>

        <FormControl id="password" isRequired isInvalid={!!formErrors.password}>
          <FormLabel>Enter your Password</FormLabel>
          <InputGroup>
            <Input
              type={show ? "text" : "password"}
              placeholder="Enter Your Password"
              name="password"
            />
            <InputRightElement width="4.5rem">
              <Button h="1.75rem" size="sm" onClick={handleClick}>
                {show ? "HIDE" : "SHOW"}
              </Button>
            </InputRightElement>
          </InputGroup>
          <FormErrorMessage>{formErrors.password}</FormErrorMessage>
        </FormControl>

        <FormControl
          id="confirmpassword"
          isRequired
          isInvalid={!!formErrors.confirmpassword}
        >
          <FormLabel>Confirm Password</FormLabel>
          <InputGroup>
            <Input
              type={show ? "text" : "password"}
              placeholder="Confirm Password"
              name="confirmpassword"
            />
            <InputRightElement width="4.5rem">
              <Button h="1.75rem" size="sm" onClick={handleClick}>
                {show ? "HIDE" : "SHOW"}
              </Button>
            </InputRightElement>
          </InputGroup>
          <FormErrorMessage>{formErrors.confirmpassword}</FormErrorMessage>
        </FormControl>

        <FormControl id="pic">
          <FormLabel>Upload Your Picture</FormLabel>
          <Input
            type="file"
            p={1.5}
            accept="image/*"
            name="pic"
            onChange={(e) => setImage(e.target.files[0])}
          />
        </FormControl>

        <Button
          type="submit"
          colorScheme="blue"
          width="100%"
          isLoading={uploading}
          disabled={uploading}
          style={{ marginTop: "15px" }}
        >
          Sign Up
        </Button>
      </VStack>
    </form>
  );
}

export default SignUp;
