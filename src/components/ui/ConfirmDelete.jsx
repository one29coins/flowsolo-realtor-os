import { useState } from 'react'
import Modal from './Modal'
import Button from './Button'
import Input from './Input'

export default function ConfirmDelete({ open, onClose, onConfirm, itemName = 'item', title }) {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleConfirm() {
    if (text !== 'DELETE') return
    try {
      setLoading(true)
      await onConfirm()
      setText('')
      onClose()
    } finally {
      setLoading(false)
    }
  }

  function handleClose() {
    if (loading) return
    setText('')
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={title ?? `Delete ${itemName}`}
      footer={
        <>
          <Button variant="outline" onClick={handleClose} disabled={loading}>Cancel</Button>
          <Button variant="danger" onClick={handleConfirm} loading={loading} disabled={text !== 'DELETE'}>
            Delete permanently
          </Button>
        </>
      }
    >
      <p className="text-sm text-ink-muted mb-4">
        This action cannot be undone. Type <span className="font-medium text-ink">DELETE</span> below to confirm.
      </p>
      <Input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type DELETE to confirm"
        autoFocus
      />
    </Modal>
  )
}
