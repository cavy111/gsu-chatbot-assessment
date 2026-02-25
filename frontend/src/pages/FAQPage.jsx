import { useState, useEffect } from 'react';
import api from '../api/axios';

function FAQPage() {
    const [faqs, setFaqs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [openId, setOpenId] = useState(null);
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchFaqs();
    }, []);

    const fetchFaqs = async () => {
        try {
            const res = await api.get('/faqs/');
            setFaqs(res.data);
        } catch {
            setError('Failed to load FAQs');
        } finally {
            setLoading(false);
        }
    };

    const toggleOpen = (id) => {
        setOpenId(openId === id ? null : id);
    };

    const filtered = faqs.filter(faq =>
        faq.question.toLowerCase().includes(search.toLowerCase()) ||
        faq.category.toLowerCase().includes(search.toLowerCase())
    );

    // group FAQs by category
    const grouped = filtered.reduce((acc, faq) => {
        if (!acc[faq.category]) acc[faq.category] = [];
        acc[faq.category].push(faq);
        return acc;
    }, {});

    if (loading) return <p style={styles.center}>Loading FAQs...</p>;
    if (error) return <p style={{ ...styles.center, color: 'red' }}>{error}</p>;

    return (
        <div style={styles.container}>
            <h2 style={styles.title}>Frequently Asked Questions</h2>
            <p style={styles.subtitle}>Find answers to common questions about GSU</p>

            <input
                style={styles.search}
                placeholder="Search FAQs..."
                value={search}
                onChange={e => setSearch(e.target.value)}
            />

            {Object.keys(grouped).length === 0 && (
                <p style={styles.center}>No FAQs found.</p>
            )}

            {Object.entries(grouped).map(([category, items]) => (
                <div key={category} style={styles.section}>
                    <h3 style={styles.category}>{category}</h3>
                    {items.map(faq => (
                        <div key={faq.id} style={styles.item}>
                            <button
                                style={styles.question}
                                onClick={() => toggleOpen(faq.id)}
                            >
                                <span>{faq.question}</span>
                                <span>{openId === faq.id ? '▲' : '▼'}</span>
                            </button>
                            {openId === faq.id && (
                                <p style={styles.answer}>{faq.answer}</p>
                            )}
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
}

const styles = {
    container: { maxWidth: '800px', margin: '0 auto', padding: '20px' },
    title: { textAlign: 'center', color: '#1a73e8', marginBottom: '5px' },
    subtitle: { textAlign: 'center', color: '#666', marginBottom: '20px' },
    search: { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '15px', marginBottom: '30px', boxSizing: 'border-box' },
    section: { marginBottom: '25px' },
    category: { color: '#1a73e8', borderBottom: '2px solid #e8f0fe', paddingBottom: '8px', marginBottom: '10px' },
    item: { backgroundColor: 'white', borderRadius: '8px', marginBottom: '8px', boxShadow: '0 1px 4px rgba(0,0,0,0.1)', overflow: 'hidden' },
    question: { width: '100%', padding: '15px', backgroundColor: 'white', border: 'none', textAlign: 'left', cursor: 'pointer', fontSize: '15px', fontWeight: '500', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    answer: { padding: '0 15px 15px', color: '#444', margin: 0, lineHeight: '1.6' },
    center: { textAlign: 'center', color: '#666', marginTop: '40px' }
};

export default FAQPage;