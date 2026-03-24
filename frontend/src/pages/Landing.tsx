import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
    Database, Lock, CheckCircle, ArrowRight,
    Github, ExternalLink, Menu, X
} from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'

export default function Landing() {
    const navigate = useNavigate()
    const [menuOpen, setMenuOpen] = useState(false)
    const menuRef = useRef<HTMLDivElement>(null)

    // Close on outside click
    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setMenuOpen(false)
            }
        }
        if (menuOpen) document.addEventListener('mousedown', handleClick)
        return () => document.removeEventListener('mousedown', handleClick)
    }, [menuOpen])

    // Close on Escape
    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuOpen(false) }
        document.addEventListener('keydown', handler)
        return () => document.removeEventListener('keydown', handler)
    }, [])

    // Lock body scroll while menu open
    useEffect(() => {
        document.body.style.overflow = menuOpen ? 'hidden' : ''
        return () => { document.body.style.overflow = '' }
    }, [menuOpen])

    return (
        <div className="landing-container">

            {/* ── NAVBAR ─────────────────────────────────────────────── */}
            <div ref={menuRef}>
                <header className="landing-navbar">
                    <Link to="/" className="landing-navbar-logo">
                        <Database style={{ width: 22, height: 22, flexShrink: 0 }} />
                        DataForge
                    </Link>

                    {/* Desktop links */}
                    <nav className="landing-navbar-links">
                        <Link to="/browse">Browse Datasets</Link>
                        <a href="#how-it-works">How it Works</a>
                        <a href="#pricing">Pricing</a>
                    </nav>

                    {/* Desktop CTA */}
                    <div className="landing-navbar-cta">
                        <Button variant="primary" size="md" onClick={() => navigate('/dashboard')}>
                            App Dashboard
                        </Button>
                    </div>

                    {/* Hamburger — mobile only */}
                    <button
                        className="navbar-hamburger"
                        onClick={() => setMenuOpen(o => !o)}
                        aria-label={menuOpen ? 'Close menu' : 'Open menu'}
                        aria-expanded={menuOpen}
                    >
                        {menuOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </header>

                {/* Mobile dropdown */}
                <div className={`navbar-mobile-menu${menuOpen ? ' is-open' : ''}`}>
                    <div className="navbar-mobile-backdrop" onClick={() => setMenuOpen(false)} />
                    <div className="navbar-mobile-panel">
                        <Link to="/browse"        className="navbar-mobile-link" onClick={() => setMenuOpen(false)}>Browse Datasets</Link>
                        <a href="#how-it-works"   className="navbar-mobile-link" onClick={() => setMenuOpen(false)}>How it Works</a>
                        <a href="#pricing"        className="navbar-mobile-link" onClick={() => setMenuOpen(false)}>Pricing</a>
                        <div className="navbar-mobile-divider" />
                        <div className="navbar-mobile-cta">
                            <Button variant="primary" size="md" onClick={() => { setMenuOpen(false); navigate('/dashboard') }}>
                                App Dashboard
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── HERO ───────────────────────────────────────────────── */}
            <section className="landing-hero">
                {/* Left */}
                <div className="landing-hero-left">
                    <div className="landing-hero-eyebrow">Decentralized Data Marketplace</div>

                    <h1 className="landing-hero-headline">
                        Sell your data.<br />
                        <span style={{ color: 'var(--brand)' }}>Keep 97.5%.</span><br />
                        Get paid instantly.
                    </h1>

                    <p className="landing-hero-sub">
                        Cryptographic proof of provenance. Buyers can't pirate it. No middlemen, no delays.
                    </p>

                    <div className="landing-hero-ctas">
                        <Button size="xl" onClick={() => navigate('/browse')} style={{ padding: '0 40px' }}>
                            Browse Datasets
                            <ArrowRight style={{ marginLeft: 12, width: 20, height: 20 }} />
                        </Button>
                        <Button size="xl" variant="secondary" onClick={() => navigate('/sell')} style={{ padding: '0 40px' }}>
                            Start Selling
                        </Button>
                    </div>

                    <div className="landing-hero-trust">
                        <div className="landing-hero-trust-item"><CheckCircle /> Filecoin storage</div>
                        <div className="landing-hero-trust-item"><CheckCircle /> Instant payment</div>
                        <div className="landing-hero-trust-item"><CheckCircle /> 2.5% platform fee</div>
                    </div>
                </div>

                {/* Right — image */}
                <div className="landing-hero-right">
                    <img
                        src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&q=85"
                        alt="Data Analytics"
                    />
                    <div style={{
                        position: 'absolute', inset: 0,
                        background: 'linear-gradient(to right, var(--bg-card) 0%, transparent 40%)'
                    }} />
                </div>
            </section>

            {/* ── HOW IT WORKS ───────────────────────────────────────── */}
            <section
                id="how-it-works"
                className="section-padding"
                style={{ background: 'var(--bg-subtle)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', textAlign: 'center' }}
            >
                <div style={{ maxWidth: 1100, margin: '0 auto' }}>
                    <h2 className="section-title">How DataForge Works</h2>
                    <p className="section-subtitle">Designed for data professionals. Simple enough for anyone.</p>

                    <div className="grid-auto-3">
                        {/* Sellers */}
                        <Card style={{ textAlign: 'left', borderTop: '4px solid var(--brand)' }}>
                            <div style={{ padding: 32 }}>
                                <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--brand)', marginBottom: 32 }}>For Data Sellers</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                                    {[
                                        { n: '1', t: 'Upload your dataset to Filecoin',  d: 'Securely store files of any size on the permanent web.' },
                                        { n: '2', t: 'Set your price and list it',         d: 'Control access and pricing with cryptographic smart contracts.' },
                                        { n: '3', t: 'Earn tFIL instantly on every sale', d: 'Smart contracts handle payments and settlements automatically.' },
                                    ].map(step => (
                                        <div key={step.n} style={{ display: 'flex', gap: 16 }}>
                                            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--brand)', color: 'white', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                                                {step.n}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 'bold', color: 'var(--text-1)', marginBottom: 4 }}>{step.t}</div>
                                                <div style={{ fontSize: 14, color: 'var(--text-2)' }}>{step.d}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </Card>

                        {/* Buyers */}
                        <Card style={{ textAlign: 'left' }}>
                            <div style={{ padding: 32 }}>
                                <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-1)', marginBottom: 32 }}>For Data Buyers</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                                    {[
                                        { n: '1', t: 'Browse and preview datasets free',               d: 'Verify data quality with inline CSV and JSON previews.' },
                                        { n: '2', t: 'Pay with crypto or credit card',                 d: 'Global checkout with MetaMask or fiat via Transak.' },
                                        { n: '3', t: 'Download instantly with proof of authenticity',  d: 'Get your data immediately with full provenance tracking.' },
                                    ].map(step => (
                                        <div key={step.n} style={{ display: 'flex', gap: 16 }}>
                                            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--bg-subtle)', border: '1px solid var(--border)', color: 'var(--text-2)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                                                {step.n}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 'bold', color: 'var(--text-1)', marginBottom: 4 }}>{step.t}</div>
                                                <div style={{ fontSize: 14, color: 'var(--text-2)' }}>{step.d}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </Card>

                        {/* AI Agents */}
                        <Card style={{ textAlign: 'left' }}>
                            <div style={{ padding: 32 }}>
                                <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-1)', marginBottom: 32 }}>For AI Agents</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                                    {[
                                        { n: '1', t: 'Programmatic Discovery',   d: 'Discover datasets natively via ERC-8004 registry and API endpoints.' },
                                        { n: '2', t: 'x402 Microtransactions',   d: 'Agents authorize access by paying USDC tolls seamlessly on Base.' },
                                        { n: '3', t: 'Lit-Powered Ingestion',    d: 'Server-side decryption streams Filecoin data directly into agent memory.' },
                                    ].map(step => (
                                        <div key={step.n} style={{ display: 'flex', gap: 16 }}>
                                            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--bg-subtle)', border: '1px solid var(--border)', color: 'var(--text-2)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                                                {step.n}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 'bold', color: 'var(--text-1)', marginBottom: 4 }}>{step.t}</div>
                                                <div style={{ fontSize: 14, color: 'var(--text-2)' }}>{step.d}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            </section>

            {/* ── PRICING ────────────────────────────────────────────── */}
            <section id="pricing" className="section-padding" style={{ background: 'var(--bg-card)' }}>
                <div style={{ maxWidth: 800, margin: '0 auto' }}>
                    <h2 className="section-title">Why DataForge?</h2>

                    {/* Scrollable wrapper so table never breaks layout on mobile */}
                    <div className="data-table-wrapper" style={{ marginTop: 48 }}>
                        <div className="card" style={{ overflow: 'hidden' }}>
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Platform</th>
                                        <th>Cut</th>
                                        <th>Minimum</th>
                                        <th>Provenance</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr style={{ background: 'var(--brand-light)', borderLeft: '3px solid var(--brand)' }}>
                                        <td style={{ fontWeight: 'bold' }}>DataForge</td>
                                        <td style={{ color: 'var(--success)', fontWeight: 'bold' }}>2.5%</td>
                                        <td>None</td>
                                        <td style={{ color: 'var(--success)', fontWeight: 'bold' }}>Cryptographic ✓</td>
                                    </tr>
                                    <tr><td>Gumroad</td><td>10%</td><td>None</td><td style={{ color: 'var(--text-3)' }}>✗</td></tr>
                                    <tr><td>AWS Data Exchange</td><td>35%</td><td>$10k/year</td><td style={{ color: 'var(--text-3)' }}>✗</td></tr>
                                    <tr><td>Snowflake</td><td>Custom</td><td>Enterprise</td><td style={{ color: 'var(--text-3)' }}>✗</td></tr>
                                    <tr><td>Kaggle</td><td>—</td><td>—</td><td style={{ color: 'var(--text-3)' }}>✗</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── TRUST ──────────────────────────────────────────────── */}
            <section className="section-padding" style={{ background: 'var(--bg-subtle)', borderTop: '1px solid var(--border)' }}>
                <div style={{ maxWidth: 900, margin: '0 auto' }}>
                    <div className="grid-auto-2">
                        <Card style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div style={{ width: 48, height: 48, borderRadius: 'var(--r-md)', background: 'var(--brand-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand)', flexShrink: 0 }}>
                                <Database />
                            </div>
                            <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-1)' }}>Your data lives forever</h3>
                            <p style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.6 }}>
                                DataForge stores your information on a decentralized network of independent storage providers.
                                This ensures that your datasets are permanent, tamper-proof, and always accessible,
                                even if our platform goes offline.
                            </p>
                        </Card>

                        <Card style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div style={{ width: 48, height: 48, borderRadius: 'var(--r-md)', background: 'var(--brand-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand)', flexShrink: 0 }}>
                                <Lock />
                            </div>
                            <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-1)' }}>Only buyers can access</h3>
                            <p style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.6 }}>
                                We use advanced cryptographic access control to ensure that your data is only visible
                                to confirmed purchasers. Every transaction is verified on the blockchain before
                                access is granted, guaranteeing that only the rightful owners can view your files.
                            </p>
                        </Card>
                    </div>
                </div>
            </section>

            {/* ── FOOTER ─────────────────────────────────────────────── */}
            <footer className="section-padding" style={{ background: 'var(--bg-card)', borderTop: '1px solid var(--border)' }}>
                <div style={{ maxWidth: 1100, margin: '0 auto' }}>
                    {/* Footer grid */}
                    <div className="footer-grid">
                        {/* Brand column */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Database style={{ width: 24, height: 24, color: 'var(--brand)' }} />
                                <span style={{ fontSize: 20, fontWeight: 600, color: 'var(--brand)' }}>DataForge</span>
                            </div>
                            <p style={{ fontSize: 14, color: 'var(--text-2)', maxWidth: 300, lineHeight: 1.6 }}>
                                The decentralized data marketplace for the Filecoin ecosystem.
                            </p>
                        </div>

                        {/* Link columns */}
                        <div style={{ display: 'flex', gap: 48, flexWrap: 'wrap' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                <div style={{ fontSize: 11, fontWeight: 'bold', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Protocol</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    <Link to="/browse" style={{ fontSize: 14, color: 'var(--text-2)' }}>Browse</Link>
                                    <Link to="/sell"   style={{ fontSize: 14, color: 'var(--text-2)' }}>Sell</Link>
                                    <a href="#"        style={{ fontSize: 14, color: 'var(--text-2)' }}>Docs</a>
                                </div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                <div style={{ fontSize: 11, fontWeight: 'bold', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Community</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    <a href="https://github.com/jerry/dataforge" target="_blank" rel="noopener noreferrer" style={{ fontSize: 14, color: 'var(--text-2)', display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <Github style={{ width: 16, height: 16 }} /> GitHub
                                    </a>
                                </div>
                            </div>
                        </div>

                        {/* Contract address */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div style={{ fontSize: 11, fontWeight: 'bold', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Smart Contract</div>
                            <a
                                href="https://calibration.filfox.info/en/address/0x5e0d9D7d89cB375Cc9311815dF9cAdD2B0ea3315"
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-2)', fontFamily: 'var(--font-mono)', padding: '6px 12px', background: 'var(--bg-subtle)', borderRadius: 99, textDecoration: 'none', width: 'fit-content' }}
                            >
                                0x5e0d...3315 <ExternalLink style={{ width: 12, height: 12 }} />
                            </a>
                        </div>
                    </div>

                    {/* Bottom strip */}
                    <div className="footer-bottom">
                        <div>© 2025 DataForge Protocol. Built on Filecoin.</div>
                        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                            <a href="#" style={{ color: 'inherit' }}>Privacy Policy</a>
                            <a href="#" style={{ color: 'inherit' }}>Terms of Service</a>
                        </div>
                    </div>
                </div>
            </footer>

            {/* ── Responsive styles (scoped here to avoid polluting global CSS) ── */}
            <style>{`
                /* Navbar */
                .landing-navbar {
                    height: 64px;
                    padding: 0 40px;
                    background: var(--bg-card);
                    border-bottom: 1px solid var(--border);
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    position: sticky;
                    top: 0;
                    z-index: 100;
                    gap: 16px;
                }
                .landing-navbar-logo {
                    font-size: 20px;
                    font-weight: 700;
                    color: var(--brand);
                    text-decoration: none;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    flex-shrink: 0;
                    white-space: nowrap;
                }
                .landing-navbar-links {
                    display: flex;
                    align-items: center;
                    gap: 28px;
                    font-size: 14px;
                    font-weight: 500;
                    color: var(--text-2);
                    flex: 1;
                }
                .landing-navbar-links a {
                    color: inherit;
                    text-decoration: none;
                    white-space: nowrap;
                    transition: color 0.15s;
                }
                .landing-navbar-links a:hover { color: var(--text-1); }
                .landing-navbar-cta { flex-shrink: 0; }

                /* Hamburger — hidden on desktop */
                .navbar-hamburger {
                    display: none;
                    align-items: center;
                    justify-content: center;
                    width: 40px;
                    height: 40px;
                    border: 1px solid var(--border);
                    border-radius: var(--r-md);
                    background: var(--bg-subtle);
                    color: var(--text-2);
                    cursor: pointer;
                    transition: background 0.15s;
                    flex-shrink: 0;
                }
                .navbar-hamburger:hover { background: var(--bg-card); color: var(--text-1); }

                /* Mobile menu */
                .navbar-mobile-menu {
                    display: none;
                    position: fixed;
                    top: 64px;
                    left: 0; right: 0; bottom: 0;
                    z-index: 99;
                }
                .navbar-mobile-backdrop {
                    position: absolute;
                    inset: 0;
                    background: var(--bg-overlay);
                }
                .navbar-mobile-panel {
                    position: absolute;
                    top: 0; left: 0; right: 0;
                    background: var(--bg-card);
                    border-bottom: 1px solid var(--border);
                    padding: 12px 16px 20px;
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                    box-shadow: var(--shadow-lg);
                    transform: translateY(-8px);
                    opacity: 0;
                    transition: transform 0.2s ease, opacity 0.2s ease;
                }
                .navbar-mobile-menu.is-open { display: block; }
                .navbar-mobile-menu.is-open .navbar-mobile-panel { transform: translateY(0); opacity: 1; }
                .navbar-mobile-link {
                    display: flex; align-items: center;
                    height: 48px; padding: 0 12px;
                    border-radius: var(--r-md);
                    font-size: 15px; font-weight: 500;
                    color: var(--text-2); text-decoration: none;
                    transition: background 0.1s, color 0.1s;
                    cursor: pointer;
                }
                .navbar-mobile-link:hover { background: var(--bg-subtle); color: var(--text-1); text-decoration: none; }
                .navbar-mobile-divider { height: 1px; background: var(--border); margin: 8px 0; }
                .navbar-mobile-cta button { width: 100%; justify-content: center; height: 48px; font-size: 15px; }

                /* Hero */
                .landing-hero {
                    display: flex;
                    min-height: calc(100vh - 64px);
                    background: var(--bg-card);
                }
                .landing-hero-left {
                    flex: 0 0 55%;
                    padding: 80px 60px 80px 80px;
                    display: flex; flex-direction: column; justify-content: center;
                }
                .landing-hero-right {
                    flex: 0 0 45%;
                    position: relative; overflow: hidden;
                }
                .landing-hero-right img { width: 100%; height: 100%; object-fit: cover; }
                .landing-hero-eyebrow {
                    font-size: 12px; font-weight: 600; color: var(--brand);
                    text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 16px;
                }
                .landing-hero-headline {
                    font-size: clamp(28px, 5vw, 56px);
                    font-weight: 700; line-height: 1.1; color: var(--text-1); margin-bottom: 20px;
                }
                .landing-hero-sub {
                    font-size: 18px; color: var(--text-2); line-height: 1.6;
                    max-width: 480px; margin-bottom: 36px;
                }
                .landing-hero-ctas {
                    display: flex; gap: 12px; margin-bottom: 48px; flex-wrap: wrap;
                }
                .landing-hero-trust { display: flex; gap: 24px; flex-wrap: wrap; }
                .landing-hero-trust-item {
                    display: flex; align-items: center; gap: 10px;
                    font-size: 14px; font-weight: 500; color: var(--text-2);
                }
                .landing-hero-trust-item svg { width: 18px; height: 18px; color: var(--success); flex-shrink: 0; }

                /* Section helpers */
                .section-padding { padding: 80px 40px; }
                .section-title { font-size: 28px; font-weight: 700; text-align: center; margin-bottom: 16px; color: var(--text-1); }
                .section-subtitle { font-size: 16px; text-align: center; color: var(--text-2); margin-bottom: 48px; }

                /* Responsive grids */
                .grid-auto-3 {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 32px;
                }
                .grid-auto-2 {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 32px;
                }

                /* Table scroll wrapper */
                .data-table-wrapper { width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; }

                /* Footer */
                .footer-grid {
                    display: flex;
                    flex-direction: row;
                    flex-wrap: wrap;
                    justify-content: space-between;
                    gap: 48px;
                    margin-bottom: 48px;
                }
                .footer-bottom {
                    padding-top: 32px;
                    border-top: 1px solid var(--border);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    font-size: 12px;
                    color: var(--text-3);
                    flex-wrap: wrap;
                    gap: 12px;
                }

                /* ── Tablet (≤ 1024px) ──────────────────────────────── */
                @media (max-width: 1024px) {
                    .landing-navbar { padding: 0 24px; }
                    .landing-navbar-links { gap: 20px; }
                    .grid-auto-3 { grid-template-columns: 1fr; gap: 20px; }
                }

                /* ── Mobile (≤ 768px) ───────────────────────────────── */
                @media (max-width: 768px) {
                    /* Navbar collapses */
                    .landing-navbar { padding: 0 16px; height: 56px; }
                    .navbar-mobile-menu { top: 56px; }
                    .landing-navbar-links { display: none; }
                    .landing-navbar-cta { display: none; }
                    .navbar-hamburger { display: flex; }
                    .landing-navbar-logo { font-size: 17px; }

                    /* Hero stacks */
                    .landing-hero { flex-direction: column; min-height: auto; }
                    .landing-hero-left { flex: none; padding: 48px 20px 40px; }
                    .landing-hero-right { flex: none; height: 240px; }
                    /* Gradient goes top→bottom on mobile */
                    .landing-hero-right > div {
                        background: linear-gradient(to bottom, var(--bg-card) 0%, transparent 40%) !important;
                    }

                    /* Hero text */
                    .landing-hero-sub { font-size: 15px; margin-bottom: 28px; }
                    .landing-hero-ctas { flex-direction: column; margin-bottom: 32px; }
                    .landing-hero-ctas button { width: 100%; justify-content: center; }
                    .landing-hero-trust { gap: 12px; }
                    .landing-hero-trust-item { font-size: 13px; }

                    /* Sections */
                    .section-padding { padding: 48px 20px; }
                    .section-title { font-size: 22px; }
                    .section-subtitle { font-size: 14px; margin-bottom: 28px; }

                    /* Grids */
                    .grid-auto-2 { grid-template-columns: 1fr; gap: 16px; }

                    /* Footer */
                    .footer-grid { flex-direction: column; gap: 32px; }
                    .footer-bottom { flex-direction: column; align-items: flex-start; gap: 16px; }
                }

                /* ── Small mobile (≤ 480px) ─────────────────────────── */
                @media (max-width: 480px) {
                    .landing-hero-left { padding: 36px 16px 32px; }
                    .section-padding { padding: 40px 16px; }
                }
            `}</style>
        </div>
    )
}