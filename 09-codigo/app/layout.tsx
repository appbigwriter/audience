import { ReactNode } from 'react'
import './styles.css'

export const metadata = {
  title: 'FBR Blogs · Editorial Control Room',
  description: 'Provisionamento e gestão de blogs temáticos da FBR Agency.',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="pt-BR"><body>{children}</body></html>
}
