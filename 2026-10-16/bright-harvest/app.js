import React from "react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer
      style={{
        background: "var(--color-ink)",
        color: "var(--color-cream)",
        marginTop: "120px",
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "64px 24px 32px",
        }}
      >
        {/* Top Section */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "48px",
            marginBottom: "64px",
          }}
        >
          {/* Brand */}
          <div>
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 900,
                fontSize: "1.5rem",
                marginBottom: "16px",
                letterSpacing: "-0.03em",
              }}
            >
              <span style={{ color: "var(--color-cream)" }}>Bright</span>{" "}
              <span style={{ color: "var(--color-harvest)" }}>Harvest</span>
            </div>
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "0.9rem",
                lineHeight: 1.7,
                color: "#9ca3af",
                maxWidth: "30ch",
              }}
            >
              A 501(c)(3) nonprofit fighting hunger and building food security
              across our community since 2009.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h3
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.7rem",
                fontWeight: 500,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "#9ca3af",
                marginBottom: "16px",
              }}
            >
              Navigate
            </h3>
            <nav aria-label="Footer navigation">
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "10px" }}>
                <li>
                  <Link to="/" style={{ color: "var(--color-cream)", textDecoration: "none", fontSize: "0.9rem", fontFamily: "var(--font-body)" }}>
                    Home
                  </Link>
                </li>
                <li>
                  <Link to="/programs" style={{ color: "var(--color-cream)", textDecoration: "none", fontSize: "0.9rem", fontFamily: "var(--font-body)" }}>
                    Programs
                  </Link>
                </li>
                <li>
                  <Link to="/donate" style={{ color: "var(--color-cream)", textDecoration: "none", fontSize: "0.9rem", fontFamily: "var(--font-body)" }}>
                    Donate
                  </Link>
                </li>
                <li>
                  <Link to="/volunteer" style={{ color: "var(--color-cream)", textDecoration: "none", fontSize: "0.9rem", fontFamily: "var(--font-body)" }}>
                    Volunteer
                  </Link>
                </li>
                <li>
                  <Link to="/stories" style={{ color: "var(--color-cream)", textDecoration: "none", fontSize: "0.9rem", fontFamily: "var(--font-body)" }}>
                    Stories
                  </Link>
                </li>
              </ul>
            </nav>
          </div>

          {/* Contact */}
          <div>
            <h3
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.7rem",
                fontWeight: 500,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "#9ca3af",
                marginBottom: "16px",
              }}
            >
              Contact
            </h3>
            <address style={{ fontStyle: "normal", fontSize: "0.9rem", lineHeight: 1.8, color: "#d1d5db" }}>
              <div>1247 Orchard Lane</div>
              <div>Greenfield, CA 93927</div>
              <div style={{ marginTop: "8px" }}>
                <a href="tel:+18315551247" style={{ color: "var(--color-harvest)", textDecoration: "none" }}>
                  (831) 555-1247
                </a>
              </div>
              <div>
                <a href="mailto:hello@brightharvest.org" style={{ color: "var(--color-harvest)", textDecoration: "none" }}>
                  hello@brightharvest.org
                </a>
              </div>
            </address>
          </div>

          {/* Hours */}
          <div>
            <h3
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.7rem",
                fontWeight: 500,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "#9ca3af",
                marginBottom: "16px",
              }}
            >
              Distribution Hours
            </h3>
            <div style={{ fontSize: "0.9rem", lineHeight: 1.8, color: "#d1d5db" }}>
              <div>Tue–Fri: 9 AM – 5 PM</div>
              <div>Saturday: 8 AM – 1 PM</div>
              <div>Sun–Mon: Closed</div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <hr className="hairline" style={{ background: "#374151", marginBottom: "24px" }} />
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "16px",
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.7rem",
              color: "#6b7280",
              margin: 0,
            }}
          >
            © 2024 Bright Harvest Food Bank. EIN: 77-1234567
          </p>
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.7rem",
              color: "#6b7280",
              margin: 0,
            }}
          >
            All donations are tax-deductible.
          </p>
        </div>
      </div>
    </footer>
  );
}