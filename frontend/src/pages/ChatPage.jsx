import { useState,useEffect, useRef } from 'react';
import api from '../api/axios';
import MessageBubble from '../components/MessageBubble';

function ChatPage() {
    const [messages, setMessages] = useState([
        { from: 'bot', text: 'Hi! I am GSU SmartAssist. How can I help you today?' }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const bottomRef = useRef(null);

    // generate a simple session id once per page load
    const sessionId = useState(() => 'session-' + Date.now())[0];

    // scroll to bottom whenever messages change
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, loading]);

    const sendMessage = async () => {
        if (!input.trim()) return;

        const userMessage = { from: 'user', text: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setLoading(true);

        try {
            const res = await api.post('/chat/', {
                message: input,
                session_id: sessionId
            });

            const botMessage = { from: 'bot', text: res.data.response };
            setMessages(prev => [...prev, botMessage]);
        } catch (err) {
            const errorMessage = {
                from: 'bot',
                text: err.response?.status === 429
                    ? 'You are sending messages too fast. Please wait a moment.'
                    : 'Something went wrong. Please try again.'
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') sendMessage();
    };

    return (
        <div style={styles.container}>
            <div style={styles.chatWindow}>
                {messages.map((msg, i) => (
                    <MessageBubble key={i} message={msg} />
                ))}
                {loading && <MessageBubble message={{ from: 'bot', text: 'Typing...' }} />}
                {/* invisible div at the bottom that we scroll to */}
                <div ref={bottomRef} />
            </div>
            <div style={styles.inputArea}>
                <input
                    style={styles.input}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask me anything about GSU..."
                />
                <button style={styles.button} onClick={sendMessage}>Send</button>
            </div>
        </div>
    );
}

const styles = {
    container: { display: 'flex', flexDirection: 'column', height: '90vh', maxWidth: '700px', margin: '0 auto', padding: '20px' },
    chatWindow: { flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', paddingBottom: '10px' },
    inputArea: { display: 'flex', gap: '10px' },
    input: { flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '16px' },
    button: { padding: '10px 20px', backgroundColor: '#1a73e8', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '16px' }
};

export default ChatPage;