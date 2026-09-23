import Button from '../ui/Button.jsx'
import Field from '../ui/Field.jsx'
import { PET_TYPES } from '../../data/constants.js'
import { useForm } from '../../hooks/useForm.js'
import { compose, numberBetween, required } from '../../utils/validators.js'

const rules = {
  name: required('Pet name'),
  breed: required('Breed'),
  age: compose(required('Age'), numberBetween(0, 30, 'Age')),
}

export default function PetForm({ initial, onSubmit, onCancel, submitLabel = 'Save pet', loading }) {
  const form = useForm(
    { name: '', type: 'dog', breed: '', age: '', vaccinated: true, instructions: '', ...initial },
    rules
  )

  const submit = e => {
    e.preventDefault()
    if (form.validate()) onSubmit({ ...initial, ...form.values })
  }

  return (
    <form onSubmit={submit} noValidate className="stack">
      <div className="form-grid">
        <Field label="Pet name" required placeholder="Bruno" {...form.field('name')} />
        <Field as="select" label="Pet type" {...form.field('type')}>
          {PET_TYPES.map(t => <option key={t.id} value={t.id}>{t.emoji} {t.label.replace(/s$/, '')}</option>)}
        </Field>
        <Field label="Breed" required placeholder="Labrador Retriever" {...form.field('breed')} />
        <Field label="Age (years)" required type="number" min="0" max="30" step="0.5" inputMode="decimal" {...form.field('age')} />
      </div>
      <Field
        as="textarea" rows={4} label="Special instructions"
        placeholder="Feeding times, fears, medication, favourite games, things to avoid…"
        hint="Your walker sees this before the visit."
        {...form.field('instructions')}
      />
      <label className="check">
        <input type="checkbox" name="vaccinated" checked={form.values.vaccinated} onChange={form.handleChange} />
        <span>Vaccinations are up to date</span>
      </label>
      <div className="row gap end">
        {onCancel && <Button variant="ghost" onClick={onCancel}>Cancel</Button>}
        <Button type="submit" loading={loading}>{submitLabel}</Button>
      </div>
    </form>
  )
}
