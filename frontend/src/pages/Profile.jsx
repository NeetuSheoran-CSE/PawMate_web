import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BadgeCheck, Pencil, Plus, Trash2 } from 'lucide-react'
import Avatar from '../components/ui/Avatar.jsx'
import Badge from '../components/ui/Badge.jsx'
import Button from '../components/ui/Button.jsx'
import Field from '../components/ui/Field.jsx'
import Modal from '../components/ui/Modal.jsx'
import PetForm from '../components/pets/PetForm.jsx'
import { RELATIONS, petTypeById } from '../data/constants.js'
import { api } from '../services/api.js'
import { isOwner, useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { useForm } from '../hooks/useForm.js'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import { compose, phone, required, when } from '../utils/validators.js'

const ROLE_LABEL = { owner: 'Pet owner', walker: 'Pet walker', both: 'Owner and walker' }

export default function Profile() {
  useDocumentTitle('My profile')
  const { user, setUser } = useAuth()
  const toast = useToast()
  const [pets, setPets] = useState(null)
  const [petModal, setPetModal] = useState(null) // null | {} (new) | pet (edit)
  const [saving, setSaving] = useState('')

  const details = useForm(
    { name: user.name, phone: user.phone || '', city: user.city || '', bio: user.bio || '' },
    { name: required('Name'), phone: compose(required('Mobile number'), phone), city: required('City') }
  )
  const emergency = useForm(
    {
      ecName: user.emergencyContact?.name || '', ecPhone: user.emergencyContact?.phone || '', ecRelation: user.emergencyContact?.relation || '',
      vetName: user.vet?.name || '', vetPhone: user.vet?.phone || '',
    },
    {
      ecName: required('Contact name'),
      ecPhone: compose(required('Contact phone'), phone),
      ecRelation: required('Relationship'),
      vetPhone: when(a => a.vetPhone.trim() !== '', phone),
    }
  )

  const loadPets = useCallback(async () => setPets(isOwner(user) ? await api.getPets(user.id) : []), [user])
  useEffect(() => { loadPets() }, [loadPets])

  const saveDetails = async e => {
    e.preventDefault()
    if (!details.validate()) return
    setSaving('details')
    try {
      setUser(await api.updateUser(user.id, details.values))
      toast.success('Profile updated.')
    } catch (err) { toast.error(err.message) } finally { setSaving('') }
  }

  const saveEmergency = async e => {
    e.preventDefault()
    if (!emergency.validate()) return
    const v = emergency.values
    setSaving('emergency')
    try {
      setUser(await api.updateUser(user.id, {
        emergencyContact: { name: v.ecName.trim(), phone: v.ecPhone.trim(), relation: v.ecRelation },
        vet: v.vetName.trim() ? { name: v.vetName.trim(), phone: v.vetPhone.trim() } : null,
      }))
      toast.success('Emergency details saved.')
    } catch (err) { toast.error(err.message) } finally { setSaving('') }
  }

  const savePet = async values => {
    setSaving('pet')
    try {
      await api.savePet(user.id, values)
      toast.success(values.id ? 'Pet updated.' : 'Pet added.')
      setPetModal(null)
      await loadPets()
    } catch (err) { toast.error(err.message) } finally { setSaving('') }
  }

  const removePet = async pet => {
    if (!window.confirm(`Remove ${pet.name} from your profile?`)) return
    await api.deletePet(pet.id)
    toast.info(`${pet.name} was removed.`)
    loadPets()
  }

  const addRole = async role => {
    try {
      setUser(await api.addRole(user.id, role))
      toast.success(role === 'owner' ? 'Pet owner features are on.' : 'Walker features are on.')
    } catch (err) { toast.error(err.message) }
  }

  return (
    <div className="container section-sm profile-page">
      <section className="card profile-head">
        <Avatar name={user.name} size={88} tone={user.name.length} />
        <div className="grow">
          <h1 className="h2">{user.name}</h1>
          <p className="muted">{user.email}</p>
          <div className="row gap-sm wrap">
            <Badge tone="gray">{ROLE_LABEL[user.role]}</Badge>
            {user.phone && <Badge icon={BadgeCheck}>Phone added</Badge>}
          </div>
        </div>
        <div className="row gap-sm wrap">
          {user.role === 'walker' && <Button variant="outline" onClick={() => addRole('owner')}>Turn on pet owner features</Button>}
          {!user.walkerId && <Button variant="outline" to="/become-a-walker">Become a walker</Button>}
          {user.walkerId && <Button variant="outline" to={`/walkers/${user.walkerId}`}>View public walker profile</Button>}
        </div>
      </section>

      <section className="card">
        <form onSubmit={saveDetails} noValidate className="stack">
          <h2 className="h4">Personal details</h2>
          <div className="form-grid">
            <Field label="Full name" required {...details.field('name')} />
            <Field label="Mobile number" required inputMode="tel" {...details.field('phone')} />
            <Field label="City" required {...details.field('city')} />
          </div>
          <Field as="textarea" rows={3} label="About you" {...details.field('bio')} />
          <div><Button type="submit" loading={saving === 'details'}>Save details</Button></div>
        </form>
      </section>

      {isOwner(user) && (
        <>
          <section className="card" id="emergency">
            <form onSubmit={saveEmergency} noValidate className="stack">
              <h2 className="h4">Emergency contact and vet</h2>
              <p className="muted">Shared with a walker only after they accept your booking.</p>
              <div className="form-grid">
                <Field label="Emergency contact name" required {...emergency.field('ecName')} />
                <Field label="Contact phone" required inputMode="tel" {...emergency.field('ecPhone')} />
                <Field as="select" label="Relationship" required {...emergency.field('ecRelation')}>
                  <option value="">Select</option>
                  {RELATIONS.map(r => <option key={r}>{r}</option>)}
                </Field>
              </div>
              <div className="form-grid">
                <Field label="Vet clinic name" {...emergency.field('vetName')} />
                <Field label="Vet phone" inputMode="tel" {...emergency.field('vetPhone')} />
              </div>
              <div><Button type="submit" loading={saving === 'emergency'}>Save emergency details</Button></div>
            </form>
          </section>

          <section className="card stack" id="pets">
            <div className="row between wrap gap-sm">
              <h2 className="h4">My pets</h2>
              <Button icon={Plus} size="sm" onClick={() => setPetModal({})}>Add a pet</Button>
            </div>
            {pets === null ? <p className="muted">Loading pets…</p> : pets.length === 0 ? (
              <p className="muted">No pets yet. Add one so walkers know how to care for them.</p>
            ) : (
              <ul className="pet-list">
                {pets.map(p => (
                  <li key={p.id} className="pet-item">
                    <span className="pet-emoji big" aria-hidden>{petTypeById(p.type)?.emoji}</span>
                    <div className="grow">
                      <strong>{p.name}</strong>
                      <p className="muted">{p.breed}, {p.age} yr{p.vaccinated ? ', vaccinated' : ''}</p>
                      {p.instructions && <p className="small">{p.instructions}</p>}
                    </div>
                    <div className="row gap-xs">
                      <button className="icon-btn" aria-label={`Edit ${p.name}`} onClick={() => setPetModal(p)}><Pencil size={18} /></button>
                      <button className="icon-btn danger" aria-label={`Remove ${p.name}`} onClick={() => removePet(p)}><Trash2 size={18} /></button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}

      <p className="muted small center"><Link to="/contact">Need help with your account?</Link></p>

      <Modal open={petModal !== null} onClose={() => setPetModal(null)} title={petModal?.id ? `Edit ${petModal.name}` : 'Add a pet'}>
        {petModal !== null && <PetForm key={petModal.id || 'new'} initial={petModal.id ? { ...petModal, age: String(petModal.age) } : undefined} onSubmit={savePet} onCancel={() => setPetModal(null)} loading={saving === 'pet'} />}
      </Modal>
    </div>
  )
}
