import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { FaRobot, FaPaperPlane, FaSpinner, FaPaperclip, FaTimes, FaFilePdf, FaImage, FaTrash, FaPlus, FaKey } from 'react-icons/fa';
import toast from 'react-hot-toast';

const AIChatPanel = ({ courseId, courseTitle }) => {
    const [hasConfig, setHasConfig] = useState(null);
    const [conversations, setConversations] = useState([]);
    const [activeConvo, setActiveConvo] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [file, setFile] = useState(null);
    const [sending, setSending] = useState(false);
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);

    useEffect(() => { checkConfig(); }, []);
    useEffect(() => { if (hasConfig) loadConversations(); }, [hasConfig]);
    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

    const checkConfig = async () => {
        try {
            const res = await api.get('/student-ai/config');
            setHasConfig(!!res.data);
        } catch { setHasConfig(false); }
        finally { setLoading(false); }
    };

    const loadConversations = async () => {
        try {
            const res = await api.get(`/student-ai/conversations?courseId=${courseId}`);
            setConversations(res.data);
            if (res.data.length > 0 && !activeConvo) {
                loadConversation(res.data[0]._id);
            }
        } catch { }
    };

    const loadConversation = async (id) => {
        try {
            const res = await api.get(`/student-ai/conversations/${id}`);
            setActiveConvo(res.data);
            setMessages(res.data.messages || []);
        } catch { toast.error('Failed to load conversation'); }
    };

    const createNew = async () => {
        try {
            const res = await api.post('/student-ai/conversations', { courseId });
            setActiveConvo(res.data);
            setMessages([]);
            loadConversations();
        } catch { toast.error('Failed to create conversation'); }
    };

    const deleteConvo = async (id, e) => {
        e.stopPropagation();
        if (!confirm('Delete this conversation?')) return;
        try {
            await api.delete(`/student-ai/conversations/${id}`);
            if (activeConvo?._id === id) { setActiveConvo(null); setMessages([]); }
            loadConversations();
        } catch { toast.error('Failed to delete'); }
    };

    const handleSend = async () => {
        if (!input.trim() && !file) return;
        if (!activeConvo) {
            try {
                const res = await api.post('/student-ai/conversations', { courseId });
                setActiveConvo(res.data);
                setMessages([]);
                await sendToConvo(res.data._id);
                loadConversations();
                return;
            } catch { toast.error('Failed to create conversation'); return; }
        }
        await sendToConvo(activeConvo._id);
        loadConversations();
    };

    const sendToConvo = async (convoId) => {
        setSending(true);
        const tempUserMsg = { role: 'user', content: input || (file ? `[Uploaded: ${file.name}]` : ''), _id: 'temp-user' };
        setMessages(prev => [...prev, tempUserMsg]);
        const currentInput = input;
        setInput('');

        const formData = new FormData();
        if (currentInput) formData.append('message', currentInput);
        if (file) formData.append('file', file);
        setFile(null);

        try {
            const res = await api.post(`/student-ai/conversations/${convoId}/messages`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setMessages(prev => {
                const filtered = prev.filter(m => m._id !== 'temp-user');
                return [...filtered, res.data.userMessage, res.data.assistantMessage];
            });
        } catch (err) {
            setMessages(prev => prev.filter(m => m._id !== 'temp-user'));
            setInput(currentInput);
            const msg = err.response?.data?.message || 'Failed to get response';
            if (msg.includes('No AI configuration')) toast.error('Set up your API key first in AI Chat Settings');
            else toast.error(msg);
        } finally { setSending(false); }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
    };

    if (loading) return (
        <div className="flex items-center justify-center py-20">
            <FaSpinner className="animate-spin text-2xl text-purple-500" />
        </div>
    );

    if (hasConfig === false) return (
        <div className="text-center py-16 space-y-4">
            <FaKey className="text-4xl text-slate-300 dark:text-slate-600 mx-auto" />
            <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200">Set Up AI First</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto">Configure your API key to start chatting with the AI assistant.</p>
            <Link to="/ai-settings" className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-all">
                <FaKey /> Configure AI Key
            </Link>
        </div>
    );

    return (
        <div className="flex flex-col h-[600px] bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <FaRobot className="text-purple-500" />
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200">AI Assistant</span>
                    {courseTitle && <span className="text-xs text-slate-400">• {courseTitle}</span>}
                </div>
                <div className="flex items-center gap-2">
                    {conversations.length > 0 && (
                        <select className="text-xs bg-transparent border border-gray-200 dark:border-slate-700 rounded-lg px-2 py-1 text-slate-600 dark:text-slate-400"
                            value={activeConvo?._id || ''} onChange={(e) => loadConversation(e.target.value)}>
                            {conversations.map(c => (
                                <option key={c._id} value={c._id}>{c.title}</option>
                            ))}
                        </select>
                    )}
                    <button onClick={createNew} className="p-1.5 text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors" title="New conversation">
                        <FaPlus size={12} />
                    </button>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && (
                    <div className="text-center py-12 text-slate-400">
                        <FaRobot className="text-3xl mx-auto mb-3 text-slate-300 dark:text-slate-600" />
                        <p className="text-sm">Ask a question or upload a PDF/image to get started</p>
                    </div>
                )}
                {messages.map((msg, i) => (
                    <div key={msg._id || i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${msg.role === 'user'
                            ? 'bg-purple-600 text-white rounded-br-md'
                            : 'bg-gray-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-md'
                        }`}>
                            {msg.attachment && (
                                <div className={`flex items-center gap-1.5 text-xs mb-2 ${msg.role === 'user' ? 'text-purple-200' : 'text-slate-400'}`}>
                                    {msg.attachment.fileType === 'pdf' ? <FaFilePdf /> : <FaImage />}
                                    {msg.attachment.fileName}
                                </div>
                            )}
                            <pre className="whitespace-pre-wrap font-sans leading-relaxed">{msg.content}</pre>
                        </div>
                    </div>
                ))}
                {sending && (
                    <div className="flex justify-start">
                        <div className="bg-gray-100 dark:bg-slate-800 rounded-2xl rounded-bl-md px-4 py-3">
                            <FaSpinner className="animate-spin text-purple-500" />
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* File preview */}
            {file && (
                <div className="px-4 py-2 border-t border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950/50">
                    <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 rounded-lg px-3 py-2 w-fit">
                        {file.type === 'application/pdf' ? <FaFilePdf className="text-red-500" /> : <FaImage className="text-blue-500" />}
                        <span className="truncate max-w-[200px]">{file.name}</span>
                        <button onClick={() => setFile(null)} className="text-slate-400 hover:text-red-500 ml-1"><FaTimes size={10} /></button>
                    </div>
                </div>
            )}

            {/* Input */}
            <div className="p-3 border-t border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                <div className="flex items-end gap-2">
                    <button onClick={() => fileInputRef.current?.click()} disabled={sending}
                        className="p-2.5 text-slate-400 hover:text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-xl transition-colors disabled:opacity-40">
                        <FaPaperclip />
                    </button>
                    <input ref={fileInputRef} type="file" accept=".pdf,image/*" className="hidden"
                        onChange={(e) => { setFile(e.target.files[0]); e.target.value = ''; }} />
                    <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown}
                        placeholder="Ask a question..." rows={1} disabled={sending}
                        className="flex-1 resize-none bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-purple-500 outline-none disabled:opacity-50" />
                    <button onClick={handleSend} disabled={sending || (!input.trim() && !file)}
                        className="p-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                        {sending ? <FaSpinner className="animate-spin" /> : <FaPaperPlane />}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AIChatPanel;
