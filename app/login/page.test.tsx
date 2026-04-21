import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { LoginForm } from './LoginForm'

const searchParamsMock = new URLSearchParams()
const pushMock = vi.fn()
const replaceMock = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock, replace: replaceMock, refresh: vi.fn() }),
  useSearchParams: () => searchParamsMock,
}))

beforeEach(() => {
  pushMock.mockClear()
  replaceMock.mockClear()
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('LoginForm', () => {
  it('renders a password input and submit button', () => {
    const action = vi.fn()
    render(<LoginForm login={action} />)
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /enter/i })).toBeInTheDocument()
  })

  it('disables submit when the password input is empty', () => {
    const action = vi.fn()
    render(<LoginForm login={action} />)
    expect(screen.getByRole('button', { name: /enter/i })).toBeDisabled()
  })

  it('calls the login action with the password value on submit', async () => {
    const action = vi.fn().mockResolvedValue({ success: true, redirectTo: '/' })
    render(<LoginForm login={action} />)

    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'hunter2' } })
    fireEvent.click(screen.getByRole('button', { name: /enter/i }))

    await waitFor(() => {
      expect(action).toHaveBeenCalledWith('hunter2', '/')
    })
  })

  it('shows an error message when the action returns an error', async () => {
    const action = vi.fn().mockResolvedValue({ success: false, error: 'INVALID PASSWORD' })
    render(<LoginForm login={action} />)

    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'wrong' } })
    fireEvent.click(screen.getByRole('button', { name: /enter/i }))

    expect(await screen.findByText(/INVALID PASSWORD/i)).toBeInTheDocument()
  })

  it('does not show an error on initial render', () => {
    const action = vi.fn()
    render(<LoginForm login={action} />)
    expect(screen.queryByText(/INVALID PASSWORD/i)).not.toBeInTheDocument()
  })
})
