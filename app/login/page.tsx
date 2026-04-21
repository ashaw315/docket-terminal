import { Suspense } from 'react'
import { LoginForm } from './LoginForm'
import { login } from './actions'

export const dynamic = 'force-dynamic'

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm login={login} />
    </Suspense>
  )
}
