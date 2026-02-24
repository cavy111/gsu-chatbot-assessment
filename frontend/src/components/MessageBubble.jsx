function MessageBubble({ message }) {
    const isBot = message.from === 'bot';
    return (
        <div style={{
            alignSelf: isBot ? 'flex-start' : 'flex-end',
            backgroundColor: isBot ? '#f1f3f4' : '#1a73e8',
            color: isBot ? '#000' : '#fff',
            padding: '10px 15px',
            borderRadius: '18px',
            maxWidth: '70%',
            fontSize: '15px'
        }}>
            {message.text}
        </div>
    );
}

export default MessageBubble;