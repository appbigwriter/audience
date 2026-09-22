import { ReactNode } from 'react'
import './styles.css'

export const metadata = {
  title: 'Audience Builder',
  description: 'Criação e operação de propriedades de audiência orientadas por Personas aprovadas.',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="pt-BR"><body>{children}</body></html>
}
