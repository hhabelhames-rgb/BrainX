import { useEffect, useState, useRef } from "react";
import { conversationsApi, messagesApi } from "../api/api";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";

export default function Messages({ t }) {
  const { user } = useAuth();
  const { socket, joinRoom, leaveRoom, isUserOnline } = useSocket();
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [msg, setMsg] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    conversationsApi.getAll().then(({ data }) => {
      const convs = data.data.conversations || [];
      setConversations(convs);
      if (convs.length > 0) setActiveConv(convs[0]);
    }).catch(console.error);
  }, []);

  useEffect(() => {
    if (activeConv) {
      messagesApi.getByConversation(activeConv._id).then(({ data }) => {
        // paginated() returns { data: [...msgs], pagination: {} }
        // response.data.data is { data: [...], pagination: {} }
        const msgs = Array.isArray(data.data)
          ? data.data
          : Array.isArray(data.data?.data)
          ? data.data.data
          : data.data?.docs || [];
        setMessages(msgs);
      }).catch(console.error);
      joinRoom(activeConv._id);
    }
    return () => {
      if (activeConv) leaveRoom(activeConv._id);
    };
  }, [activeConv, joinRoom, leaveRoom]);

  useEffect(() => {
    if (socket) {
      const handleMsg = (message) => {
        if (activeConv && message.conversation === activeConv._id) {
          if (message.sender._id !== user._id) {
            setMessages((prev) => [...prev, message]);
          }
        }
      };
      socket.on("receive_message", handleMsg);
      return () => socket.off("receive_message", handleMsg);
    }
  }, [socket, activeConv, user._id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!msg.trim() || !activeConv) return;
    try {
      const { data } = await messagesApi.send({
        conversationId: activeConv._id,
        text: msg,
        receiverId: activeConv.otherUser._id,
      });
      setMessages((prev) => [...prev, data.data.message]);
      setMsg("");

      setConversations(prev => {
        const copy = [...prev];
        const idx = copy.findIndex(c => c._id === activeConv._id);
        if (idx !== -1) {
          copy[idx] = { ...copy[idx], lastMessage: data.data.message, lastMessageAt: new Date() };
          const [moved] = copy.splice(idx, 1);
          copy.unshift(moved);
        }
        return copy;
      });
    } catch (err) {
      console.error(err);
    }
  };


  return (
    <div className="bx-content fade-in">
      <div className="msgs-container lift-card">
        <div className="msgs-list">
          <div className="msgs-list-search">
            <span>🔍</span>
            <input placeholder={t.searchMessages} />
          </div>

          <div className="msgs-contacts">
            {conversations.map((c) => {
              const u = c.otherUser || { fullName: t.deletedUser, avatar: "" };
              return (
                <div
                  key={c._id}
                  className={"msgs-contact" + (activeConv?._id === c._id ? " active" : "")}
                  onClick={() => setActiveConv(c)}
                >
                  <div className="msgs-contact-avatar" style={{ overflow: "hidden" }}>
                    {u.avatar ? <img src={u.avatar} alt={u.fullName} style={{ width: '100%', height: '100%', objectFit: 'cover'}} /> : u.fullName.charAt(0)}
                    {u._id && isUserOnline(u._id) && <div className="msgs-online-dot" />}
                  </div>

                  <div className="msgs-contact-info">
                    <div className="msgs-contact-name">{u.fullName}</div>
                    <div className="msgs-contact-preview">{c.lastMessage?.text || t.noMessagesYet}</div>
                  </div>

                  <div className="msgs-contact-time">
                    {c.lastMessageAt ? new Date(c.lastMessageAt).toLocaleDateString() : ""}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {activeConv ? (() => {
          const u = activeConv.otherUser || { fullName: t.deletedUser, avatar: "" };
          return (
          <div className="msgs-chat">
            <div className="msgs-chat-header">
              <div
                className="msgs-contact-avatar"
                style={{
                  width: 36,
                  height: 36,
                  overflow: "hidden",
                }}
              >
                {u.avatar ? <img src={u.avatar} alt={u.fullName} style={{ width: '100%', height: '100%', objectFit: 'cover'}} /> : u.fullName.charAt(0)}
              </div>

              <div>
                <div className="msgs-chat-name">{u.fullName}</div>
                <div className="msgs-chat-status">
                  {u._id && isUserOnline(u._id) ? "● " + t.statusOnline : "● " + t.offline}
                </div>
              </div>

              <div className="msgs-chat-actions">
                <span>📞</span>
                <span>📹</span>
                <span>ℹ️</span>
              </div>
            </div>

            <div className="msgs-chat-body">
              {messages.map((m, i) => {
                const mine = m.sender?._id === user._id || m.sender === user._id;
                return (
                  <div key={m._id || i} className={"msg-row" + (mine ? " mine" : "")}>
                    {!mine && (
                      <div className="msg-avatar" style={{ overflow: "hidden" }}>
                        {u.avatar ? <img src={u.avatar} alt={u.fullName} style={{ width: '100%', height: '100%', objectFit: 'cover'}} /> : u.fullName.charAt(0)}
                      </div>
                    )}

                    <div>
                      <div className="msg-bubble">{m.text}</div>
                      <div className="msg-time">{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <div className="msgs-tip">💡 {t.messageTip}</div>

            <div className="msgs-input-wrap">
              <span>📎</span>
              <input
                className="msgs-input"
                placeholder={t.typeMessage}
                value={msg}
                onChange={(e) => setMsg(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              />
              <span>😊</span>
              <button className="msgs-send-btn" onClick={sendMessage}>
                ➤
              </button>
            </div>
          </div>
          );
        })() : (
          <div className="msgs-chat" style={{ alignItems: 'center', justifyItems: 'center', justifyContent: 'center' }}>
            <p style={{ color: '#94a3b8' }}>{t.selectConversation}</p>
          </div>
        )}
      </div>
    </div>
  );
}