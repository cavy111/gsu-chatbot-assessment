import { Link, useNavigate } from 'react-router-dom';

function Navbar() {
    const navigate = useNavigate();
    const token = localStorage.getItem('token');

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('refresh');
        navigate('/login');
    };

    return (
        <nav style={styles.nav}>
            <span style={styles.brand}>GSU SmartAssist</span>
            <div style={styles.links}>
                <Link to="/" style={styles.link}>Chat</Link>
                <Link to="/faqs" style={styles.link}>FAQs</Link>
                {token ? (
                    <>
                        <Link to="/admin" style={styles.link}>Dashboard</Link>
                        <button style={styles.logoutBtn} onClick={handleLogout}>Logout</button>
                    </>
                ) : (
                    <Link to="/login" style={styles.link}>Admin Login</Link>
                )}
            </div>
        </nav>
    );
}

const styles = {
    nav: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 30px', backgroundColor: '#1a73e8', boxShadow: '0 2px 6px rgba(0,0,0,0.2)' },
    brand: { color: 'white', fontWeight: 'bold', fontSize: '20px' },
    links: { display: 'flex', alignItems: 'center', gap: '20px' },
    link: { color: 'white', textDecoration: 'none', fontSize: '15px' },
    logoutBtn: { padding: '6px 14px', backgroundColor: 'white', color: '#1a73e8', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }
};

export default Navbar;