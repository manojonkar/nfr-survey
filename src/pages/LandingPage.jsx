import { Link } from 'react-router-dom'
import { CheckCircle, ArrowRight, BarChart2, Users, Bell, Shield, Star, TrendingUp } from 'lucide-react'

const FEATURES = [
  { icon: BarChart2, title: 'Monthly 360° Surveys', desc: 'Every leader rated by 10 stakeholders on a −3 to +3 NFR scale. Same questions, fresh responses each month.' },
  { icon: TrendingUp, title: 'Trend Tracking', desc: 'Last month, 3-month rolling, and all-time average. Watch reliability improve quarter on quarter.' },
  { icon: Users,     title: 'Role-based Access', desc: 'HR sees all. Supervisors see their teams. Leaders see their own scores. Raters stay confidential.' },
  { icon: Bell,      title: 'Automated Reminders', desc: 'Email reminders on Day 1, 3 and 6. No one forgets. No one needs to chase the survey itself — truly NFR.' },
  { icon: Shield,    title: 'Company Isolation', desc: 'Each company gets its own secure workspace. Zero data crossover between organisations.' },
  { icon: Star,      title: 'PDF Reports', desc: 'Auto-generated branded reports sent to leader, supervisor and HR the moment the survey closes.' },
]

const STEPS = [
  { n: '01', title: 'Sign up your company', desc: 'Self-serve in 2 minutes. Free for 3 months.' },
  { n: '02', title: 'Add leaders & raters', desc: 'Upload a CSV or add people one by one.' },
  { n: '03', title: 'Survey runs automatically', desc: 'Opens 1st of each month, closes on the 7th.' },
  { n: '04', title: 'Results delivered instantly', desc: 'Leader, supervisor and HR receive the report the moment all raters submit.' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-sans">

      {/* Nav */}
      <nav className="border-b border-gray-100 px-6 py-4 flex items-center justify-between max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">N</span>
          </div>
          <span className="font-semibold text-gray-900">NFR<span className="text-brand-600">Company</span></span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">Sign in</Link>
          <Link to="/signup" className="btn btn-primary btn-sm">Start free trial</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-brand-50 text-brand-700 text-xs font-medium px-3 py-1.5 rounded-full mb-6">
          <Star size={12} /> Free for 3 months — no credit card required
        </div>
        <h1 className="text-5xl font-bold text-gray-900 leading-tight tracking-tight mb-6">
          Build a culture where<br />
          <span className="text-brand-600">no one needs to chase anyone</span>
        </h1>
        <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed">
          NFR (No Follow-up Required) is a monthly 360° feedback system that measures and improves
          professional reliability across your entire organisation.
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link to="/signup" className="btn btn-primary btn-lg">
            Start free trial <ArrowRight size={16} />
          </Link>
          <a href="#how" className="btn btn-lg">See how it works</a>
        </div>
        <div className="mt-8 flex items-center justify-center gap-6 text-sm text-gray-400">
          <span className="flex items-center gap-1"><CheckCircle size={14} className="text-green-500" /> 3-month free trial</span>
          <span className="flex items-center gap-1"><CheckCircle size={14} className="text-green-500" /> No credit card</span>
          <span className="flex items-center gap-1"><CheckCircle size={14} className="text-green-500" /> Setup in 15 minutes</span>
        </div>
      </section>

      {/* Score visual */}
      <section className="max-w-3xl mx-auto px-6 pb-20">
        <div className="bg-gradient-to-br from-brand-900 to-brand-700 rounded-3xl p-8 text-white">
          <div className="grid grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-4xl font-bold mb-1">+1.8</div>
              <div className="text-brand-200 text-sm">This month</div>
            </div>
            <div className="border-x border-brand-600 px-6">
              <div className="text-4xl font-bold mb-1">+1.5</div>
              <div className="text-brand-200 text-sm">3-month avg</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-1">+1.2</div>
              <div className="text-brand-200 text-sm">All-time avg</div>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-brand-600 text-center text-brand-200 text-sm">
            7 of 10 raters declared this person <strong className="text-white">NFR ✓</strong>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-gray-50 py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="text-xs font-semibold text-brand-600 uppercase tracking-widest mb-3">Platform features</div>
            <h2 className="text-3xl font-bold text-gray-900">Everything you need to run NFR at scale</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="card">
                <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center mb-4">
                  <Icon size={18} className="text-brand-600" />
                </div>
                <div className="font-semibold text-gray-900 mb-2">{title}</div>
                <div className="text-sm text-gray-500 leading-relaxed">{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="py-20 px-6 max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <div className="text-xs font-semibold text-brand-600 uppercase tracking-widest mb-3">How it works</div>
          <h2 className="text-3xl font-bold text-gray-900">Up and running in 15 minutes</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {STEPS.map(s => (
            <div key={s.n} className="flex gap-4 p-5 rounded-2xl border border-gray-100 hover:border-brand-200 transition-colors">
              <div className="text-3xl font-bold text-brand-100 flex-shrink-0">{s.n}</div>
              <div>
                <div className="font-semibold text-gray-900 mb-1">{s.title}</div>
                <div className="text-sm text-gray-500">{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-brand-600 py-20 px-6 text-center text-white">
        <h2 className="text-3xl font-bold mb-4">Ready to build an NFR culture?</h2>
        <p className="text-brand-200 mb-8 text-lg">Start your free 3-month trial today. No credit card required.</p>
        <Link to="/signup" className="inline-flex items-center gap-2 bg-white text-brand-600 font-semibold px-8 py-3 rounded-xl hover:bg-brand-50 transition-colors">
          Get started free <ArrowRight size={16} />
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 px-6 text-center text-xs text-gray-400">
        <div className="flex items-center justify-center gap-2 mb-2">
          <span>Powered by</span>
          <span className="font-semibold text-gray-600">Management Innovations</span>
          <span>· Vision to Implementation</span>
        </div>
        <div>© {new Date().getFullYear()} NFRCompany.com · All rights reserved</div>
      </footer>
    </div>
  )
}
