import { useState, useMemo } from 'react';
import { Landmark, ChevronRight } from 'lucide-react';
import '../../styles/mortgageCalculator.css';

const ANNUAL_RATE = 24; // % — Biznes Ipoteka
const MAX_LOAN_PCT = 75; // Shartnoma summasining 75% gacha
const MIN_DOWN_PCT = 100 - MAX_LOAN_PCT; // 25% minimal boshlang'ich to'lov
const DOWN_PAYMENT_OPTIONS = [25, 40, 50, 60];
const YEAR_OPTIONS = [1, 3, 5, 7, 10]; // 120 oygacha

export default function MortgageCalculator({ price }) {
  const [step, setStep] = useState(1);
  const [downPct, setDownPct] = useState(MIN_DOWN_PCT);
  const [years, setYears] = useState(5);

  const calc = useMemo(() => {
    const downPayment = Math.round(price * (downPct / 100));
    const loanAmount = price - downPayment;
    const totalInterest = Math.round(loanAmount * (ANNUAL_RATE / 100) * years);
    const totalToPay = loanAmount + totalInterest;
    const monthlyPayment = Math.round(totalToPay / (years * 12));
    const grandTotal = downPayment + totalToPay;
    return { downPayment, loanAmount, totalInterest, totalToPay, monthlyPayment, grandTotal };
  }, [price, downPct, years]);

  const fmt = (n) => n.toLocaleString('en-US').replace(/,/g, ' ') + " so'm";

  return (
    <div className="mc-card">
      <div className="mc-header">
        <Landmark size={20} className="mc-icon" />
        <h3>Universal Bank — Biznes Ipoteka</h3>
      </div>
      <p className="mc-desc">
        Shartnoma summasining <strong>75%</strong>igacha, yillik <strong>24%</strong> stavkada,{' '}
        <strong>120 oygacha</strong> muddatga. Kredit bo'yicha <strong>12 oygacha imtiyozli davr</strong> mavjud.
      </p>

      <div className="mc-body">
        <div className="mc-steps">
          <div className={`mc-step ${step === 1 ? 'active' : ''}`}>
            <span className="mc-step-num">1</span>
            <div className="mc-step-content">
              <h4>Boshlang'ich to'lov</h4>
              <p>Minimal — {MIN_DOWN_PCT}% (kredit 75%gacha)</p>
              <div className="mc-options">
                {DOWN_PAYMENT_OPTIONS.map((p) => (
                  <button key={p} className={downPct === p ? 'active' : ''} onClick={() => { setDownPct(p); setStep(2); }}>
                    {p}%
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className={`mc-step ${step === 2 ? 'active' : ''}`}>
            <span className="mc-step-num">2</span>
            <div className="mc-step-content">
              <h4>To'lov muddati</h4>
              <p>Yillik foiz stavkasi — {ANNUAL_RATE}%</p>
              <div className="mc-options">
                {YEAR_OPTIONS.map((y) => (
                  <button key={y} className={years === y ? 'active' : ''} onClick={() => { setYears(y); setStep(3); }}>
                    {y} yil
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className={`mc-step ${step === 3 ? 'active' : ''}`}>
            <span className="mc-step-num">3</span>
            <div className="mc-step-content">
              <h4>Yakuniy hisob-kitob</h4>
              <p>Avtomatik hisoblangan</p>
            </div>
          </div>
        </div>

        <div className="mc-result">
          <div className="mc-result-row">
            <span>Lokatsiya narxi</span>
            <strong>{fmt(price)}</strong>
          </div>
          <div className="mc-result-row mc-highlight">
            <span>Boshlang'ich to'lov ({downPct}%)</span>
            <strong>{fmt(calc.downPayment)}</strong>
          </div>
          <div className="mc-result-row">
            <span>Kredit summasi</span>
            <strong>{fmt(calc.loanAmount)}</strong>
          </div>
          <div className="mc-result-row">
            <span>Foiz ({ANNUAL_RATE}% × {years} yil)</span>
            <strong>{fmt(calc.totalInterest)}</strong>
          </div>
          <div className="mc-result-divider" />
          <div className="mc-result-row mc-total">
            <span>Oylik to'lov</span>
            <strong>{fmt(calc.monthlyPayment)}</strong>
          </div>
          <div className="mc-result-row mc-grand-total">
            <span>Umumiy to'lanadigan summa</span>
            <strong>{fmt(calc.grandTotal)}</strong>
          </div>

          <button className="mc-apply-btn">
            Ipotekaga ariza berish <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}