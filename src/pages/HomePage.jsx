import {
  Box,
  Container,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";

import Login from "../components/Auth/Login";
import SignUp from "../components/Auth/SignUp";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useChatContext } from "../context/ChatProvider";

function HomePage() {
  console.log("HomePage component");
  const navigate = useNavigate();

  const bgColor = useColorModeValue("green.50", "gray.800");
  const borderColor = useColorModeValue("green.200", "gray.600");
  const { user, authLoading } = useChatContext();

  useEffect(() => {
    if (!authLoading && user?.id) {
      navigate("/chats", { replace: true });
    }
  }, [authLoading, user, navigate]);

  if (authLoading) {
    return <div>Restoring your session...</div>;
  }

  return (
    <div className="App">
      <Container
        maxW={{ base: "100%", sm: "90%", md: "container.md" }}
        py={{ base: 4, sm: 6, md: 10 }}
        px={{ base: 2, sm: 4 }}
        centerContent
      >
        <Box
          w="100%"
          bg={bgColor}
          borderWidth="1px"
          borderColor={borderColor}
          borderRadius="xl"
          p={{ base: 4, sm: 6 }}
          textAlign="center"
          boxShadow="sm"
          mb={6}
        >
          <Text
            fontSize={{ base: "2xl", sm: "3xl", md: "4xl" }}
            fontWeight="bold"
            fontFamily="Work sans"
            color="green.600"
          >
            FREE-CHAT-APP
          </Text>
        </Box>

        <Box
          w="100%"
          bg={bgColor}
          borderWidth="1px"
          borderColor={borderColor}
          borderRadius="xl"
          p={{ base: 4, sm: 6 }}
          boxShadow="sm"
        >
          <Tabs
            variant="soft-rounded"
            colorScheme="green"
            isFitted
            orientation={{ base: "vertical", sm: "horizontal" }}
          >
            <TabList mb={4} flexDirection={{ base: "column", sm: "row" }}>
              <Tab _selected={{ bg: "green.100" }} fontWeight="semibold">
                Login
              </Tab>
              <Tab _selected={{ bg: "green.100" }} fontWeight="semibold">
                Sign Up
              </Tab>
            </TabList>
            <TabPanels>
              <TabPanel>
                <Login />
              </TabPanel>
              <TabPanel>
                <SignUp />
              </TabPanel>
            </TabPanels>
          </Tabs>
        </Box>
      </Container>
    </div>
  );
}

export default HomePage;
