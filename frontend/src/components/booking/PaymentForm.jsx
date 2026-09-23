import { Banknote, CreditCard, HandHeart, Lock, Smartphone } from 'lucide-react'
import Field from '../ui/Field.jsx'
import { formatCard, formatExpiry } from '../../utils/format.js'

const METHODS = [
  { id: 'upi', label: 'UPI', hint: 'GPay, PhonePe, Paytm', icon: Smartphone },
  { id: 'card', label: 'Card', hint: 'Debit or credit', icon: CreditCard },
  { id: 'cash', label: 'Cash', hint: 'Pay after the visit', icon: Banknote },
]

/** Payment interface (demo only). Card details are never stored. */
export default function PaymentForm({ form, free }) {
  const method = form.values.payMethod

  if (free) {
    return (
      <div className="note note-good row gap">
        <HandHeart size={22} aria-hidden />
        <p>This walker is a volunteer, so there is nothing to pay. A thank-you message goes a long way.</p>
      </div>
    )
  }

  return (
    <div className="stack">
      <div className="method-grid" role="radiogroup" aria-label="Payment method">
        {METHODS.map(m => (
          <button
            key={m.id} type="button" role="radio" aria-checked={method === m.id}
            className={`method ${method === m.id ? 'method-on' : ''}`}
            onClick={() => form.setValue('payMethod', m.id)}
          >
            <m.icon size={22} aria-hidden />
            <strong>{m.label}</strong>
            <span>{m.hint}</span>
          </button>
        ))}
      </div>

      {method === 'upi' && <Field label="UPI ID" placeholder="name@bank" autoComplete="off" {...form.field('upiId')} />}

      {method === 'card' && (
        <div className="form-grid">
          <Field className="span-2" label="Name on card" autoComplete="cc-name" {...form.field('cardName')} />
          <Field
            className="span-2" label="Card number" inputMode="numeric" autoComplete="cc-number" placeholder="1234 5678 9012 3456"
            {...form.field('cardNumber')} onChange={e => form.setValue('cardNumber', formatCard(e.target.value))}
          />
          <Field
            label="Expiry" placeholder="MM/YY" inputMode="numeric" autoComplete="cc-exp"
            {...form.field('cardExpiry')} onChange={e => form.setValue('cardExpiry', formatExpiry(e.target.value))}
          />
          <Field
            label="CVV" type="password" inputMode="numeric" maxLength={4} autoComplete="cc-csc"
            {...form.field('cardCvv')} onChange={e => form.setValue('cardCvv', e.target.value.replace(/\D/g, ''))}
          />
        </div>
      )}

      {method === 'cash' && <p className="note">You will pay your walker in cash after the visit. Nothing is charged now.</p>}

      <p className="muted row gap-xs">
        <Lock size={15} aria-hidden />
        {method === 'cash' ? 'Demo mode: no real payment is taken.' : 'Payment is held until the booking is completed. Demo mode: no real payment is taken.'}
      </p>
    </div>
  )
}
