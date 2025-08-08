
'use client';
import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Slider } from '../components/ui/slider';
import { Label } from '../components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts';

function num(v) {
  const n = typeof v === 'string' ? parseFloat(v) : v;
  return Number.isFinite(n) ? n : 0;
}
function currencyFmt(v, currency) {
  try { return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(v); }
  catch { return `${v.toFixed(0)} ${currency}`; }
}
function amortizedMonthlyPayment({ principal, annualRate, years }) {
  const r = annualRate / 12;
  const n = years * 12;
  if (principal <= 0 || annualRate === 0 || n === 0) return principal / Math.max(n,1);
  const pmt = (principal * r) / (1 - Math.pow(1 + r, -n));
  return pmt;
}

export default function Page() {
  const [currency, setCurrency] = useState('USD');
  const [timeframe, setTimeframe] = useState('monthly');
  const [purchaseCost, setPurchaseCost] = useState(200000);
  const [annualDays, setAnnualDays] = useState(250);
  const [hoursPerDay, setHoursPerDay] = useState(8);
  const [hourlyRate, setHourlyRate] = useState(120);
  const [utilization, setUtilization] = useState(70);
  const [baseAnnualOpex, setBaseAnnualOpex] = useState(60000);
  const [powerKW, setPowerKW] = useState(30);
  const [kwhRate, setKwhRate] = useState(0.12);
  const [gasCostPerHour, setGasCostPerHour] = useState(8);
  const [maintenancePerYear, setMaintenancePerYear] = useState(8000);
  const [freightAndImport, setFreightAndImport] = useState(18000);
  const [useFinance, setUseFinance] = useState(true);
  const [downPaymentPct, setDownPaymentPct] = useState(20);
  const [loanYears, setLoanYears] = useState(3);
  const [annualInterestPct, setAnnualInterestPct] = useState(7.5);
  const [discountRatePct, setDiscountRatePct] = useState(12);
  const [horizonYears, setHorizonYears] = useState(5);

  const derived = useMemo(() => {
    const hoursPerYear = annualDays * hoursPerDay * (utilization / 100);
    const energyAnnual = powerKW * kwhRate * hoursPerYear;
    const gasAnnual = gasCostPerHour * hoursPerYear;
    const opexAnnual = baseAnnualOpex + energyAnnual + gasAnnual + maintenancePerYear;
    const revenueAnnual = hourlyRate * hoursPerYear;
    const ebitdaAnnual = revenueAnnual - opexAnnual;
    const capex = purchaseCost + freightAndImport;
    const downPayment = useFinance ? (downPaymentPct / 100) * capex : capex;
    const loanPrincipal = useFinance ? capex - downPayment : 0;
    const loanAPR = annualInterestPct / 100;
    const monthlyDebt = useFinance ? amortizedMonthlyPayment({ principal: loanPrincipal, annualRate: loanAPR, years: loanYears }) : 0;
    const months = horizonYears * 12;
    const monthlyRevenue = revenueAnnual / 12;
    const monthlyOpex = opexAnnual / 12;
    const discountMonthly = Math.pow(1 + discountRatePct / 100, 1/12) - 1;
    let cum = -downPayment;
    let cumNPV = -downPayment;
    let paybackMonth = null;
    const timeline = Array.from({ length: months }, (_, i) => {
      const cash = monthlyRevenue - monthlyOpex - monthlyDebt;
      cum += cash;
      const npvCash = cash / Math.pow(1 + discountMonthly, i + 1);
      cumNPV += npvCash;
      if (paybackMonth === null && cum >= 0) paybackMonth = i + 1;
      const year = Math.floor(i / 12) + 1;
      return { t: i + 1, label: timeframe === 'monthly' ? `M${i + 1}` : `Y${year}`, cum, cash, cumNPV };
    });
    const paybackYears = paybackMonth ? paybackMonth / 12 : null;
    const npv = cumNPV;
    const irrApprox = (() => {
      const flows = [ -downPayment, ...timeline.map(d => d.cash) ];
      let r0 = 0.01, r1 = 0.03;
      const f = (r) => flows.reduce((acc, cf, idx) => acc + cf / Math.pow(1 + r, idx), 0);
      let y0 = f(r0), y1 = f(r1);
      for (let k = 0; k < 40; k++) {
        const r2 = r1 - y1 * (r1 - r0) / (y1 - y0 + 1e-9);
        const y2 = f(r2);
        r0 = r1; y0 = y1; r1 = r2; y1 = y2;
        if (Math.abs(y2) < 1e-6) break;
      }
      const annualized = Math.pow(1 + r1, 12) - 1;
      return isFinite(annualized) ? annualized : null;
    })();
    const chartData = timeframe === 'monthly' ? timeline :
      Array.from({ length: horizonYears }, (_, y) => {
        const slice = timeline.slice(y * 12, (y + 1) * 12);
        return {
          t: (y + 1) * 12,
          label: `Y${y + 1}`,
          cash: slice.reduce((s, d) => s + d.cash, 0),
          cum: slice.at(-1)?.cum ?? 0,
          cumNPV: slice.reduce((s, d, i) => s + d.cash / Math.pow(1 + discountMonthly, y * 12 + i + 1), 0) + (y === 0 ? -downPayment : 0),
        };
      });
    return { hoursPerYear, energyAnnual, gasAnnual, opexAnnual, revenueAnnual, ebitdaAnnual,
      capex, downPayment, loanPrincipal, monthlyDebt, npv, irrApprox, paybackYears, chartData };
  }, [annualDays, hoursPerDay, utilization, powerKW, kwhRate, gasCostPerHour, maintenancePerYear, baseAnnualOpex, hourlyRate, purchaseCost, freightAndImport, useFinance, downPaymentPct, loanYears, annualInterestPct, horizonYears, discountRatePct, timeframe]);

  const reset = () => {
    setCurrency('USD'); setTimeframe('monthly'); setPurchaseCost(200000); setAnnualDays(250); setHoursPerDay(8);
    setHourlyRate(120); setUtilization(70); setBaseAnnualOpex(60000); setPowerKW(30); setKwhRate(0.12);
    setGasCostPerHour(8); setMaintenancePerYear(8000); setFreightAndImport(18000); setUseFinance(true);
    setDownPaymentPct(20); setLoanYears(3); setAnnualInterestPct(7.5); setDiscountRatePct(12); setHorizonYears(5);
  };

  const KPI = ({ label, value }) => (
    <div className="flex flex-col p-3 rounded-xl bg-neutral-50">
      <span className="text-xs text-neutral-500">{label}</span>
      <span className="text-lg font-semibold">{value}</span>
    </div>
  );

  return (
    <div className="min-h-screen w-full p-4 md:p-8 grid gap-4 md:gap-6 bg-white text-neutral-900">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-bold">Metal Workshop ROI Calculator</h1>
        <div className="flex items-center gap-2">
          <Button onClick={reset} className="gap-2">Reset</Button>
        </div>
      </div>

      <Tabs>
        <TabsList className="grid grid-cols-2 w-full md:w-auto">
          <TabsTrigger value="monthly" active={timeframe==='monthly'} onClick={()=>setTimeframe('monthly')}>Monthly View</TabsTrigger>
          <TabsTrigger value="yearly" active={timeframe==='yearly'} onClick={()=>setTimeframe('yearly')}>Yearly View</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader><CardTitle>Revenue & Utilization</CardTitle></CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid grid-cols-2 gap-3 items-center">
              <Label>Currency</Label>
              <Input value={currency} onChange={(e)=>setCurrency(e.target.value.toUpperCase())}/>

              <Label>Hourly Rate</Label>
              <Input type="number" value={hourlyRate} onChange={(e)=>setHourlyRate(num(e.target.value))}/>

              <Label>Annual Operating Days</Label>
              <Input type="number" value={annualDays} onChange={(e)=>setAnnualDays(num(e.target.value))}/>

              <Label>Hours per Day</Label>
              <Input type="number" value={hoursPerDay} onChange={(e)=>setHoursPerDay(num(e.target.value))}/>

              <Label className="col-span-2">Utilization: {utilization}%</Label>
              <div className="col-span-2"><Slider value={[utilization]} onValueChange={(v)=>setUtilization(v[0])} min={10} max={100} step={1}/></div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Operating Costs</CardTitle></CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid grid-cols-2 gap-3 items-center">
              <Label>Base Annual OPEX</Label>
              <Input type="number" value={baseAnnualOpex} onChange={(e)=>setBaseAnnualOpex(num(e.target.value))}/>

              <Label>Avg Power Draw (kW)</Label>
              <Input type="number" value={powerKW} onChange={(e)=>setPowerKW(num(e.target.value))}/>

              <Label>Electricity Rate (/kWh)</Label>
              <Input type="number" value={kwhRate} onChange={(e)=>setKwhRate(num(e.target.value))}/>

              <Label>Assist Gas Cost (/hour)</Label>
              <Input type="number" value={gasCostPerHour} onChange={(e)=>setGasCostPerHour(num(e.target.value))}/>

              <Label>Maintenance per Year</Label>
              <Input type="number" value={maintenancePerYear} onChange={(e)=>setMaintenancePerYear(num(e.target.value))}/>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>CAPEX, Import & Finance</CardTitle></CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid grid-cols-2 gap-3 items-center">
              <Label>Machine Purchase Cost</Label>
              <Input type="number" value={purchaseCost} onChange={(e)=>setPurchaseCost(num(e.target.value))}/>

              <Label>Freight & Import (once)</Label>
              <Input type="number" value={freightAndImport} onChange={(e)=>setFreightAndImport(num(e.target.value))}/>

              <div className="col-span-2 flex items-center justify-between">
                <Label>Use Financing</Label>
                <Button onClick={()=>setUseFinance(!useFinance)}>{useFinance ? 'Enabled' : 'Disabled'}</Button>
              </div>

              <Label>Down Payment (%)</Label>
              <Input type="number" value={downPaymentPct} onChange={(e)=>setDownPaymentPct(num(e.target.value))} disabled={!useFinance}/>

              <Label>Loan Term (years)</Label>
              <Input type="number" value={loanYears} onChange={(e)=>setLoanYears(num(e.target.value))} disabled={!useFinance}/>

              <Label>Interest (APR %)</Label>
              <Input type="number" value={annualInterestPct} onChange={(e)=>setAnnualInterestPct(num(e.target.value))} disabled={!useFinance}/>

              <Label>Discount Rate (%/yr)</Label>
              <Input type="number" value={discountRatePct} onChange={(e)=>setDiscountRatePct(num(e.target.value))}/>

              <Label>Horizon (years)</Label>
              <Input type="number" value={horizonYears} onChange={(e)=>setHorizonYears(num(e.target.value))}/>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <KPI label="Annual Revenue" value={currencyFmt(derived.revenueAnnual, currency)} />
        <KPI label="Annual OPEX" value={currencyFmt(derived.opexAnnual, currency)} />
        <KPI label="EBITDA (Annual)" value={currencyFmt(derived.ebitdaAnnual, currency)} />
        <KPI label="Monthly Debt" value={currencyFmt(derived.monthlyDebt, currency)} />
        <KPI label="Payback" value={derived.paybackYears ? `${derived.paybackYears.toFixed(2)} yrs` : '> Horizon'} />
      </div>

      <Card>
        <CardHeader><CardTitle>Cumulative Cash Flow ({timeframe==='monthly' ? 'Monthly' : 'Yearly'})</CardTitle></CardHeader>
        <CardContent className="h-72 md:h-96">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={derived.chartData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip formatter={(v)=>currencyFmt(Number(v), currency)} />
              <ReferenceLine y={0} stroke="#888" strokeDasharray="4 4" />
              <Line type="monotone" dataKey="cum" name="Cumulative" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader><CardTitle>Annual Hours & Costs</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span>Billable Hours/Year</span><span>{derived.hoursPerYear.toFixed(0)}</span></div>
            <div className="flex justify-between"><span>Energy Cost/Year</span><span>{currencyFmt(derived.energyAnnual, currency)}</span></div>
            <div className="flex justify-between"><span>Assist Gas/Year</span><span>{currencyFmt(derived.gasAnnual, currency)}</span></div>
            <div className="flex justify-between"><span>Maintenance/Year</span><span>{currencyFmt(maintenancePerYear, currency)}</span></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>CAPEX & Finance</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span>Total CAPEX</span><span>{currencyFmt(purchaseCost + freightAndImport, currency)}</span></div>
            <div className="flex justify-between"><span>Down Payment</span><span>{currencyFmt(derived.downPayment, currency)}</span></div>
            <div className="flex justify-between"><span>Loan Principal</span><span>{currencyFmt(derived.loanPrincipal, currency)}</span></div>
            <div className="flex justify-between"><span>NPV ({discountRatePct}%/yr)</span><span>{currencyFmt(derived.npv, currency)}</span></div>
            <div className="flex justify-between"><span>IRR (approx)</span><span>{derived.irrApprox ? `${(derived.irrApprox*100).toFixed(1)}%` : 'N/A'}</span></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Notes</CardTitle></CardHeader>
          <CardContent className="text-sm text-neutral-600 space-y-2">
            <p>• Utilization applies to billable cutting hours only. Base OPEX excludes finance cost and is separate from energy/gas.</p>
            <p>• Change Currency code (e.g., MAD, USD, EUR). Display only—no FX conversion applied.</p>
            <p>• Freight & Import should include duties, VAT (if capitalized), port/brokerage, and installation where applicable.</p>
          </CardContent>
        </Card>
      </div>

      <div className="text-xs text-neutral-500 mt-2">Tip: Toggle Monthly/Yearly to change the chart aggregation. All metrics update instantly as you change inputs.</div>
    </div>
  );
}

function KPI({ label, value }) {
  return (
    <div className="flex flex-col p-3 rounded-xl bg-neutral-50">
      <span className="text-xs text-neutral-500">{label}</span>
      <span className="text-lg font-semibold">{value}</span>
    </div>
  );
}
