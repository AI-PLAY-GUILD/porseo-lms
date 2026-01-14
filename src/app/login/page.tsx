import { GalleryVerticalEnd } from "lucide-react"

import { LoginForm } from "@/components/login-form"

export default function LoginPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-[#f6f6f8] dark:bg-[#101622] p-6 md:p-10 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[100px] translate-x-1/2 translate-y-1/2 pointer-events-none"></div>

      <div className="flex w-full max-w-sm flex-col gap-6 relative z-10">
        <a href="/" className="flex items-center gap-2 self-center font-thin text-xl tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>
          AI PLAY GUILD
        </a>
        <LoginForm />
      </div>
    </div>
  )
}
