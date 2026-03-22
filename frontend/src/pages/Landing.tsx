import { Link, useNavigate } from 'react-router-dom'
import { Database, Lock, CheckCircle, ArrowRight, Github, ExternalLink } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'

export default function Landing() {
    const navigate = useNavigate()

    return (
        <div className="landing-container">
            {/* PUBLIC NAVBAR */}
            <header className="landing-navbar">
                <Link to="/" className="landing-navbar-logo">
                    <Database /> DataForge
                </Link>
                <nav className="landing-navbar-links">
                    <Link to="/browse">Browse Datasets</Link>
                    <a href="#how-it-works">How it Works</a>
                    <a href="#pricing">Pricing</a>
                    <Button variant="primary" size="md" onClick={() => navigate('/dashboard')}>
                        App Dashboard
                    </Button>
                </nav>
            </header>

            {/* HERO SECTION */}
            <section className="landing-hero">
                {/* Left Column */}
                <div className="landing-hero-left">
                    <div className="landing-hero-eyebrow">
                        Decentralized Data Marketplace
                    </div>

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
                            Browse Datasets <ArrowRight style={{ marginLeft: '12px', width: '20px', height: '20px' }} />
                        </Button>
                        <Button size="xl" variant="secondary" onClick={() => navigate('/sell')} style={{ padding: '0 40px' }}>
                            Start Selling
                        </Button>
                    </div>

                    <div className="landing-hero-trust">
                        <div className="landing-hero-trust-item">
                            <CheckCircle /> Filecoin storage
                        </div>
                        <div className="landing-hero-trust-item">
                            <CheckCircle /> Instant payment
                        </div>
                        <div className="landing-hero-trust-item">
                            <CheckCircle /> 2.5% platform fee
                        </div>
                    </div>
                </div>

                {/* Right Column */}
                <div className="landing-hero-right">
                    <img
                        src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&q=85"
                        alt="Data Analytics"
                    />
                    <div
                        className="hero-overlay"
                        style={{
                            position: 'absolute',
                            inset: 0,
                            background: 'linear-gradient(to right, var(--bg-card) 0%, transparent 40%)'
                        }}
                    />
                </div>
            </section>

            {/* HOW IT WORKS SECTION */}
            <section id="how-it-works" className="section-padding" style={{ background: 'var(--bg-subtle)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', textAlign: 'center' }}>
                <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
                    <h2 className="section-title">How DataForge Works</h2>
                    <p className="section-subtitle">
                        Designed for data professionals. Simple enough for anyone.
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>
                        {/* Sellers Panel */}
                        <Card style={{ textAlign: 'left', borderTop: '4px solid var(--brand)' }}>
                            <div style={{ padding: '32px' }}>
                                <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--brand)', marginBottom: '32px' }}>
                                    For Data Sellers
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                                    {[
                                        { n: '1', t: 'Upload your dataset to Filecoin', d: 'Securely store files of any size on the permanent web.' },
                                        { n: '2', t: 'Set your price and list it', d: 'Control access and pricing with cryptographic smart contracts.' },
                                        { n: '3', t: 'Earn tFIL instantly on every sale', d: 'Smart contracts handle payments and settlements automatically.' }
                                    ].map((step) => (
                                        <div key={step.n} style={{ display: 'flex', gap: '16px' }}>
                                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--brand)', color: 'white', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                                                {step.n}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 'bold', color: 'var(--text-1)', marginBottom: '4px' }}>{step.t}</div>
                                                <div style={{ fontSize: '14px', color: 'var(--text-2)' }}>{step.d}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </Card>

                        {/* Buyers Panel */}
                        <Card style={{ textAlign: 'left' }}>
                            <div style={{ padding: '32px' }}>
                                <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-1)', marginBottom: '32px' }}>
                                    For Data Buyers
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                                    {[
                                        { n: '1', t: 'Browse and preview datasets free', d: 'Verify data quality with inline CSV and JSON previews.' },
                                        { n: '2', t: 'Pay with crypto or credit card', d: 'Global checkout with MetaMask or fiat via Transak.' },
                                        { n: '3', t: 'Download instantly with proof of authenticity', d: 'Get your data immediately with full provenance tracking.' }
                                    ].map((step) => (
                                        <div key={step.n} style={{ display: 'flex', gap: '16px' }}>
                                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--bg-subtle)', border: '1px solid var(--border)', color: 'var(--text-2)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                                                {step.n}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 'bold', color: 'var(--text-1)', marginBottom: '4px' }}>{step.t}</div>
                                                <div style={{ fontSize: '14px', color: 'var(--text-2)' }}>{step.d}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </Card>

                        {/* AI Agents Panel */}
                        <Card style={{ textAlign: 'left' }}>
                            <div style={{ padding: '32px' }}>
                                <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-1)', marginBottom: '32px' }}>
                                    For AI Agents
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                                    {[
                                        { n: '1', t: 'Programmatic Discovery', d: 'Discover datasets natively via ERC-8004 registry and API endpoints.' },
                                        { n: '2', t: 'x402 Microtransactions', d: 'Agents authorize access by paying USDC tolls seamlessly on Base.' },
                                        { n: '3', t: 'Lit-Powered Ingestion', d: 'Server-side decryption streams Filecoin data directly into agent memory.' }
                                    ].map((step) => (
                                        <div key={step.n} style={{ display: 'flex', gap: '16px' }}>
                                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--bg-subtle)', border: '1px solid var(--border)', color: 'var(--text-2)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                                                {step.n}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 'bold', color: 'var(--text-1)', marginBottom: '4px' }}>{step.t}</div>
                                                <div style={{ fontSize: '14px', color: 'var(--text-2)' }}>{step.d}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            </section>

            {/* PRICING COMPARISON TABLE */}
            <section id="pricing" className="section-padding" style={{ background: 'var(--bg-card)' }}>
                <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                    <h2 className="section-title">Why DataForge?</h2>

                    <div className="card" style={{ overflow: 'hidden', marginTop: '48px' }}>
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
                                <tr>
                                    <td>Gumroad</td>
                                    <td>10%</td>
                                    <td>None</td>
                                    <td style={{ color: 'var(--text-3)' }}>✗</td>
                                </tr>
                                <tr>
                                    <td>AWS Data Exchange</td>
                                    <td>35%</td>
                                    <td>$10k/year</td>
                                    <td style={{ color: 'var(--text-3)' }}>✗</td>
                                </tr>
                                <tr>
                                    <td>Snowflake</td>
                                    <td>Custom</td>
                                    <td>Enterprise</td>
                                    <td style={{ color: 'var(--text-3)' }}>✗</td>
                                </tr>
                                <tr>
                                    <td>Kaggle</td>
                                    <td>—</td>
                                    <td>—</td>
                                    <td style={{ color: 'var(--text-3)' }}>✗</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            {/* TRUST SECTION */}
            <section className="section-padding" style={{ background: 'var(--bg-subtle)', borderTop: '1px solid var(--border)' }}>
                <div style={{ maxWidth: '900px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '32px' }}>
                    <Card style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: 'var(--r-md)', background: 'var(--brand-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand)' }}>
                            <Database />
                        </div>
                        <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-1)' }}>Your data lives forever</h3>
                        <p style={{ fontSize: '14px', color: 'var(--text-2)', lineHeight: '1.6' }}>
                            DataForge stores your information on a decentralized network of independent storage providers.
                            This ensures that your datasets are permanent, tamper-proof, and always accessible,
                            even if our platform goes offline.
                        </p>
                    </Card>

                    <Card style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: 'var(--r-md)', background: 'var(--brand-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand)' }}>
                            <Lock />
                        </div>
                        <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-1)' }}>Only buyers can access</h3>
                        <p style={{ fontSize: '14px', color: 'var(--text-2)', lineHeight: '1.6' }}>
                            We use advanced cryptographic access control to ensure that your data is only visible
                            to confirmed purchasers. Every transaction is verified on the blockchain before
                            access is granted, guaranteeing that only the rightful owners can view your files.
                        </p>
                    </Card>
                </div>
            </section>

            {/* FOOTER */}
            <footer className="section-padding" style={{ background: 'var(--bg-card)', borderTop: '1px solid var(--border)' }}>
                <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
                    <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: '48px', marginBottom: '48px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Database style={{ width: '24px', height: '24px', color: 'var(--brand)' }} />
                                <span style={{ fontSize: '20px', fontWeight: '600', color: 'var(--brand)' }}>DataForge</span>
                            </div>
                            <p style={{ fontSize: '14px', color: 'var(--text-2)', maxWidth: '300px' }}>
                                The decentralized data marketplace for the Filecoin ecosystem.
                            </p>
                        </div>

                        <div style={{ display: 'flex', gap: '64px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Protocol</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <Link to="/browse" style={{ fontSize: '14px', color: 'var(--text-2)' }}>Browse</Link>
                                    <Link to="/sell" style={{ fontSize: '14px', color: 'var(--text-2)' }}>Sell</Link>
                                    <a href="#" style={{ fontSize: '14px', color: 'var(--text-2)' }}>Docs</a>
                                </div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Community</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <a href="https://github.com/jerry/dataforge" target="_blank" rel="noopener noreferrer" style={{ fontSize: '14px', color: 'var(--text-2)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <Github style={{ width: '16px', height: '16px' }} /> GitHub
                                    </a>
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'right' }}>
                            <div style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Smart Contract</div>
                            <a
                                href="https://calibration.filfox.info/en/address/0x5e0d9D7d89cB375Cc9311815dF9cAdD2B0ea3315"
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    fontSize: '12px',
                                    color: 'var(--text-2)',
                                    fontFamily: 'var(--font-mono)',
                                    padding: '6px 12px',
                                    background: 'var(--bg-subtle)',
                                    borderRadius: '99px',
                                    textDecoration: 'none'
                                }}
                            >
                                0x5e0d...3315 <ExternalLink style={{ width: '12px', height: '12px' }} />
                            </a>
                        </div>
                    </div>

                    <div style={{ paddingTop: '32px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: 'var(--text-3)' }}>
                        <div>© 2025 DataForge Protocol. Built on Filecoin.</div>
                        <div style={{ display: 'flex', gap: '24px' }}>
                            <a href="#" style={{ color: 'inherit' }}>Privacy Policy</a>
                            <a href="#" style={{ color: 'inherit' }}>Terms of Service</a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    )
}
