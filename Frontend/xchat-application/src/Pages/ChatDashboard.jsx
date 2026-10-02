import axios from "axios";
import { io } from "socket.io-client";
import { useContext, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import UserContext from "../context/UserContext";

function getInitials(username = "") {
    return username.trim().slice(0, 2).toUpperCase() || "?";
}

function formatTime(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat(undefined, {
        hour: "numeric",
        minute: "2-digit"
    }).format(date);
}

function appendChat(chats, incomingChat) {
    if (chats.some((chat) => String(chat._id) === String(incomingChat._id))) return chats;
    return [...chats, incomingChat].sort((first, second) =>
        new Date(first.atTime).getTime() - new Date(second.atTime).getTime()
    );
}

function sortContacts(contacts) {
    return [...contacts].sort((first, second) => {
        const firstTime = first.lastMessageAt ? new Date(first.lastMessageAt).getTime() : 0;
        const secondTime = second.lastMessageAt ? new Date(second.lastMessageAt).getTime() : 0;
        return secondTime - firstTime || first.username.localeCompare(second.username);
    });
}

function ChatDashboard() {
    const { user: currentUser, setUser } = useContext(UserContext);
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [onlineUsers, setOnlineUsers] = useState(() => new Set());
    const [selectedUser, setSelectedUser] = useState(null);
    const [chats, setChats] = useState([]);
    const [search, setSearch] = useState("");
    const [usersLoading, setUsersLoading] = useState(true);
    const [chatsLoading, setChatsLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [sending, setSending] = useState(false);
    const [loggingOut, setLoggingOut] = useState(false);
    const [socketConnected, setSocketConnected] = useState(false);
    const socketRef = useRef(null);
    const messagesEndRef = useRef(null);
    const selectedUserIdRef = useRef(null);

    useEffect(() => {
        if (!currentUser?._id) return undefined;

        const socket = io("http://localhost:5000", { withCredentials: true });
        socketRef.current = socket;
        socket.on("connect", () => setSocketConnected(true));
        socket.on("disconnect", () => setSocketConnected(false));
        socket.on("presence:list", (userIds) => {
            setOnlineUsers(new Set(userIds.map(String)));
        });
        socket.on("presence:changed", ({ userId, online }) => {
            setOnlineUsers((previousUsers) => {
                const nextUsers = new Set(previousUsers);
                if (online) nextUsers.add(String(userId));
                else nextUsers.delete(String(userId));
                return nextUsers;
            });
        });
        socket.on("connect_error", (error) => {
            setSocketConnected(false);
            if (error.message === "Unauthorized") {
                toast.error("Your session expired. Please log in again.");
            }
        });
        socket.on("chat:message", (incomingChat) => {
            const activeContactId = selectedUserIdRef.current;

            const currentUserId = String(currentUser._id);
            const otherUserId = String(incomingChat.from) === currentUserId
                ? String(incomingChat.to)
                : String(incomingChat.from);
            const isIncoming = String(incomingChat.to) === currentUserId;
            const conversationIsOpen = Boolean(activeContactId) && otherUserId === String(activeContactId);

            setUsers((previousUsers) => sortContacts(previousUsers.map((person) => {
                if (String(person._id) !== otherUserId) return person;
                return {
                    ...person,
                    lastMessage: incomingChat.message,
                    lastMessageAt: incomingChat.atTime,
                    lastMessageFromMe: !isIncoming,
                    unreadCount: isIncoming
                        ? conversationIsOpen ? 0 : (person.unreadCount || 0) + 1
                        : person.unreadCount || 0
                };
            })));

            if (conversationIsOpen) {
                setChats((previousChats) => appendChat(previousChats, incomingChat));
                if (isIncoming) socket.emit("chat:read", { senderId: String(incomingChat.from) });
            }
        });
        socket.on("chat:read", ({ senderId }) => {
            setUsers((previousUsers) => previousUsers.map((person) =>
                String(person._id) === String(senderId) ? { ...person, unreadCount: 0 } : person
            ));
        });

        return () => {
            socket.disconnect();
            socketRef.current = null;
            setSocketConnected(false);
        };
    }, [currentUser?._id]);

    useEffect(() => {
        const loadUsers = async () => {
            setUsersLoading(true);
            try {
                const response = await axios.get("http://localhost:5000/user/getall", {
                    withCredentials: true
                });
                setUsers(sortContacts((response.data.users || []).filter((person) =>
                    String(person._id) !== String(currentUser?._id)
                )));
            } catch (error) {
                toast.error(error.response?.data?.message || "Could not load your contacts");
            } finally {
                setUsersLoading(false);
            }
        };

        loadUsers();
    }, [currentUser?._id]);

    useEffect(() => {
        if (!selectedUser?._id) return undefined;

        const controller = new AbortController();
        const loadChats = async () => {
            setChats([]);
            setChatsLoading(true);
            try {
                const response = await axios.get(`http://localhost:5000/user/chat/${selectedUser._id}`, {
                    withCredentials: true,
                    signal: controller.signal
                });
                setChats((currentChats) =>
                    (response.data.chats || []).reduce(appendChat, currentChats)
                );
            } catch (error) {
                if (!controller.signal.aborted) {
                    toast.error(error.response?.data?.message || "Could not load this conversation");
                }
            } finally {
                if (!controller.signal.aborted) setChatsLoading(false);
            }
        };

        loadChats();
        return () => controller.abort();
    }, [selectedUser?._id]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chats]);

    const visibleUsers = users.filter((person) =>
        `${person.username || ""} ${person.email || ""}`.toLowerCase().includes(search.toLowerCase())
    );

    const selectUser = (person) => {
        selectedUserIdRef.current = person._id;
        setSelectedUser(person);
        setChats([]);
        setMessage("");
        setUsers((previousUsers) => previousUsers.map((user) =>
            String(user._id) === String(person._id) ? { ...user, unreadCount: 0 } : user
        ));
        socketRef.current?.emit("chat:read", { senderId: String(person._id) });
    };

    const sendMessage = async (event) => {
        event.preventDefault();
        const text = message.trim();
        const recipientId = selectedUser?._id;
        const socket = socketRef.current;
        if (!text || !recipientId || sending || chatsLoading) return;
        if (!socket?.connected) {
            toast.error("Waiting for the real-time connection. Try again in a moment.");
            return;
        }

        setSending(true);
        socket.timeout(10000).emit("chat:send", { recipientId, message: text }, (timeoutError, response) => {
            setSending(false);
            if (timeoutError) {
                toast.error("The server did not respond. Your message was not confirmed.");
                return;
            }
            if (!response?.ok) {
                toast.error(response?.message || "Message could not be sent");
                return;
            }
            if (selectedUserIdRef.current === recipientId) {
                setChats((previousChats) => appendChat(previousChats, response.chat));
                setMessage("");
            }
        });
    };

    const logout = async () => {
        setLoggingOut(true);
        try {
            await axios.post("http://localhost:5000/user/logout", {}, { withCredentials: true });
            setUser(null);
            navigate("/", { replace: true });
            toast.success("You are logged out");
        } catch (error) {
            toast.error(error.response?.data?.message || "Could not log out. Please try again.");
        } finally {
            setLoggingOut(false);
        }
    };

    return (
        <main className={`chat-app${selectedUser ? " has-selection" : ""}`}>
            <aside className="chat-sidebar">
                <header className="sidebar-header">
                    <div className="brand-mark" aria-hidden="true">X</div>
                    <div className="brand-copy">
                        <span className="brand-name">XChat</span>
                        <span className="brand-caption">Your conversations</span>
                    </div>
                    <div className="account-actions">
                        <div className="account-avatar" title={currentUser?.username || "Your account"}>
                            {getInitials(currentUser?.username)}
                        </div>
                        <button className="logout-button" type="button" onClick={logout} disabled={loggingOut}>
                            {loggingOut ? "Signing out..." : "Log out"}
                        </button>
                    </div>
                </header>

                <div className="contacts-heading">
                    <div>
                        <p className="eyebrow">MESSAGES</p>
                        <h1>People</h1>
                    </div>
                    <span className="contact-count">{users.length}</span>
                </div>

                <label className="contact-search">
                    <span className="visually-hidden">Search people</span>
                    <input
                        type="search"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search people"
                    />
                </label>

                <div className="contact-list" aria-label="Available people">
                    {usersLoading && <p className="list-message">Finding your people...</p>}
                    {!usersLoading && visibleUsers.length === 0 && (
                        <p className="list-message">{search ? "No matches found" : "No other users yet"}</p>
                    )}
                    {!usersLoading && visibleUsers.map((person, index) => {
                        const isOnline = onlineUsers.has(String(person._id));
                        const unreadCount = person.unreadCount || 0;
                        const preview = person.lastMessage
                            ? `${person.lastMessageFromMe ? "You: " : ""}${person.lastMessage}`
                            : person.email || "Start a conversation";

                        return (
                            <button
                                className={`contact-row${selectedUser?._id === person._id ? " is-active" : ""}${unreadCount ? " has-unread" : ""}`}
                                key={person._id}
                                type="button"
                                onClick={() => selectUser(person)}
                                aria-pressed={selectedUser?._id === person._id}
                            >
                                <span className="contact-avatar-wrap">
                                    <span className={`contact-avatar avatar-tone-${index % 5}`} aria-hidden="true">
                                        {getInitials(person.username)}
                                    </span>
                                    <span className={`presence-dot${isOnline ? " is-online" : ""}`} title={isOnline ? "Online" : "Offline"} />
                                </span>
                                <span className="contact-details">
                                    <span className="contact-name-line">
                                        <span className="contact-name">{person.username}</span>
                                        {person.lastMessageAt && <time className="contact-time">{formatTime(person.lastMessageAt)}</time>}
                                    </span>
                                    <span className="contact-preview-line">
                                        <span className="contact-preview">{preview}</span>
                                        {unreadCount > 0 && (
                                            <span className="unread-count" aria-label={`${unreadCount} unread messages`}>
                                                {unreadCount > 99 ? "99+" : unreadCount}
                                            </span>
                                        )}
                                    </span>
                                </span>
                            </button>
                        );
                    })}
                </div>
                <footer className="sidebar-footer">Signed in as <strong>{currentUser?.username || "you"}</strong></footer>
            </aside>

            <section className="conversation-panel" aria-label="Conversation">
                {selectedUser ? (
                    <>
                        <header className="conversation-header">
                            <button className="mobile-back" type="button" onClick={() => {
                                selectedUserIdRef.current = null;
                                setSelectedUser(null);
                                setChats([]);
                            }}>
                                Back to people
                            </button>
                            <span className="conversation-avatar">{getInitials(selectedUser.username)}</span>
                            <div className="conversation-person">
                                <h2>{selectedUser.username}</h2>
                                <p className={`presence-line${onlineUsers.has(String(selectedUser._id)) ? " is-online" : ""}`}>
                                    <span className={`presence-dot${onlineUsers.has(String(selectedUser._id)) ? " is-online" : ""}`} />
                                    {onlineUsers.has(String(selectedUser._id)) ? "Online" : "Offline"}
                                </p>
                            </div>
                           </header>

                        <div className="message-area" aria-live="polite">
                            <div className="conversation-intro">
                                <span className="intro-avatar">{getInitials(selectedUser.username)}</span>
                                <h3>{selectedUser.username}</h3>
                                <p>This is the beginning of your conversation.</p>
                            </div>

                            {chatsLoading && <p className="message-status">Loading messages...</p>}
                            {!chatsLoading && chats.length === 0 && (
                                <p className="message-status">No messages here yet.</p>
                            )}
                            {!chatsLoading && chats.map((chat) => {
                                const isMine = String(chat.from) === String(currentUser?._id);
                                return (
                                    <article className={`message-row${isMine ? " is-mine" : ""}`} key={chat._id}>
                                        <div className="message-bubble">
                                            <p>{chat.message}</p>
                                            <time dateTime={chat.atTime}>{formatTime(chat.atTime)}</time>
                                        </div>
                                    </article>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>
                        <form className="message-composer" onSubmit={sendMessage}>
                            <label className="visually-hidden" htmlFor="message-input">Write a message</label>
                            <textarea
                                id="message-input"
                                value={message}
                                onChange={(event) => setMessage(event.target.value)}
                                onKeyDown={(event) => {
                                    if (event.key === "Enter" && !event.shiftKey) {
                                        event.preventDefault();
                                        event.currentTarget.form?.requestSubmit();
                                    }
                                }}
                                placeholder={`Message ${selectedUser.username}...`}
                                maxLength={4000}
                                rows={1}
                                disabled={chatsLoading || sending || !socketConnected}
                            />
                            <button
                                className="message-send"
                                type="submit"
                                disabled={!message.trim() || chatsLoading || sending || !socketConnected}
                            >
                                {sending ? "Sending..." : "Send"}
                            </button>
                        </form>
                    </>
                ) : (
                    <div className="conversation-empty">
                        <div className="empty-art" aria-hidden="true">
                            <span className="empty-orbit orbit-one" />
                            <span className="empty-orbit orbit-two" />
                            <span className="empty-chat-mark">x</span>
                        </div>
                        <p className="eyebrow">A LITTLE SPACE TO TALK</p>
                        <h2>Your chats, in one place.</h2>
                        <p>Choose someone from your people list to open your conversation.</p>
                    </div>
                )}
            </section>
        </main>
    )
}

export default ChatDashboard;