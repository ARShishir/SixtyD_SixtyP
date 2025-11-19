document.addEventListener('DOMContentLoaded', function() {
    const chatMessages = document.getElementById('chatMessages');
    const chatInput = document.getElementById('chatInput');
    const sendBtn = document.getElementById('sendBtn');
    
    // Initial bot messages to simulate a conversation
    const initialMessages = [
        { text: "Hello! How can I assist you today?", sender: "bot", delay: 1000 },
        { text: "I'm here to help with any questions you might have.", sender: "bot", delay: 3000 }
    ];
    
    // Possible bot responses
    const botResponses = [
        "That's interesting. Tell me more about that.",
        "I understand. How can I help further?",
        "Thanks for sharing! Is there anything specific you'd like to know?",
        "I see. Let me know if you need assistance with anything else.",
        "Great question! Let me think about that for a moment.",
        "I'm not sure I understand completely. Could you elaborate?",
        "That's a good point. What are your thoughts on this?",
        "I'm here to help. What else would you like to discuss?"
    ];
    
    // Initialize chat with bot messages
    setTimeout(() => {
        initialMessages.forEach(msg => {
            setTimeout(() => {
                addMessage(msg.text, msg.sender);
            }, msg.delay);
        });
    }, 500);
    
    // Send message when clicking send button
    sendBtn.addEventListener('click', sendMessage);
    
    // Send message when pressing Enter key
    chatInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
    
    function sendMessage() {
        const messageText = chatInput.value.trim();
        
        if (messageText) {
            // Add user message
            addMessage(messageText, 'user');
            chatInput.value = '';
            
            // Show typing indicator
            showTypingIndicator();
            
            // Simulate bot thinking and response
            setTimeout(() => {
                // Remove typing indicator
                removeTypingIndicator();
                
                // Generate random bot response
                const randomResponse = botResponses[Math.floor(Math.random() * botResponses.length)];
                
                // Add bot response with slight delay
                setTimeout(() => {
                    addMessage(randomResponse, 'bot');
                }, 500);
            }, 1500 + Math.random() * 2000); // Random delay between 1.5-3.5 seconds
        }
    }
    
    function addMessage(text, sender) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message');
        messageElement.classList.add(sender === 'user' ? 'sent' : 'received');
        
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        messageElement.innerHTML = `
            <div class="message-text">${text}</div>
            <div class="message-time">${time}</div>
        `;
        
        chatMessages.appendChild(messageElement);
        scrollToBottom();
        //Author : Abdur Rahaman Shishir 
        // Add animation class
        messageElement.style.animation = 'fadeIn 0.3s ease-out';
    }
    
    function showTypingIndicator() {
        const typingElement = document.createElement('div');
        typingElement.classList.add('typing-indicator');
        typingElement.id = 'typingIndicator';
        
        typingElement.innerHTML = `
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
        `;
        
        chatMessages.appendChild(typingElement);
        scrollToBottom();
    }
    
    function removeTypingIndicator() {
        const typingIndicator = document.getElementById('typingIndicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }
    
    function scrollToBottom() {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    // Simulate additional bot messages after some time of inactivity
    setTimeout(() => {
        if (chatMessages.children.length <= initialMessages.length + 1) {
            addMessage("Is there anything else I can help with?", "bot");
        }
    }, 15000);
});