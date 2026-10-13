import { useMemo, useState } from "react";
import Modal from "../../../../components/ui/Modal";
import Button from "../../../../components/ui/Button";
import { useUpdateAdminSectionMutation } from "../../../../store/api/realApi";
import { extractErrorMessage } from "../../../../utils/apiError";

export default function EditSectionModal({ open, onClose, section, onSaved }) {
  const [name, setName] = useState("");
  const [capacity, setCapacity] = useState(40);
  const [room, setRoom] = useState("");
  const [error, setError] = useState("");

  const [updateSection, { isLoading }] = useUpdateAdminSectionMutation();

  useMemo(() => {
    if (!open || !section) return;
    setName(section.name || "");
    setCapacity(section.capacity ?? 40);
    setRoom(section.room || "");
    setError("");
  }, [open, section]);

  async function submit(e) {
    e?.preventDefault?.();
    setError("");
    if (!name.trim()) {
      setError("Section name is required.");
      return;
    }
    try {
      await updateSection({
        id: section.id,
        name: name.trim(),
        capacity: Number(capacity) || 40,
        room: room.trim(),
      }).unwrap();
      onSaved?.();
      onClose();
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Edit Section ${section?.name || ""}`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" form="edit-section-form" loading={isLoading}>
            Save
          </Button>
        </>
      }
    >
      <form id="edit-section-form" onSubmit={submit} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Section name
          </span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-purple-400"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Capacity
          </span>
          <input
            type="number"
            min={1}
            max={500}
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-purple-400"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Room
          </span>
          <input
            type="text"
            value={room}
            onChange={(e) => setRoom(e.target.value)}
            placeholder="Room 101"
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-purple-400"
          />
        </label>
        {error && (
          <p className="rounded-xl border border-coral-200 bg-coral-50 px-3 py-2 text-xs font-medium text-coral-700">
            {error}
          </p>
        )}
      </form>
    </Modal>
  );
}