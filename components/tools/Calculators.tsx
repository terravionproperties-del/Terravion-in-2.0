"use client";

import { useMemo, useState } from "react";
import { LOCALE_META, type Locale } from "@/lib/i18n/config";

/**
 * Currency and percentages are formatted for the reader, not for the office.
 *
 * The previous version hard-coded `en-IN`, so a Telugu page rendered Latin
 * digits and an English grouping while every sentence around it was Telugu.
 * `Intl` already knows how each script writes a lakh; all it needed was the
 * right BCP-47 tag, which the locale carries.
 */
function useFormatters(locale: Locale) {
  return useMemo(() => {
    const tag = LOCALE_META[locale].bcp47;
    const currency = new Intl.NumberFormat(tag, {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    });
    const decimal = new Intl.NumberFormat(tag, {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    });
    const plain = new Intl.NumberFormat(tag, { maximumFractionDigits: 0 });
    const ratio = new Intl.NumberFormat(tag, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return {
      money: (v: number) => currency.format(v),
      percent: (v: number) => `${decimal.format(v)}%`,
      count: (v: number) => plain.format(v),
      ratio: (v: number) => `${ratio.format(v)}×`,
    };
  }, [locale]);
}

function Slider({
  id,
  label,
  value,
  onChange,
  min,
  max,
  step,
  format,
}: {
  /** Explicit, because a slug derived from a Telugu label is not a valid id. */
  id: string;
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  format: (v: number) => string;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-4">
        <label htmlFor={id} className="label text-text-muted">
          {label}
        </label>
        <span className="display text-xl text-ink">{format(value)}</span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-3 h-1 w-full cursor-pointer appearance-none rounded-full bg-charcoal/15 accent-[#b08d46]"
      />
    </div>
  );
}

export interface EmiStrings {
  loanAmount: string;
  interestRate: string;
  tenure: string;
  monthlyEmi: string;
  totalInterest: string;
  totalPayable: string;
  disclaimer: string;
  /** "{count} yrs", already localised; the count is substituted here. */
  years: string;
}

/**
 * EMI calculator — standard reducing-balance formula. Client-side only;
 * figures are illustrations, not offers.
 */
export function EmiCalculator({
  locale,
  strings,
}: {
  locale: Locale;
  strings: EmiStrings;
}) {
  const [principal, setPrincipal] = useState(4500000);
  const [rate, setRate] = useState(9);
  const [years, setYears] = useState(15);
  const fmt = useFormatters(locale);

  const { emi, totalInterest, total } = useMemo(() => {
    const r = rate / 12 / 100;
    const n = years * 12;
    const emiV =
      r === 0 ? principal / n : (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    return {
      emi: emiV,
      totalInterest: emiV * n - principal,
      total: emiV * n,
    };
  }, [principal, rate, years]);

  return (
    <div className="rounded-3xl border border-ink/10 bg-white p-8 md:p-12">
      <div className="grid gap-10 md:grid-cols-2 md:gap-16">
        <div className="flex flex-col gap-8">
          <Slider
            id="emi-loan-amount"
            label={strings.loanAmount}
            value={principal}
            onChange={setPrincipal}
            min={500000}
            max={30000000}
            step={100000}
            format={fmt.money}
          />
          <Slider
            id="emi-interest-rate"
            label={strings.interestRate}
            value={rate}
            onChange={setRate}
            min={6}
            max={15}
            step={0.1}
            format={fmt.percent}
          />
          <Slider
            id="emi-tenure"
            label={strings.tenure}
            value={years}
            onChange={setYears}
            min={1}
            max={30}
            step={1}
            format={(v) => strings.years.replace("{count}", fmt.count(v))}
          />
        </div>
        <div className="flex flex-col justify-center gap-6 border-t border-ink/10 pt-8 md:border-l md:border-t-0 md:ps-16 md:pt-0">
          <div>
            <p className="label text-text-muted">{strings.monthlyEmi}</p>
            <p className="display mt-1 text-4xl text-gold-ink md:text-5xl">{fmt.money(emi)}</p>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="label text-text-muted">{strings.totalInterest}</p>
              <p className="display mt-1 text-xl text-ink">{fmt.money(totalInterest)}</p>
            </div>
            <div>
              <p className="label text-text-muted">{strings.totalPayable}</p>
              <p className="display mt-1 text-xl text-ink">{fmt.money(total)}</p>
            </div>
          </div>
        </div>
      </div>
      <p className="mt-8 border-t border-ink/10 pt-6 text-xs leading-relaxed text-text-muted">
        {strings.disclaimer}
      </p>
    </div>
  );
}

export interface RoiStrings {
  purchaseValue: string;
  holdingPeriod: string;
  cagr: string;
  projectedValue: string;
  projectedGain: string;
  multiple: string;
  disclaimerBefore: string;
  disclaimerStrong: string;
  disclaimerAfter: string;
  years: string;
}

/**
 * ROI scenario tool — the visitor chooses every assumption. We deliberately
 * ship no default "expected return": the CAGR slider starts at 0.
 */
export function RoiCalculator({
  locale,
  strings,
}: {
  locale: Locale;
  strings: RoiStrings;
}) {
  const [price, setPrice] = useState(4500000);
  const [years, setYears] = useState(10);
  const [cagr, setCagr] = useState(0);
  const fmt = useFormatters(locale);

  const { future, gain, multiple } = useMemo(() => {
    const f = price * Math.pow(1 + cagr / 100, years);
    return { future: f, gain: f - price, multiple: f / price };
  }, [price, years, cagr]);

  return (
    <div className="rounded-3xl border border-ink/10 bg-white p-8 md:p-12">
      <div className="grid gap-10 md:grid-cols-2 md:gap-16">
        <div className="flex flex-col gap-8">
          <Slider
            id="roi-purchase-value"
            label={strings.purchaseValue}
            value={price}
            onChange={setPrice}
            min={1000000}
            max={50000000}
            step={100000}
            format={fmt.money}
          />
          <Slider
            id="roi-holding-period"
            label={strings.holdingPeriod}
            value={years}
            onChange={setYears}
            min={1}
            max={25}
            step={1}
            format={(v) => strings.years.replace("{count}", fmt.count(v))}
          />
          <Slider
            id="roi-cagr"
            label={strings.cagr}
            value={cagr}
            onChange={setCagr}
            min={0}
            max={25}
            step={0.5}
            format={fmt.percent}
          />
        </div>
        <div className="flex flex-col justify-center gap-6 border-t border-ink/10 pt-8 md:border-l md:border-t-0 md:ps-16 md:pt-0">
          <div>
            <p className="label text-text-muted">{strings.projectedValue}</p>
            <p className="display mt-1 text-4xl text-gold-ink md:text-5xl">{fmt.money(future)}</p>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="label text-text-muted">{strings.projectedGain}</p>
              <p className="display mt-1 text-xl text-ink">{fmt.money(gain)}</p>
            </div>
            <div>
              <p className="label text-text-muted">{strings.multiple}</p>
              <p className="display mt-1 text-xl text-ink">{fmt.ratio(multiple)}</p>
            </div>
          </div>
        </div>
      </div>
      <p className="mt-8 border-t border-ink/10 pt-6 text-xs leading-relaxed text-text-muted">
        {strings.disclaimerBefore} <strong>{strings.disclaimerStrong}</strong>
        {strings.disclaimerAfter}
      </p>
    </div>
  );
}
