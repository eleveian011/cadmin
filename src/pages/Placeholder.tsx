import { Construction } from 'lucide-react'

export default function Placeholder({ title }: { title: string }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-(--fill)">
        <Construction size={28} className="text-(--subtle)" />
      </div>
      <div className="type-h4 font-bold text-(--text)">{title}</div>
      <p className="type-body text-(--muted)">This page is a blank canvas. Start building here.</p>
    </div>
  )
}
