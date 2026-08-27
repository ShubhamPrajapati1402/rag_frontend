import { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Bot, User } from 'lucide-react';
import './ChatInterface.css';

export default function ChatInterface() {
  const [messages, setMessages] = useState([
    { id: 1, type: 'ai', content: 'Hello! I am your Enterprise RAG Assistant. I have access to all your uploaded documents. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { id: Date.now(), type: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate AI Response
    setTimeout(() => {
      const aiMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: 'Based on your documents, I have extracted the relevant information. This is a simulated response demonstrating the UI.'
      };
      setMessages((prev) => [...prev, aiMessage]);
      setIsTyping(false);
    }, 2000);
  };

  return (
    <div className="chat-container animate-fade-in">
      <div className="chat-header glass-panel">
        <div className="chat-title">
          <h2>Current Session</h2>
          <span className="status-badge">
            <span className="status-dot"></span> Online
          </span>
        </div>
      </div>

      <div className="chat-messages">
        {messages.map((msg) => (
          <div key={msg.id} className={`message-wrapper ${msg.type}`}>
            <div className="message-avatar">
              {msg.type === 'ai' ? <Bot size={20} /> : <User size={20} />}
            </div>
            <div className="message-content glass-panel">
              <p>{msg.content}</p>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="message-wrapper ai">
            <div className="message-avatar">
              <Bot size={20} />
            </div>
            <div className="message-content glass-panel typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-wrapper glass-panel">
        <form className="chat-input-form" onSubmit={handleSend}>
          <button type="button" className="attach-btn" title="Attach Document">
            <Paperclip size={20} />
          </button>
          <input
            type="text"
            placeholder="Ask a question about your documents..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button type="submit" className="send-btn" disabled={!input.trim()}>
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
}
