import React, { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const ChatContext = createContext();

// It is going to wrap whole of our app. It is going to be the children which is whole of our app
const ChatProvider = ({ children }) => {
    const [selectedChat, setSelectedChat] = useState();
    const [user, setUser] = useState();
    const [notification, setNotification] = useState([]);
    const [chats, setChats] = useState();

    const navigate = useNavigate();

    useEffect(() => {
        const userInfo = JSON.parse(localStorage.getItem("userInfo"));
        setUser(userInfo);

        if (!userInfo) navigate("/");
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [navigate]);
    return (
        <ChatContext.Provider 
        value={{
            selectedChat,
            setSelectedChat,
            user,
            setUser,
            notification,
            setNotification,
            chats,
            setChats,
          }}>
            {children}
        </ChatContext.Provider>
    )
}

// To make state accessible to other parts of our app.
// We will use useContext hook

export const ChatState = () => {
    return useContext(ChatContext);
}
export default ChatProvider;