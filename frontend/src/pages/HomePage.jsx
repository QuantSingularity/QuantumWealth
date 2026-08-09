import { Link, useNavigate } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  Briefcase,
  ShieldCheck,
  Bot,
  Receipt,
  TrendingUp,
  Target,
  BarChart3,
  Layers,
  Search,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";

const FEATURES = [
  {
    icon: Briefcase,
    title: "Portfolio Optimizer",
    desc: "Mean Variance, Black Litterman, Risk Parity and Hierarchical Risk Parity allocation models.",
    accent: "gold",
  },
  {
    icon: ShieldCheck,
    title: "Risk Engine",
    desc: "Historical VaR, Parametric VaR, CVaR, Monte Carlo GBM simulation and five stress scenarios.",
    accent: "jade",
  },
  {
    icon: Bot,
    title: "AI Advisor",
    desc: "Goal based planning, ERC rebalancing and concentration detection for a hands off strategy.",
    accent: "gold",
  },
  {
    icon: TrendingUp,
    title: "Market Predictor",
    desc: "GBM price forecasting, rolling regime detection and RSI plus SMA technical indicators.",
    accent: "jade",
  },
  {
    icon: Receipt,
    title: "Tax Optimizer",
    desc: "Greedy harvest scheduling, after tax return modeling and a wash sale calendar.",
    accent: "gold",
  },
  {
    icon: Search,
    title: "Sentiment Analyzer",
    desc: "News scoring blended with momentum, volume and RSI for a composite market signal.",
    accent: "jade",
  },
  {
    icon: Layers,
    title: "Factor Models",
    desc: "Fama French five factor regression with BHB attribution and sector decomposition.",
    accent: "gold",
  },
  {
    icon: BarChart3,
    title: "Backtester",
    desc: "Event driven simulation with transaction costs and benchmark comparison.",
    accent: "jade",
  },
  {
    icon: Target,
    title: "Goal Planning",
    desc: "Track retirement, home and education goals with automated funding projections.",
    accent: "gold",
  },
];

const STATS = [
  { label: "Optimization Strategies", value: "4" },
  { label: "Risk Models", value: "8+" },
  { label: "AI Modules", value: "9" },
  { label: "Tax Scenarios", value: "6" },
];

export default function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-obsidian-950">
      {/* Navbar */}
      <header className="sticky top-0 z-30 border-b border-obsidian-700 bg-obsidian-950/85 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gold-500 to-gold-600 flex items-center justify-center shadow-gold">
              <Activity
                size={16}
                className="text-obsidian-950"
                strokeWidth={2.5}
              />
            </div>
            <span className="font-display font-semibold text-slate-100 text-lg tracking-tight">
              QuantumWealth
            </span>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <button
                onClick={() => navigate("/dashboard")}
                className="btn-primary flex items-center gap-2"
              >
                <span>Go to Dashboard</span>
                <ArrowRight size={15} />
              </button>
            ) : (
              <>
                <Link to="/login" className="btn-ghost">
                  Sign In
                </Link>
                <Link to="/register" className="btn-primary">
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(#e8b320 1px, transparent 1px), linear-gradient(90deg, #e8b320 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[36rem] h-[36rem] rounded-full bg-gold-500/5 blur-3xl" />

        <div className="relative max-w-5xl mx-auto px-6 pt-20 pb-16 text-center">
          <div className="accent-line mx-auto w-12 mb-6" />
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-semibold text-slate-100 leading-tight">
            Institutional grade
            <br />
            <span className="gradient-text-gold">wealth intelligence</span>
            <br />
            for every investor.
          </h1>
          <p className="text-slate-500 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto mt-6">
            AI powered portfolio optimization, real time risk analytics and
            automated tax loss harvesting, all in one platform.
          </p>

          <div className="flex items-center justify-center gap-3 mt-10">
            {user ? (
              <button
                onClick={() => navigate("/dashboard")}
                className="btn-primary flex items-center gap-2 px-6 py-3 text-base"
              >
                <span>Go to Dashboard</span>
                <ArrowRight size={16} />
              </button>
            ) : (
              <>
                <Link
                  to="/register"
                  className="btn-primary flex items-center gap-2 px-6 py-3 text-base"
                >
                  <span>Get Started</span>
                  <ArrowRight size={16} />
                </Link>
                <Link
                  to="/login"
                  className="btn-secondary px-6 py-3 text-base"
                >
                  Sign In
                </Link>
              </>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-16 max-w-2xl mx-auto">
            {STATS.map((s) => (
              <div
                key={s.label}
                className="p-4 rounded-xl bg-obsidian-800/60 border border-obsidian-600"
              >
                <p className="font-mono text-2xl font-semibold text-gold-400">
                  {s.value}
                </p>
                <p className="text-xs text-slate-500 mt-1 leading-tight">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <div className="accent-line mx-auto w-12 mb-4" />
          <h2 className="font-display text-3xl font-semibold text-slate-100">
            A full research desk, built in
          </h2>
          <p className="text-slate-500 text-sm mt-2 max-w-xl mx-auto">
            Every module runs on the same data pipeline so your allocation,
            risk and tax views always agree with each other.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map(({ icon: Icon, title, desc, accent }) => (
            <div key={title} className="card-hover p-5">
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center mb-4 ${
                  accent === "gold"
                    ? "bg-gold-500/10 text-gold-500"
                    : "bg-jade-500/10 text-jade-500"
                }`}
              >
                <Icon size={18} />
              </div>
              <h3 className="font-display text-lg font-semibold text-slate-100 mb-1.5">
                {title}
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why section */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <div className="card p-8 sm:p-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-jade-500/5 blur-3xl" />
          <div className="relative grid sm:grid-cols-2 gap-8">
            <div>
              <h2 className="font-display text-2xl font-semibold text-slate-100 mb-4">
                Why QuantumWealth
              </h2>
              <p className="text-slate-500 text-sm leading-relaxed">
                Most robo advisors give you a single model portfolio.
                QuantumWealth gives you the same optimization, risk and tax
                infrastructure used by institutional desks, wrapped in a
                platform you can actually use.
              </p>
            </div>
            <ul className="space-y-3">
              {[
                "Real time portfolio and risk analytics",
                "Automated tax loss harvesting scheduler",
                "Goal based financial planning",
                "Transparent, explainable AI recommendations",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <CheckCircle2
                    size={16}
                    className="text-jade-500 shrink-0 mt-0.5"
                  />
                  <span className="text-sm text-slate-300">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* CTA */}
      {!user && (
        <section className="max-w-3xl mx-auto px-6 py-16 text-center">
          <h2 className="font-display text-3xl font-semibold text-slate-100 mb-3">
            Ready to optimize your portfolio
          </h2>
          <p className="text-slate-500 text-sm mb-8">
            Create a free account and connect your first portfolio in
            minutes.
          </p>
          <Link
            to="/register"
            className="btn-primary inline-flex items-center gap-2 px-6 py-3 text-base"
          >
            <span>Create your account</span>
            <ArrowRight size={16} />
          </Link>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t border-obsidian-700 py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-slate-700">
            (c) {new Date().getFullYear()} QuantumWealth. For informational
            purposes only.
          </p>
          <div className="flex items-center gap-4 text-xs text-slate-600">
            {!user && (
              <>
                <Link
                  to="/login"
                  className="hover:text-slate-400 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="hover:text-slate-400 transition-colors"
                >
                  Create Account
                </Link>
              </>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
