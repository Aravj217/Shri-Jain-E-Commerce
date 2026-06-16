
import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Minus } from 'lucide-react';

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'bot';
  time: string;
}

const ChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Hello! Welcome to Shri Jain Stationery Mart. How can I help you today?",
      sender: 'bot',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSendMessage = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim()) return;

    const newMessage: Message = {
      id: Date.now(),
      text: inputValue,
      sender: 'user',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, newMessage]);
    setInputValue('');

    // Simulate bot response
    setTimeout(() => {
      let botResponseText = "Thanks for your message! Our support team will get back to you shortly.";
      
      const lowerInput = newMessage.text.toLowerCase();
      if (lowerInput.includes('order') || lowerInput.includes('track')) {
          botResponseText = "To track your order, please visit the 'My Profile' section. You can find your recent orders and their status there.";
      } else if (lowerInput.includes('return') || lowerInput.includes('refund')) {
          botResponseText = "We accept returns within 7 days of delivery for damaged items. Please contact us at 9414231059 for assistance.";
      } else if (lowerInput.includes('price') || lowerInput.includes('discount')) {
          botResponseText = "We offer great wholesale prices! Use code 'SJSM10' for 10% off your order.";
      }

      const botResponse: Message = {
        id: Date.now() + 1,
        text: botResponseText,
        sender: 'bot',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, botResponse]);
    }, 1000);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      
      {/* Chat Window */}
      {isOpen && (
        <div className="bg-white rounded-lg shadow-2xl border border-neutral-200 w-80 sm:w-96 mb-4 overflow-hidden flex flex-col transition-all duration-300 transform origin-bottom-right h-[500px]">
          {/* Header */}
          <div className="bg-neutral-900 text-white p-4 flex justify-between items-center">
            <div className="flex items-center">
               <div className="relative">
                 <div className="w-2 h-2 bg-green-500 rounded-full absolute bottom-0 right-0 border border-neutral-900"></div>
                 <MessageCircle className="text-amber-400" size={20} />
               </div>
               <div className="ml-3">
                 <h3 className="font-bold text-sm">Customer Support</h3>
                 <span className="text-xs text-neutral-400">Online</span>
               </div>
            </div>
            <div className="flex gap-2">
                 <button onClick={() => setIsOpen(false)} className="hover:bg-neutral-800 p-1 rounded transition-colors">
                    <Minus size={18} />
                 </button>
                 <button onClick={() => setIsOpen(false)} className="hover:bg-neutral-800 p-1 rounded transition-colors">
                    <X size={18} />
                 </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 bg-neutral-50 p-4 overflow-y-auto">
            <div className="space-y-4">
              {messages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
                      msg.sender === 'user' 
                        ? 'bg-amber-500 text-black rounded-tr-none' 
                        : 'bg-white text-neutral-800 border border-neutral-200 rounded-tl-none'
                    }`}
                  >
                    <p>{msg.text}</p>
                    <span className={`text-[10px] block text-right mt-1 opacity-60`}>
                      {msg.time}
                    </span>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input Area */}
          <form onSubmit={handleSendMessage} className="bg-white p-3 border-t border-neutral-200 flex gap-2">
            <input 
              type="text" 
              className="flex-1 border border-neutral-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white text-black"
              placeholder="Type a message..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />
            <button 
              type="submit" 
              className="bg-neutral-900 text-white p-2.5 rounded-full hover:bg-black transition-colors disabled:opacity-50"
              disabled={!inputValue.trim()}
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}

      {/* Toggle Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`shadow-lg transition-all duration-300 flex items-center justify-center ${isOpen ? 'bg-neutral-800 w-12 h-12 rounded-full' : 'bg-amber-500 hover:bg-amber-400 w-14 h-14 rounded-full animate-bounce-slow'}`}
      >
        {isOpen ? (
          <X className="text-white" size={24} />
        ) : (
          <MessageCircle className="text-black" size={28} strokeWidth={2.5} />
        )}
      </button>
    </div>
  );
};

export default ChatWidget;
