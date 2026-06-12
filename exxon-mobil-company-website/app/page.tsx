'use client'

import { Menu, X, ArrowRight, ChevronDown } from 'lucide-react'
import { useState } from 'react'

export default function Page() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <span className="text-xl font-bold text-primary-foreground">EM</span>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold text-foreground">ExxonMobil Cepu</h1>
              <p className="text-xs text-muted-foreground">Limited Company</p>
            </div>
          </div>

          {/* Desktop Menu */}
          <div className="hidden gap-8 md:flex">
            <a href="#about" className="text-sm font-medium hover:text-primary transition">About</a>
            <a href="#operations" className="text-sm font-medium hover:text-primary transition">Operations</a>
            <a href="#sustainability" className="text-sm font-medium hover:text-primary transition">Sustainability</a>
            <a href="#investors" className="text-sm font-medium hover:text-primary transition">Investors</a>
          </div>

          {/* CTA Button - Desktop */}
          <button className="hidden md:flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition">
            Contact Us <ArrowRight className="h-4 w-4" />
          </button>

          {/* Mobile Menu Button */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="border-t border-border bg-card/50 px-4 py-4 md:hidden">
            <div className="flex flex-col gap-3">
              <a href="#about" className="block text-sm font-medium hover:text-primary">About</a>
              <a href="#operations" className="block text-sm font-medium hover:text-primary">Operations</a>
              <a href="#sustainability" className="block text-sm font-medium hover:text-primary">Sustainability</a>
              <a href="#investors" className="block text-sm font-medium hover:text-primary">Investors</a>
              <button className="mt-2 w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
                Contact Us
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 items-center">
            <div className="space-y-6">
              <h2 className="text-balance text-4xl font-bold tracking-tight md:text-5xl">
                Leading the Future of Energy
              </h2>
              <p className="text-balance text-lg text-muted-foreground">
                ExxonMobil Cepu Limited Company is committed to delivering reliable energy and advanced technologies while driving sustainable growth and innovation for a better tomorrow.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <button className="rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground hover:opacity-90 transition flex items-center justify-center gap-2">
                  Explore Our Story <ArrowRight className="h-4 w-4" />
                </button>
                <button className="rounded-lg border border-primary px-6 py-3 font-semibold text-primary hover:bg-primary/10 transition">
                  Learn More
                </button>
              </div>
            </div>
            <div className="relative h-80 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 flex items-center justify-center">
              <div className="text-center">
                <div className="mb-4 text-6xl font-bold text-primary/40">⚡</div>
                <p className="text-sm text-muted-foreground">Global Energy Leader</p>
              </div>
            </div>
          </div>
        </div>

        {/* Accent Line */}
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent opacity-50"></div>
      </section>

      {/* Key Metrics */}
      <section className="border-b border-border bg-card/50">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'Years of Excellence', value: '120+' },
              { label: 'Operations Worldwide', value: '50+' },
              { label: 'Total Employees', value: '75K+' },
              { label: 'Energy Production', value: '2.4M BOE/d' }
            ].map((metric, i) => (
              <div key={i} className="space-y-2">
                <p className="text-3xl font-bold text-primary">{metric.value}</p>
                <p className="text-sm text-muted-foreground">{metric.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="border-b border-border">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="space-y-12">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-1 w-12 bg-primary rounded"></div>
                <span className="text-sm font-semibold text-primary uppercase">About Us</span>
              </div>
              <h3 className="text-3xl font-bold tracking-tight md:text-4xl">
                Powering Global Progress
              </h3>
            </div>

            <div className="grid gap-12 lg:grid-cols-3">
              {[
                {
                  title: 'Innovation',
                  description: 'We invest in advanced technologies and research to develop sustainable energy solutions for the future.'
                },
                {
                  title: 'Reliability',
                  description: 'With decades of operational excellence, we deliver energy when and where it&apos;s needed most.'
                },
                {
                  title: 'Partnership',
                  description: 'We work collaboratively with communities, governments, and stakeholders worldwide.'
                }
              ].map((item, i) => (
                <div key={i} className="rounded-lg border border-border bg-card p-6 hover:border-primary/50 transition">
                  <h4 className="mb-3 text-lg font-semibold text-foreground">{item.title}</h4>
                  <p className="text-sm leading-relaxed text-muted-foreground">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Operations Section */}
      <section id="operations" className="border-b border-border bg-card/30">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="space-y-12">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-1 w-12 bg-primary rounded"></div>
                <span className="text-sm font-semibold text-primary uppercase">Our Operations</span>
              </div>
              <h3 className="text-3xl font-bold tracking-tight md:text-4xl">
                Integrated Global Platform
              </h3>
            </div>

            <div className="grid gap-8 md:grid-cols-2">
              {[
                {
                  name: 'Upstream',
                  icon: '🔍',
                  description: 'Advanced exploration and production operations delivering world-class reserves.'
                },
                {
                  name: 'Downstream',
                  icon: '⚙️',
                  description: 'Refining and marketing operations providing quality products globally.'
                },
                {
                  name: 'Chemical',
                  icon: '🧪',
                  description: 'Specialty chemicals and advanced materials for diverse industries.'
                },
                {
                  name: 'Low Carbon',
                  icon: '🌱',
                  description: 'Carbon capture, hydrogen, and renewable energy solutions.'
                }
              ].map((op, i) => (
                <div key={i} className="rounded-lg border border-border bg-background p-8 hover:border-primary/50 transition">
                  <div className="mb-4 text-5xl">{op.icon}</div>
                  <h4 className="mb-2 text-xl font-semibold">{op.name}</h4>
                  <p className="text-sm text-muted-foreground">{op.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Sustainability Section */}
      <section id="sustainability" className="border-b border-border">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="space-y-12">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-1 w-12 bg-primary rounded"></div>
                <span className="text-sm font-semibold text-primary uppercase">Sustainability</span>
              </div>
              <h3 className="text-3xl font-bold tracking-tight md:text-4xl">
                Environmental Stewardship
              </h3>
              <p className="max-w-2xl text-lg text-muted-foreground">
                We&apos;re committed to reducing emissions, protecting ecosystems, and contributing to a sustainable energy future.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {[
                { metric: '50%', label: 'Carbon Reduction by 2050' },
                { metric: '100%', label: 'Renewable Energy Focus' },
                { metric: '0', label: 'Environmental Incidents Target' }
              ].map((item, i) => (
                <div key={i} className="rounded-lg border border-primary/30 bg-primary/5 p-8 text-center">
                  <p className="mb-2 text-4xl font-bold text-primary">{item.metric}</p>
                  <p className="text-sm text-muted-foreground">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Investors Section */}
      <section id="investors" className="border-b border-border bg-card/30">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="space-y-12">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-1 w-12 bg-primary rounded"></div>
                <span className="text-sm font-semibold text-primary uppercase">Investor Relations</span>
              </div>
              <h3 className="text-3xl font-bold tracking-tight md:text-4xl">
                Delivering Shareholder Value
              </h3>
            </div>

            <div className="grid gap-8 lg:grid-cols-2">
              <div className="space-y-6">
                <h4 className="text-xl font-semibold">Financial Performance</h4>
                <div className="space-y-4">
                  {[
                    { label: 'Annual Revenue', value: '$400B+' },
                    { label: 'Dividend Yield', value: '3.5%' },
                    { label: 'Cash Flow', value: '$30B+' }
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between rounded-lg border border-border bg-background p-4">
                      <span className="text-sm text-muted-foreground">{item.label}</span>
                      <span className="font-semibold text-primary">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <h4 className="text-xl font-semibold">Resources</h4>
                <div className="space-y-3">
                  {[
                    'Annual Report & Filings',
                    'Earnings Presentations',
                    'Investor Webinars',
                    'Stock Information'
                  ].map((item, i) => (
                    <a 
                      key={i}
                      href="#" 
                      className="flex items-center gap-2 rounded-lg border border-border bg-background p-4 hover:border-primary/50 transition group"
                    >
                      <span className="text-sm font-medium group-hover:text-primary transition">{item}</span>
                      <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition text-primary" />
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-b border-border bg-gradient-to-r from-primary/20 to-primary/5">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 sm:py-24 lg:px-8">
          <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
            Join Our Journey
          </h2>
          <p className="mb-8 text-lg text-muted-foreground">
            Be part of the energy revolution. Explore career opportunities, partnerships, and investment options.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row justify-center">
            <button className="rounded-lg bg-primary px-8 py-3 font-semibold text-primary-foreground hover:opacity-90 transition">
              Get In Touch
            </button>
            <button className="rounded-lg border border-primary px-8 py-3 font-semibold text-primary hover:bg-primary/10 transition">
              Learn More
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-background/50">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-4 mb-8">
            <div>
              <h3 className="mb-4 font-semibold text-foreground">Company</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition">About</a></li>
                <li><a href="#" className="hover:text-primary transition">Careers</a></li>
                <li><a href="#" className="hover:text-primary transition">Press</a></li>
              </ul>
            </div>
            <div>
              <h3 className="mb-4 font-semibold text-foreground">Operations</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition">Upstream</a></li>
                <li><a href="#" className="hover:text-primary transition">Downstream</a></li>
                <li><a href="#" className="hover:text-primary transition">Chemical</a></li>
              </ul>
            </div>
            <div>
              <h3 className="mb-4 font-semibold text-foreground">Investors</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition">Financial</a></li>
                <li><a href="#" className="hover:text-primary transition">Governance</a></li>
                <li><a href="#" className="hover:text-primary transition">ESG</a></li>
              </ul>
            </div>
            <div>
              <h3 className="mb-4 font-semibold text-foreground">Legal</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition">Privacy</a></li>
                <li><a href="#" className="hover:text-primary transition">Terms</a></li>
                <li><a href="#" className="hover:text-primary transition">Compliance</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
                EM
              </div>
              <div>
                <p className="font-semibold text-foreground">ExxonMobil Cepu</p>
                <p className="text-xs text-muted-foreground">Limited Company</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">© 2024 ExxonMobil Cepu Limited. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
