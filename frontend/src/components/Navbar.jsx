import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Navbar.css';

function Navbar() {
    const navigate = useNavigate();
    const token = localStorage.getItem('token');
    const [menuOpen, setMenuOpen] = useState(false);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('refresh');
        navigate('/login');
        setMenuOpen(false);
    };

    const closeMenu = () => setMenuOpen(false);

    return (
        <nav className="navbar">
            <span className="navbar-brand">🎓 GSU SmartAssist</span>

            <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>
                {menuOpen ? '✕' : '☰'}
            </button>

            <div className="navbar-links">
                <Link to="/" onClick={closeMenu}>Chat</Link>
                <Link to="/faqs" onClick={closeMenu}>FAQs</Link>
                {token ? (
                    <>
                        <Link to="/admin" onClick={closeMenu}>Dashboard</Link>
                        <Link to="/analytics" onClick={closeMenu}>Analytics</Link>
                        <button className="logout-btn" onClick={handleLogout}>Logout</button>
                    </>
                ) : (
                    <Link to="/login" onClick={closeMenu}>Admin Login</Link>
                )}
            </div>

            {/* mobile menu - only renders when hamburger is open */}
            {menuOpen && (
                <div className="mobile-menu">
                    <Link to="/" onClick={closeMenu}>Chat</Link>
                    <Link to="/faqs" onClick={closeMenu}>FAQs</Link>
                    {token ? (
                        <>
                            <Link to="/admin" onClick={closeMenu}>Dashboard</Link>
                            <Link to="/analytics" onClick={closeMenu}>Analytics</Link>
                            <button className="mobile-logout-btn" onClick={handleLogout}>Logout</button>
                        </>
                    ) : (
                        <Link to="/login" onClick={closeMenu}>Admin Login</Link>
                    )}
                </div>
            )}
        </nav>
    );
}

export default Navbar;