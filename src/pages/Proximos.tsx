interface Props {
  titulo: string
  icono: string
  desc: string
}

export default function Proximos({ titulo, icono, desc }: Props) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="text-6xl mb-5">{icono}</div>
      <h1 className="text-2xl font-bold text-thimpson-teal mb-3">{titulo}</h1>
      <p className="text-gray-500 max-w-md text-sm leading-relaxed mb-6">{desc}</p>
      <div className="inline-flex items-center gap-2 bg-thimpson-yellow/10 text-thimpson-teal font-semibold text-sm px-5 py-2.5 rounded-xl border border-thimpson-yellow/30">
        <span>🚧</span>
        Módulo en construcción
      </div>
    </div>
  )
}
