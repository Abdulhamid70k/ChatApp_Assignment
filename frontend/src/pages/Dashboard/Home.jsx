import React, { useState, useEffect, useRef, useCallback } from "react";
import { Search, Send, X, Hash, Plus, User, Menu, Check, EllipsisVertical, LogOutIcon } from "lucide-react";
import { io } from "socket.io-client";
import { apiCall } from "../../components/api/apiUtils";
import { API_URL } from "../../components/api/secrets";
import { useAuth } from "../../context/AuthContext";

const ChatAppLayout = () => {
  const [socket, setSocket] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [groups, setGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [selectedChat, setSelectedChat] = useState(null);
  const [typingUsers, setTypingUsers] = useState({});
  const [messageStatus, setMessageStatus] = useState(null);
  const [isSocketAuthenticated, setIsSocketAuthenticated] = useState(false);
  const [messagesById, setMessagesById] = useState({});
  const [messages, setMessages] = useState([]);


  const [isLoadingGroups, setIsLoadingGroups] = useState(false);

  const [isMoreOptionsOpen, setIsMoreOptionsOpen] = useState(false);

  const { logout } = useAuth();


 
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await apiCall("/v1/api/users/my-profile");
        if (response.status === "Success") {
          setCurrentUser(response.data);
        }
      } catch (error) {
        console.error("Error fetching current user:", error);
      }
    };
    fetchCurrentUser();
  }, []);

 
  useEffect(() => {
    if (selectedChat) {
      setMessages(messagesById[selectedChat._id] || []);
    } else {
      setMessages([]);
    }
  }, [selectedChat, messagesById]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);


 
  useEffect(() => {
    if (!currentUser) return;

    const socketInstance = io(API_URL);
    setSocket(socketInstance);

    const handleNewMessage = (data) => {
      console.log("Received new message:", data);

      if (data.sender._id !== currentUser?._id) {
        const formattedMessage = {
          _id: data.messageId,
          sender: data.sender,
          message: data.message,
          groupId: data.groupId,
          createdAt: data.createdAt,
        };

        setMessagesById((prev) => ({
          ...prev,
          [data.groupId]: [...(prev[data.groupId] || []), formattedMessage],
        }));

        if (selectedChat?._id === data.groupId) {
          setMessages((prev) => [...prev, formattedMessage]);
        }
      }
    };

    socketInstance.on("authenticated", () => {
      console.log("Socket authenticated");
      setIsSocketAuthenticated(true);
    });

    socketInstance.on("newGroupMessage", handleNewMessage);
    socketInstance.on("userTyping", handleTypingStatus);

    socketInstance.emit("authenticate", { userId: currentUser._id });

    fetchGroups();
    checkMobile();

    return () => {
      socketInstance.off("newGroupMessage", handleNewMessage);
      socketInstance.off("userTyping", handleTypingStatus);
      socketInstance.disconnect();
    };
  }, [currentUser]);

 
  useEffect(() => {
    if (!socket || !isSocketAuthenticated || !selectedChat || !currentUser) return;

    console.log("Joining group:", selectedChat._id);

    setMessages([]);
    setPage(1);
    setHasMore(true);
    setIsLoading(true);

    const handleMessageHistory = ({ messages: historyMessages, hasMore: moreMessages }) => {
      console.log("Received message history:", historyMessages.length);

      const formattedMessages = historyMessages.map((msg) => ({
        _id: msg.messageId || msg._id,
        sender: msg.sender,
        message: msg.message,
        groupId: msg.groupId,
        createdAt: msg.createdAt,
      }));

      setMessagesById((prev) => ({
        ...prev,
        [selectedChat._id]:
          page === 1
            ? formattedMessages
            : [...formattedMessages, ...(prev[selectedChat._id] || [])],
      }));

      setMessages((prev) =>
        page === 1 ? formattedMessages : [...formattedMessages, ...prev]
      );

      setHasMore(moreMessages);
      setIsLoading(false);

    
      if (page === 1) {
        setTimeout(() => {
          scrollToBottom();
        }, 100); 
      }
    };

    const handleJoinedGroup = ({ groupId }) => {
      console.log("Successfully joined group:", groupId);
      if (groupId === selectedChat._id) {
        socket.emit("getGroupMessages", {
          groupId: selectedChat._id,
          page: 1,
          limit: 50,
        });
      }
    };

    socket.on("groupMessageHistory", handleMessageHistory);
    socket.on("joinedGroup", handleJoinedGroup);

    socket.emit("joinGroup", {
      userId: currentUser._id,
      groupId: selectedChat._id,
    });

    return () => {
      socket.off("groupMessageHistory", handleMessageHistory);
      socket.off("joinedGroup", handleJoinedGroup);
    };
  }, [selectedChat, socket, isSocketAuthenticated, currentUser]);

  const handleTypingStatus = ({ userId, groupId, isTyping }) => {
    if (selectedChat && selectedChat._id === groupId) {
      setTypingUsers((prev) => ({
        ...prev,
        [userId]: isTyping ? Date.now() : null,
      }));
    }
  };

  const handleLogOut = () => {
    logout();
  }

  const loadMessages = useCallback((resetPage = true) => {
    if (!selectedChat || !socket || isLoading) return;

    setIsLoading(true);
    const pageToLoad = resetPage ? 1 : page;

    socket.emit("getGroupMessages", {
      groupId: selectedChat._id,
      page: pageToLoad,
      limit: 50,
    });

    if (resetPage) {
      setPage(1);
      setMessagesById((prev) => ({
        ...prev,
        [selectedChat._id]: [],
      }));
      setMessages([]);
    }
  }, [selectedChat, socket, isLoading, page]);

  const handleScroll = () => {
    const container = messagesContainerRef.current;
    if (container.scrollTop === 0 && hasMore && !isLoading) {
      setPage((prev) => prev + 1);
      loadMessages(false);
    }
  };

  const handleLeaveGroup = async (selectedChat) => {
    try {
      const response = await apiCall('/v1/api/group/leave', 'DELETE', { groupId: selectedChat._id });
      if (response.status === "Success") {
        fetchGroups();
        alert(`${selectedChat.name} was left successfully`)
        setSelectedChat(null);
      } else {
        alert(`Couldn't leave the group ${selectedChat.name}, Error ${response.message}`);
      }

      console.log('response ', response);
    } catch (error) {
      fetchGroups();
      console.error('error ', error);
      alert(`Couldn't leave the group ${selectedChat.name}, Error ${error}`);
    }
  }

  const handleDeleteGroup = async (selectedChat) => {
    try {
      const response = await apiCall('/v1/api/group/delete', 'DELETE', { groupId: selectedChat._id })
      if (response.status === "Success") {
        fetchGroups();
        alert(`${selectedChat.name} was deleted successfully`)
        setSelectedChat(null);
      } else {
        alert(`Couldn't Delete the group ${selectedChat.name}, Error ${response.message}`);
      }
    } catch (error) {
      console.error('error ', error);
    }
  }

  const scrollToBottom = () => {
    const container = messagesContainerRef.current;
    if (container) {
      console.log("Scrolling to bottom...");
      container.scrollTop = container.scrollHeight; 
      console.error("Messages container not found");
    }
  };

  const handleSendMessage = () => {
    if (!message.trim() || !selectedChat || !currentUser) return;

    const newMessage = {
      _id: Date.now(),
      sender: currentUser,
      message: message.trim(),
      groupId: selectedChat._id,
      createdAt: new Date().toISOString(),
    };

    setMessagesById((prev) => ({
      ...prev,
      [selectedChat._id]: [...(prev[selectedChat._id] || []), newMessage],
    }));

    setMessages((prev) => [...prev, newMessage]);

    socket.emit("sendGroupMessage", {
      senderId: currentUser._id,
      groupId: selectedChat._id,
      message: message.trim(),
    });

    setTimeout(() => {
      scrollToBottom(); 
    }, 100); 

    setMessage("");
    showMessageStatus("Message sent");
  };

  const handleTyping = (e) => {
    setMessage(e.target.value);
    if (socket && selectedChat) {
      socket.emit("typing", {
        userId: currentUser._id,
        groupId: selectedChat._id,
        isTyping: e.target.value.length > 0,
      });
    }
  };

  const showMessageStatus = (status) => {
    setMessageStatus(status);
    setTimeout(() => setMessageStatus(null), 3000);
  };

  const checkMobile = () => {
    setIsMobile(window.innerWidth < 768);
    if (window.innerWidth >= 768) {
      setIsMobileMenuOpen(false);
    }
  };

  const fetchGroups = async () => {
    setIsLoadingGroups(true);
    try {
      const response = await apiCall("/v1/api/group/my-groups");
      if (response.status === "Success") {
        setGroups(response.data);
      }
    } catch (error) {
      console.error("Error fetching groups:", error);
    } finally {
      setIsLoadingGroups(false);
    }
  };

  const UserAvatar = ({ user, size = "md" }) => {
    const sizeClasses = {
      xs: "w-6 h-6",
      sm: "w-8 h-8",
      md: "w-12 h-12",
      lg: "w-14 h-14",
    };

    return user.avatar ? (
      <img
        src={user.avatar}
        alt={user.name}
        className={`${sizeClasses[size]} rounded-full object-cover ring-2 ring-blue-500/10`}
      />
    ) : (
      <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white ring-2 ring-blue-500/10`}>
        <User className={size === "sm" ? "w-4 h-4" : "w-6 h-6"} />
      </div>
    );
  };

  const Modal = React.memo(({ isOpen, onClose }) => {
    const [groupName, setGroupName] = useState("");
    const [groupDescription, setGroupDescription] = useState("");
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [availableUsers, setAvailableUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const groupNameInputRef = useRef(null);

    useEffect(() => {
      if (isOpen && groupNameInputRef.current) {
        groupNameInputRef.current.focus();
      }
    }, [isOpen]);

    const fetchAvailableUsers = async () => {
      try {
        const response = await apiCall("/v1/api/users/fetch-10-users");
        if (response.status === "Success") {
          const usersWithSelection = response.data.map((user) => ({
            ...user,
            selected: selectedUsers.includes(user._id),
          }));
          setAvailableUsers(usersWithSelection);
        }
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    useEffect(() => {
      if (isOpen) {
        fetchAvailableUsers();
      }
    }, [isOpen]);

    const toggleUserSelection = (userId) => {
      setSelectedUsers((prev) => {
        if (prev.includes(userId)) {
          return prev.filter((id) => id !== userId);
        }
        return [...prev, userId];
      });

      setAvailableUsers((prev) =>
        prev.map((user) =>
          user._id === userId
            ? { ...user, selected: !user.selected }
            : user
        )
      );
    };

    const handleCreateGroup = async () => {
      try {
        const response = await apiCall("/v1/api/group/create", "POST", {
          name: groupName,
          description: groupDescription,
          members: selectedUsers,
        });

        if (response.status === "Success") {
          setGroups((prev) => [...prev, response.data]);
          onClose();
        }
      } catch (error) {
        console.error("Error creating group:", error);
      }
    };

    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Create New Group</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Group Name</label>
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Enter group name"
                className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                ref={groupNameInputRef}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Group Description</label>
              <input
                type="text"
                value={groupDescription}
                onChange={(e) => setGroupDescription(e.target.value)}
                placeholder="Enter group description"
                className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Add Members</label>
              <div className="relative mb-4">
                <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {availableUsers
                  .filter((user) =>
                    user.name.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map((user) => (
                    <div
                      key={user._id}
                      onClick={() => toggleUserSelection(user._id)}
                      className="flex items-center p-3 hover:bg-gray-50 rounded-xl cursor-pointer"
                    >
                      <UserAvatar user={user} size="sm" />
                      <span className="ml-3 flex-1">{user.name}</span>
                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center ${user.selected ? "bg-blue-500 border-blue-500" : "border-gray-300"
                          }`}
                      >
                        {user.selected && <Check className="w-3 h-3 text-white" />}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
            <button
              className="w-full py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleCreateGroup}
              disabled={!groupName.trim() || selectedUsers.length === 0}
            >
              Create Group ({selectedUsers.length} members selected)
            </button>
          </div>
        </div>
      </div>
    );
  });

  const Sidebar = ({ isVisible, onClose }) => (
    <div
      className={`${isMobile
        ? `fixed inset-y-0 left-0 z-30 w-full md:w-80 transform transition-transform duration-300 ease-in-out ${isVisible ? "translate-x-0" : "-translate-x-full"
        }`
        : "w-80"
        } bg-white border-r flex flex-col justify-between`}
    >
      {/* Header  */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <UserAvatar user={currentUser || { name: "Loading...", avatar: null }} size="md" />
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full ring-2 ring-white" />
            </div>
            <div>
              <h2 className="font-semibold">{currentUser?.name || "Loading..."}</h2>
              <p className="text-sm text-gray-500">Online</p>
            </div>
          </div>
          {isMobile && (
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
              <X className="w-6 h-6" />
            </button>
          )}
        </div>

        
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search groups..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="p-2.5 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

     
      <div className="flex-1 overflow-y-auto">
        {isLoadingGroups ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto" />
          </div>
        ) : (
          groups.map((group) => (
            <div
              key={group._id}
              onClick={() => {
                setSelectedChat(group);
                if (isMobile) onClose();
              }}
              className={`p-4 hover:bg-gray-50 cursor-pointer ${selectedChat?._id === group._id ? "bg-blue-50" : ""}`}
            >
              <div className="flex items-center space-x-4">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 w-12 h-12 rounded-full flex items-center justify-center text-white">
                  <Hash className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold truncate">{group.name}</h4>
                  <p className="text-sm text-gray-500">
                    {group.members?.length || 0} members
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t bg-gray-50 flex items-center justify-between">
        <button
          onClick={handleLogOut}
          className="w-full p-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors"
        >
          <LogOutIcon className="w-5 h-5 inline-block mr-2" />
          Log Out
        </button>
      </div>
    </div>
  );


  return (
    <div className="h-screen flex bg-gray-50">
      <Sidebar isVisible={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />

      <div className="flex-1 flex flex-col">
        <div className="h-16 border-b bg-white px-4 md:px-6 flex items-center justify-between">
          {isMobile && (
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 hover:bg-gray-100 rounded-full mr-2"
            >
              <Menu className="w-6 h-6" />
            </button>
          )}
          {selectedChat ? (
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center space-x-4">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 w-12 h-12 rounded-full flex items-center justify-center text-white">
                  <Hash className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold">{selectedChat.name}</h3>
                  <p className="text-sm text-gray-500">
                    {selectedChat.members?.length || 0} members
                  </p>
                </div>
              </div>

              
              <div className="relative">
                <button
                  onClick={() => setIsMoreOptionsOpen(!isMoreOptionsOpen)}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <EllipsisVertical className="w-6 h-6" />
                </button>
                {isMoreOptionsOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border rounded-lg shadow-lg">
                    <button
                      
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => { handleLeaveGroup(selectedChat) }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Leave Group
                    </button>
                    <button
                      onClick={() => { handleDeleteGroup(selectedChat) }}
                      className="block w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-100"
                    >
                      Delete Group
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-gray-500">Select a group to start chatting</div>
          )}
        </div>
        <div
          ref={messagesContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6"
        >
          {isLoading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto" />
            </div>
          ) : messages.length === 0 && selectedChat ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <Hash className="w-12 h-12 mb-4" />
              <p className="text-lg font-medium">No messages yet</p>
              <p className="text-sm">Be the first to send a message in this group!</p>
            </div>
          ) : (
            messages.map((msg, index) => (
              <div
                key={msg._id || index}
                className={`flex ${msg.sender._id === currentUser?._id ? "justify-end" : "justify-start"
                  }`}
              >
                <div className="flex items-end space-x-2 max-w-[85%] md:max-w-[70%]">
                  {msg.sender._id !== currentUser?._id && (
                    <UserAvatar user={msg.sender} size={isMobile ? "xs" : "sm"} />
                  )}
                  <div
                    className={`p-3 md:p-4 rounded-2xl ${msg.sender._id === currentUser?._id
                      ? "bg-blue-500 text-white rounded-br-none"
                      : "bg-white text-gray-800 rounded-bl-none"
                      }`}
                  >
                    <p className="text-sm">{msg.message}</p>
                    <p className="text-xs mt-1 opacity-70">
                      {new Date(msg.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />

          {Object.keys(typingUsers).length > 0 && (
            <div className="text-sm text-gray-500 italic">
              {Object.keys(typingUsers)
                .filter((id) => typingUsers[id] && Date.now() - typingUsers[id] < 5000)
                .map((id) => groups.find((g) => g.members.find((m) => m._id === id))?.name)
                .join(", ")}{" "}
              is typing...
            </div>
          )}
        </div>

        <div className="p-4 bg-white border-t">
          <div className="flex items-center space-x-2 max-w-screen-lg mx-auto">
            <input
              type="text"
              value={message}
              onChange={handleTyping}
              placeholder={selectedChat ? "Type a message..." : "Select a group to start chatting"}
              className="flex-1 p-3 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
              disabled={!selectedChat}
            />
            <button
              onClick={handleSendMessage}
              disabled={!message.trim() || !selectedChat}
              className="p-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

      {isMobile && isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-20"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {messageStatus && (
        <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-gray-800 text-white px-4 py-2 rounded-full text-sm">
            {messageStatus}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatAppLayout;