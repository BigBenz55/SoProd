interface Toast {
  id: number
  message: string
}

let seq = 0

export function useToast() {
  const toasts = useState<Toast[]>('toasts', () => [])

  function show(message: string, duration = 2800) {
    const id = ++seq
    toasts.value = [...toasts.value, { id, message }]
    setTimeout(() => {
      toasts.value = toasts.value.filter(t => t.id !== id)
    }, duration)
  }

  return { toasts, show }
}

export function errorMessage(err: unknown, fallback = 'Une erreur est survenue.') {
  const e = err as { data?: { message?: string }; statusMessage?: string; message?: string }
  return e?.data?.message || e?.statusMessage || fallback
}
