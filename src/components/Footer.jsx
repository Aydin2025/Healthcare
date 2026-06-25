export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__grid">
        <div>
          <div className="footer__logo">Riverside Physio +</div>
          <p style={{ marginTop: 12, maxWidth: 280 }}>
            One-on-one physiotherapy focused on how you move, not just where it hurts.
          </p>
        </div>
        <div>
          <h4>Contact</h4>
          <ul>
            <li>123 Placeholder St, Your City</li>
            <li>(000) 000-0000</li>
            <li>hello@yourclinic.com</li>
          </ul>
        </div>
        <div>
          <h4>Hours</h4>
          <ul>
            <li>Mon–Fri: 8am – 6pm</li>
            <li>Saturday: 9am – 1pm</li>
            <li>Sunday: Closed</li>
          </ul>
        </div>
      </div>
      <div className="container footer__bottom">
        © {new Date().getFullYear()} Riverside Physio. Placeholder content — replace before launch.
      </div>
    </footer>
  )
}
