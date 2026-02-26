import { Link, useNavigate } from 'react-router-dom';
import logo from '../assets/logo.jpg';

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
            <span style={styles.brand}>
                <img 
                    src={logo} 
                    alt="GSU Logo" 
                    style={{ height: '35px', marginRight: '10px', verticalAlign: 'middle' }} 
                />
                GSU SmartAssist
                </span>
            <div style={styles.links}>
                <Link to="/" style={styles.link}>Chat</Link>
                <Link to="/faqs" style={styles.link}>FAQs</Link>
                {token ? (
                    <>
                        <Link to="/admin" style={styles.link}>Dashboard</Link>
                        <Link to="/analytics" style={styles.link}>Analytics</Link>
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