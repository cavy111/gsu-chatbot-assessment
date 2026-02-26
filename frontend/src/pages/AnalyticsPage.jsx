import { useState, useEffect } from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';
import api from '../api/axios';

const COLORS = ['#1a73e8', '#34a853', '#fbbc04', '#ea4335', '#9c27b0', '#00bcd4'];

function StatCard({ title, value, color }) {
    return (
        <div style={{ ...styles.card, borderTop: `4px solid ${color}` }}>
            <p style={styles.cardTitle}>{title}</p>
            <p style={{ ...styles.cardValue, color }}>{value}</p>
        </div>
    );
}

function AnalyticsPage() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            const res = await api.get('/admin/analytics/');
            setData(res.data);
        } catch {
            setError('Failed to load analytics');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <p style={styles.center}>Loading analytics...</p>;
    if (error) return <p style={{ ...styles.center, color: 'red' }}>{error}</p>;

    return (
        <div style={styles.container}>
            <h2 style={styles.title}>Analytics Dashboard</h2>

            {/* Summary Cards */}
            <div style={styles.cardRow}>
                <StatCard
                    title="Total Messages"
                    value={data.summary.total_messages}
                    color="#1a73e8"
                />
                <StatCard
                    title="Total Sessions"
                    value={data.summary.total_sessions}
                    color="#34a853"
                />
                <StatCard
                    title="Unmatched Queries"
                    value={data.summary.unmatched_queries}
                    color="#ea4335"
                />
            </div>

            {/* Messages Over Time */}
            <div style={styles.chartBox}>
                <h3 style={styles.chartTitle}>Messages Over Time</h3>
                {data.messages_over_time.length === 0 ? (
                    <p style={styles.empty}>No data yet</p>
                ) : (
                    <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={data.messages_over_time}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                            <YAxis allowDecimals={false} />
                            <Tooltip />
                            <Line
                                type="monotone"
                                dataKey="messages"
                                stroke="#1a73e8"
                                strokeWidth={2}
                                dot={{ r: 4 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                )}
            </div>

            <div style={styles.row}>
                {/* Topics Pie Chart */}
                <div style={{ ...styles.chartBox, flex: 1 }}>
                    <h3 style={styles.chartTitle}>Most Asked Topics</h3>
                    {data.topics.length === 0 ? (
                        <p style={styles.empty}>No data yet</p>
                    ) : (
                        <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                                <Pie
                                    data={data.topics}
                                    dataKey="count"
                                    nameKey="topic"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={80}
                                    label={({ topic, percent }) =>
                                        `${topic} ${(percent * 100).toFixed(0)}%`
                                    }
                                >
                                    {data.topics.map((_, index) => (
                                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* Messages Per Session */}
                <div style={{ ...styles.chartBox, flex: 1 }}>
                    <h3 style={styles.chartTitle}>Messages Per Session (Top 10)</h3>
                    {data.messages_per_session.length === 0 ? (
                        <p style={styles.empty}>No data yet</p>
                    ) : (
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={data.messages_per_session}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="session" tick={{ fontSize: 10 }} />
                                <YAxis allowDecimals={false} />
                                <Tooltip />
                                <Bar dataKey="messages" fill="#1a73e8" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>
        </div>
    );
}

const styles = {
    container: { maxWidth: '1000px', margin: '0 auto', padding: '20px' },
    title: { color: '#1a73e8', marginBottom: '20px' },
    cardRow: { display: 'flex', gap: '20px', marginBottom: '30px' },
    card: { flex: 1, backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' },
    cardTitle: { margin: '0 0 8px', color: '#666', fontSize: '14px' },
    cardValue: { margin: 0, fontSize: '36px', fontWeight: 'bold' },
    chartBox: { backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', marginBottom: '20px' },
    chartTitle: { margin: '0 0 15px', color: '#333' },
    row: { display: 'flex', gap: '20px' },
    center: { textAlign: 'center', marginTop: '40px', color: '#666' },
    empty: { textAlign: 'center', color: '#aaa', padding: '40px 0' }
};

export default AnalyticsPage;