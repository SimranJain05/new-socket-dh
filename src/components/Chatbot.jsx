import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  TextField, Button, Box, Paper, Typography, CircularProgress, IconButton
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import ClearIcon from '@mui/icons-material/Clear';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const ChatMessage = React.memo(function ChatMessage({ sender, text }) {
  return (
    <Box
      sx={{
        alignSelf: sender === 'user' ? 'flex-end' : 'flex-start',
        maxWidth: '80%',
        bgcolor: sender === 'user' ? '#e3f2fd' : '#ffffff',
        p: 1.5,
        borderRadius: 2,
        boxShadow: 1,
        wordBreak: 'break-word',
        transition: 'background-color 0.3s ease-in-out',
        '&:hover': {
          bgcolor: sender === 'user' ? '#d0e9ff' : '#f0f0f0',
        },
        '& h1, & h2, & h3, & h4, & h5, & h6': {
          fontWeight: 'bold', marginTop: '1em', marginBottom: '0.5em',
        },
        '& a': {
          color: 'blue', textDecoration: 'underline',
        },
        '& code': {
          fontFamily: 'monospace', backgroundColor: '#f0f0f0',
          padding: '2px 4px', borderRadius: '4px',
        },
        '& pre': {
          backgroundColor: '#e0e0e0', padding: '10px',
          borderRadius: '4px', overflowX: 'auto', whiteSpace: 'pre-wrap',
        },
        '& strong': { fontWeight: 'bold' },
        '& em': { fontStyle: 'italic' },
        '& ul, & ol': { paddingLeft: '20px', margin: '0.5em 0' },
        '& li': { marginBottom: '0.25em' }
      }}
    >
      <Typography component="div" variant="body2" color="text.primary">
        <strong>{sender === 'user' ? 'You' : 'AI'}:</strong>{' '}
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
      </Typography>
    </Box>
  );
});

function Chatbot() {
  const [messages, setMessages] = useState([
    { sender: 'ai', text: 'Hello! I am your AI assistant. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleClearChat = useCallback(() => {
    setMessages([{ sender: 'ai', text: 'Hello! I am your AI assistant. How can I help you today?' }]);
    setInput('');
    setIsLoading(false);
  }, []);

  const handleSendMessage = useCallback(async () => {
    if (input.trim() === '') return;
    const userMessageText = input.trim();
    const newUserMessage = { sender: 'user', text: userMessageText };

    setMessages(prev => [...prev, newUserMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const chatHistory = messages.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
      })).concat({ role: 'user', parts: [{ text: userMessageText }] });

      const apiKey = "AIzaSyDkqRYXJLa_gs48b1rBHgK4xU6TTOkb1oI";
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: chatHistory })
      });

      if (!response.ok) {
        let errBody = {};
        try { errBody = await response.json(); } catch { errBody = { message: await response.text() }; }
        throw new Error(`API failed: ${response.status} ${JSON.stringify(errBody)}`);
      }

      const result = await response.json();
      let aiResponseText = result?.candidates?.[0]?.content?.parts?.[0]?.text ||
        `AI couldn't respond: ${result?.promptFeedback?.blockReason || 'Unknown reason'}`;

      setMessages(prev => [...prev, { sender: 'ai', text: aiResponseText }]);

    } catch (error) {
      setMessages(prev => [...prev, {
        sender: 'ai',
        text: `Oops! Something went wrong: ${error.message || 'Unknown error'}`
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [input, messages]);

  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && !isLoading) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [isLoading, handleSendMessage]);

  const renderedMessages = useMemo(() =>
    messages.map((msg, i) => <ChatMessage key={i} sender={msg.sender} text={msg.text} />),
    [messages]
  );

  return (
    <Paper elevation={3} sx={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', borderRadius: 2 }}>
      <Box sx={{ p: 1.5, bgcolor: 'primary.main', color: 'white', display: 'flex', justifyContent: 'space-between' }}>
        <Typography variant="subtitle1" fontWeight="bold">AI Assistant</Typography>
        <IconButton onClick={handleClearChat} color="inherit" size="small"><ClearIcon fontSize="small" /></IconButton>
      </Box>

      <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2, display: 'flex', flexDirection: 'column', gap: 1.5, bgcolor: '#fafafa' }}>
        {renderedMessages}
        {isLoading && (
          <Box sx={{ alignSelf: 'flex-start', maxWidth: '80%', bgcolor: '#ffffff', p: 1.5, borderRadius: 2, boxShadow: 1, display: 'flex', gap: 1 }}>
            <CircularProgress size={20} color="primary" />
            <Typography variant="body2" color="text.secondary">AI is typing...</Typography>
          </Box>
        )}
        <div ref={messagesEndRef} />
      </Box>

      <Box sx={{ p: 1.5, borderTop: '1px solid #e0e0e0', display: 'flex', gap: 1, bgcolor: '#ffffff' }}>
        <TextField
          fullWidth
          multiline
          maxRows={4}
          variant="outlined"
          size="small"
          placeholder="Message AI Assistant..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={isLoading}
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, pr: '4px' } }}
        />
        <Button
          variant="contained"
          color="primary"
          onClick={handleSendMessage}
          disabled={isLoading || input.trim() === ''}
          sx={{ minWidth: 'auto', p: '10px', borderRadius: 2, boxShadow: 'none' }}
        >
          <SendIcon />
        </Button>
      </Box>
    </Paper>
  );
}

export default React.memo(Chatbot);
