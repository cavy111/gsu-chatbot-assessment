import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

function AdminPage() {
    const [activeTab, setActiveTab] = useState('faqs');
    const [faqs, setFaqs] = useState([]);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // form state for adding/editing
    const [form, setForm] = useState({ category: '', question: '', answer: '', keywords: '' });
    const [editingId, setEditingId] = useState(null);

    const navigate = useNavigate();

    useEffect(() => {
        if (activeTab === 'faqs') fetchFaqs();
        if (activeTab === 'logs') fetchLogs();
    }, [activeTab]);

    const fetchFaqs = async () => {
        setLoading(true);
        try {
            const res = await api.get('/faqs/');
            setFaqs(res.data);
        } catch {
            setError('Failed to load FAQs');
        } finally {
            setLoading(false);
        }
    };

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/chat-logs/');
            setLogs(res.data);
        } catch {
            setError('Failed to load chat logs');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!form.category || !form.question || !form.answer || !form.keywords) {
            setError('All fields are required');
            return;
        }
        try {
            if (editingId) {
                await api.put(`/admin/faqs/${editingId}/`, form);
            } else {
                await api.post('/admin/faqs/', form);
            }
            setForm({ category: '', question: '', answer: '', keywords: '' });
            setEditingId(null);
            setError('');
            fetchFaqs();
        } catch {
            setError('Failed to save FAQ');
        }
    };

    const handleEdit = (faq) => {
        setForm({ category: faq.category, question: faq.question, answer: faq.answer, keywords: faq.keywords });
        setEditingId(faq.id);
        setActiveTab('faqs');
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this FAQ?')) return;
        try {
            await api.delete(`/admin/faqs/${id}/`);
            fetchFaqs();
        } catch {
            setError('Failed to delete FAQ');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('refresh');
        navigate('/login');
    };

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h2 style={styles.title}>Admin Dashboard</h2>
                <button style={styles.logoutBtn} onClick={handleLogout}>Logout</button>
            </div>

            {/* Tabs */}
            <div style={styles.tabs}>
                <button
                    style={{ ...styles.tab, ...(activeTab === 'faqs' ? styles.activeTab : {}) }}
                    onClick={() => setActiveTab('faqs')}
                >
                    Manage FAQs
                </button>
                <button
                    style={{ ...styles.tab, ...(activeTab === 'logs' ? styles.activeTab : {}) }}
                    onClick={() => setActiveTab('logs')}
                >
                    Chat Logs
                </button>
            </div>

            {error && <p style={styles.error}>{error}</p>}
            {loading && <p style={styles.loading}>Loading...</p>}

            {/* FAQs Tab */}
            {activeTab === 'faqs' && (
                <div>
                    {/* Form */}
                    <div style={styles.form}>
                        <h3>{editingId ? 'Edit FAQ' : 'Add New FAQ'}</h3>
                        <input
                            style={styles.input}
                            placeholder="Category (e.g. Admissions)"
                            value={form.category}
                            onChange={e => setForm({ ...form, category: e.target.value })}
                        />
                        <input
                            style={styles.input}
                            placeholder="Question"
                            value={form.question}
                            onChange={e => setForm({ ...form, question: e.target.value })}
                        />
                        <textarea
                            style={{ ...styles.input, height: '80px' }}
                            placeholder="Answer"
                            value={form.answer}
                            onChange={e => setForm({ ...form, answer: e.target.value })}
                        />
                        <input
                            style={styles.input}
                            placeholder="Keywords (comma separated e.g. apply, admission, register)"
                            value={form.keywords}
                            onChange={e => setForm({ ...form, keywords: e.target.value })}
                        />
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button style={styles.button} onClick={handleSubmit}>
                                {editingId ? 'Update FAQ' : 'Add FAQ'}
                            </button>
                            {editingId && (
                                <button style={styles.cancelBtn} onClick={() => {
                                    setEditingId(null);
                                    setForm({ category: '', question: '', answer: '', keywords: '' });
                                }}>
                                    Cancel
                                </button>
                            )}
                        </div>
                    </div>

                    {/* FAQ List */}
                    <div style={styles.list}>
                        {faqs.map(faq => (
                            <div key={faq.id} style={styles.card}>
                                <span style={styles.category}>{faq.category}</span>
                                <p style={styles.question}>{faq.question}</p>
                                <p style={styles.answer}>{faq.answer}</p>
                                <p style={styles.keywords}>Keywords: {faq.keywords}</p>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button style={styles.editBtn} onClick={() => handleEdit(faq)}>Edit</button>
                                    <button style={styles.deleteBtn} onClick={() => handleDelete(faq.id)}>Delete</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Chat Logs Tab */}
            {activeTab === 'logs' && (
                <div style={styles.list}>
                    {logs.map((log, i) => (
                        <div key={i} style={styles.card}>
                            <p style={styles.keywords}>Session: {log.session_id}</p>
                            <p><strong>User:</strong> {log.message}</p>
                            <p><strong>Bot:</strong> {log.response}</p>
                            <p style={styles.keywords}>{new Date(log.timestamp).toLocaleString()}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

const styles = {
    container: { maxWidth: '900px', margin: '0 auto', padding: '20px' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
    title: { margin: 0, color: '#1a73e8' },
    logoutBtn: { padding: '8px 16px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' },
    tabs: { display: 'flex', gap: '10px', marginBottom: '20px' },
    tab: { padding: '10px 20px', border: '1px solid #ccc', borderRadius: '8px', cursor: 'pointer', backgroundColor: 'white' },
    activeTab: { backgroundColor: '#1a73e8', color: 'white', border: '1px solid #1a73e8' },
    form: { backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '10px' },
    input: { padding: '10px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '15px', width: '100%', boxSizing: 'border-box' },
    button: { padding: '10px 20px', backgroundColor: '#1a73e8', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' },
    cancelBtn: { padding: '10px 20px', backgroundColor: '#666', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' },
    list: { display: 'flex', flexDirection: 'column', gap: '15px' },
    card: { backgroundColor: 'white', padding: '15px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' },
    category: { backgroundColor: '#e8f0fe', color: '#1a73e8', padding: '3px 10px', borderRadius: '20px', fontSize: '13px' },
    question: { fontWeight: 'bold', margin: '10px 0 5px' },
    answer: { margin: '0 0 5px', color: '#444' },
    keywords: { color: '#888', fontSize: '13px' },
    editBtn: { padding: '6px 14px', backgroundColor: '#f0a500', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' },
    deleteBtn: { padding: '6px 14px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' },
    error: { color: 'red' },
    loading: { color: '#666' }
};

export default AdminPage;