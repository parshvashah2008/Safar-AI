import './globals.css';
import type { Metadata } from 'next';
export const metadata: Metadata={title:'SAFAR AI — Your world. Your budget. Your journey.',description:'A considered travel planner for journeys that fit.'};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
