"use client";
import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

const DISMISSED_KEY = "bcd_offer_dismissed_at";
const BOOKED_KEY    = "bcd_offer_booked";
const RESHOW_MS     = 90_000; // 1 min 30 sec

export default function DiscountPopup() {
  const [visible, setVisible] = useState(false);
  const [ctaHover, setCtaHover] = useState(false);


  useEffect(() => {
    // Never show again if user already reserved
    if (sessionStorage.getItem(BOOKED_KEY)) return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    async function init() {
      try {
        const res = await fetch('/api/cms/homepage');
        const data = await res.json();
        if (cancelled) return;

        // Admin controls popup via the "Popup" (homepage_sections.announcement) toggle
        const sections = data?.settings?.homepage_sections ?? {};
        // Default true if key missing; false only when explicitly set to false
        if (sections.announcement === false) return;
      } catch {
        // Network error — show popup anyway
      }

      if (cancelled) return;

      const dismissedAt = sessionStorage.getItem(DISMISSED_KEY);
      let delay = 700;

      if (dismissedAt) {
        const elapsed = Date.now() - Number(dismissedAt);
        const remaining = RESHOW_MS - elapsed;
        delay = remaining > 0 ? remaining : 0;
      }

      timer = setTimeout(() => {
        if (!cancelled) setVisible(true);
      }, delay);
    }

    init();
    return () => {
      cancelled = true;
      if (timer !== null) clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);



  const close = useCallback(() => {
    sessionStorage.setItem(DISMISSED_KEY, String(Date.now()));
    setVisible(false);
  }, []);

  const reserve = useCallback(() => {
    sessionStorage.setItem(BOOKED_KEY, "1");
    setVisible(false);
    window.location.href = "/reserve";
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    if (visible) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [visible, close]);

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Backdrop */}
          <motion.div
            key="bd"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={close}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 9998,
              background: "rgba(6, 16, 10, 0.6)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
            }}
          />

          {/* Card */}
          <motion.div
            key="card"
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 12 }}
            transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 9999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "20px",
              pointerEvents: "none",
            }}
          >
            <div
              style={{
                pointerEvents: "all",
                width: "100%",
                maxWidth: 460,
                borderRadius: 22,
                overflow: "hidden",
                background: "#fff",
                boxShadow:
                  "0 2px 4px rgba(0,0,0,0.04), 0 12px 40px rgba(0,0,0,0.14), 0 40px 80px rgba(0,0,0,0.08)",
              }}
            >

              {/* ── Hero section ── */}
              <div
                style={{
                  background: "#1a4a2e",
                  padding: "44px 44px 40px",
                  position: "relative",
                }}
              >
                {/* Close */}
                <button
                  onClick={close}
                  aria-label="Close"
                  style={{
                    position: "absolute",
                    top: 18,
                    right: 20,
                    width: 28,
                    height: 28,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "none",
                    border: "none",
                    color: "rgba(255,255,255,0.3)",
                    fontSize: 20,
                    lineHeight: 1,
                    cursor: "pointer",
                    padding: 0,
                    transition: "color 0.2s",
                    fontFamily: "Inter, sans-serif",
                    fontWeight: 300,
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.7)")}
                  onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.3)")}
                >
                  ×
                </button>

                {/* Eyebrow */}
                <p
                  style={{
                    margin: "0 0 20px",
                    fontSize: 10,
                    fontWeight: 600,
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.4)",
                    fontFamily: "Inter, sans-serif",
                  }}
                >
                  Online Reservation
                </p>

                {/* Headline */}
                <h2
                  style={{
                    margin: "0 0 6px",
                    fontFamily: "Inter, sans-serif",
                    fontWeight: 700,
                    fontSize: "clamp(36px, 7vw, 46px)",
                    lineHeight: 1.08,
                    letterSpacing: "-1.5px",
                    color: "#ffffff",
                  }}
                >
                  Enjoy{" "}
                  <span style={{ color: "#C89B3C" }}>10% OFF</span>
                </h2>
                <h2
                  style={{
                    margin: "0",
                    fontFamily: "Inter, sans-serif",
                    fontWeight: 700,
                    fontSize: "clamp(36px, 7vw, 46px)",
                    lineHeight: 1.08,
                    letterSpacing: "-1.5px",
                    color: "rgba(255,255,255,0.55)",
                  }}
                >
                  Your Final Bill
                </h2>
              </div>

              {/* ── Content section ── */}
              <div
                style={{
                  padding: "36px 44px 40px",
                  background: "#ffffff",
                }}
              >
                {/* Body */}
                <p
                  style={{
                    margin: "0 0 32px",
                    fontSize: 15,
                    lineHeight: 1.7,
                    color: "#6B7280",
                    fontFamily: "Inter, sans-serif",
                    fontWeight: 400,
                    letterSpacing: "0.01em",
                  }}
                >
                  Reserve your table through our website and receive a
                  10% discount on your final dine-in bill.
                </p>

                {/* Primary CTA */}
                <button
                  id="discount-popup-cta"
                  onClick={reserve}
                  onMouseEnter={() => setCtaHover(true)}
                  onMouseLeave={() => setCtaHover(false)}
                  style={{
                    display: "block",
                    width: "100%",
                    padding: "15px 24px",
                    background: ctaHover ? "#173f26" : "#1a4a2e",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: 11,
                    fontSize: 15,
                    fontWeight: 600,
                    fontFamily: "Inter, sans-serif",
                    letterSpacing: "0.015em",
                    cursor: "pointer",
                    transform: ctaHover ? "translateY(-2px)" : "translateY(0)",
                    boxShadow: ctaHover
                      ? "0 10px 32px -4px rgba(26,74,46,0.45)"
                      : "0 4px 16px -4px rgba(26,74,46,0.3)",
                    transition: "background 0.22s ease, box-shadow 0.22s ease, transform 0.2s ease",
                    textAlign: "center",
                  }}
                >
                  Reserve Your Table
                </button>

                {/* Secondary */}
                <button
                  onClick={close}
                  style={{
                    display: "block",
                    width: "100%",
                    marginTop: 14,
                    padding: "8px 0",
                    background: "none",
                    border: "none",
                    color: "#C0C9C4",
                    fontSize: 13,
                    fontFamily: "Inter, sans-serif",
                    fontWeight: 400,
                    cursor: "pointer",
                    transition: "color 0.2s",
                    textAlign: "center",
                    letterSpacing: "0.01em",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = "#9CA3AF")}
                  onMouseLeave={e => (e.currentTarget.style.color = "#C0C9C4")}
                >
                  Maybe later
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
