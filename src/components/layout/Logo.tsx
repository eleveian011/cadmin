export default function Logo({ height = 32 }: { height?: number }) {
  return (
    <div className="flex items-center gap-2" style={{ height }}>
      <div
        className="flex shrink-0 items-center justify-center rounded-md bg-(--accent) font-bold text-white"
        style={{ width: height * 0.9, height: height * 0.9, fontSize: height * 0.5 }}
      >
        A
      </div>
      <span className="type-h5 font-bold text-(--text)">Admin</span>
    </div>
  )
}
