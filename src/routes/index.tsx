import { createFileRoute } from '@tanstack/react-router'
import { Activity, Camera, Droplets, Dumbbell, Flame, Scale, Sparkles } from 'lucide-react'

export const Route = createFileRoute('/')({ component: Dashboard })

const cards: Array<[string, string, typeof Activity, string]> = [
  ['Today\'s workout', 'Push strength + accessories', Dumbbell, 'Start workout'],
  ['Daily check-in', 'Weight, sleep, water, protein', Activity, 'Log now'],
  ['Body weight', 'No check-in yet', Scale, 'Track trend'],
  ['Water', '0 / goal', Droplets, 'Build consistency'],
  ['Recovery', 'Awaiting today\'s score', Flame, 'Protect performance'],
  ['Progress photos', 'Stored privately in R2', Camera, 'Upload photo'],
]

function Dashboard() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#1a2217,transparent_40%),#08090a] px-6 py-8 text-foreground">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-2 text-sm uppercase tracking-[0.3em] text-primary">Personal Fitness OS</p>
            <h1 className="text-4xl font-semibold tracking-tight md:text-6xl">Sian OS</h1>
            <p className="mt-3 max-w-2xl text-muted">A private training, recovery, nutrition, and progress dashboard built as your long-term source of truth.</p>
          </div>
          <a href="/login" className="rounded-full border border-border bg-card px-5 py-3 text-sm text-primary hover:bg-accent">Private login</a>
        </header>

        <section className="mb-6 rounded-3xl border border-border bg-card/80 p-6 shadow-2xl shadow-black/30">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-primary p-3 text-primary-foreground"><Sparkles /></div>
            <div>
              <h2 className="text-2xl font-semibold">Today’s priorities</h2>
              <p className="mt-2 text-muted">Log the basics, complete the planned workout, and keep the data clean for your external coaching agent.</p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {cards.map(([title, body, Icon, cta]) => (
            <article key={title as string} className="rounded-3xl border border-border bg-card p-5 transition hover:-translate-y-0.5 hover:bg-accent">
              <div className="mb-5 flex items-center justify-between">
                <div className="rounded-2xl border border-border p-3 text-primary"><Icon /></div>
                <span className="text-xs uppercase tracking-[0.18em] text-muted">MVP</span>
              </div>
              <h3 className="text-xl font-semibold">{title}</h3>
              <p className="mt-2 text-sm text-muted">{body}</p>
              <button className="mt-5 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">{cta}</button>
            </article>
          ))}
        </section>
      </div>
    </main>
  )
}
