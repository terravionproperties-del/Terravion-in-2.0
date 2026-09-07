"use client";

import { useState } from "react";

interface BookVisitModalProps {
  onClose: () => void;
}

export default function BookVisitModal({ onClose }: BookVisitModalProps) {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    date: "",
    plotPreference: "300sqyd",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(43, 43, 43, 0.18)", backdropFilter: "blur(20px)" }}
    >
      <div className="relative w-full max-w-lg rounded-3xl p-10 glass" style={{
        boxShadow: "0 32px 80px rgba(43,43,43,0.10), 0 1px 3px rgba(43,43,43,0.04)"
      }}>
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute right-6 top-6 flex h-10 w-10 items-center justify-center rounded-full border border-gold/20 text-stone-grey transition-all duration-300 hover:border-gold/50 hover:text-charcoal"
          aria-label="Close modal"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M1 1l12 12M13 1L1 13" />
          </svg>
        </button>

        {submitted ? (
          <div className="py-6 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-gold/30 bg-gold/10">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gold-ink">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>
            <h3 className="display text-3xl text-charcoal">Visit Requested</h3>
            <p className="mt-4 text-sm leading-relaxed text-stone-grey">
              Thank you, {formData.name || "valued guest"}. Our Shankarpally
              team will contact you within 1 hour to confirm your site tour
              details and complimentary cab pickup.
            </p>
            <button onClick={onClose} className="btn-gold mt-8">
              Return to Experience
            </button>
          </div>
        ) : (
          <div>
            <span className="label text-gold-ink">EXCLUSIVE SITE TOUR</span>
            <h3 className="display mt-3 text-3xl text-charcoal">
              Book a Site Visit to <br />
              <em className="text-gold-ink">Shankarpally.</em>
            </h3>
            <p className="mt-3 text-xs leading-relaxed text-stone-grey">
              Complimentary AC cab pickup & drop from Financial District.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <div className="field-luxury">
                <label>Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ananya Sharma"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div className="field-luxury">
                  <label>Mobile Number</label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div className="field-luxury">
                  <label>Preferred Date</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>
              </div>

              <div className="field-luxury">
                <label>Plot Size Preference</label>
                <select
                  value={formData.plotPreference}
                  onChange={(e) => setFormData({ ...formData, plotPreference: e.target.value })}
                >
                  <option value="200sqyd">200 Sq. Yards Villa Plot</option>
                  <option value="300sqyd">300 Sq. Yards Villa Plot</option>
                  <option value="500sqyd">500 Sq. Yards Premium Plot</option>
                  <option value="1000sqyd">1,000 Sq. Yards Estate Plot</option>
                </select>
              </div>

              <button type="submit" className="btn-gold mt-4 w-full">
                Confirm Site Tour Request
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
