import { useState } from "react";
import { Copy, Check } from "lucide-react";

import { useAddStudentMutation } from "../../../../store/api/classesApi";
import { extractErrorMessage, extractFieldErrors } from "../../../../utils/apiError";
import Modal from "../../../../components/ui/Modal";
import Input from "../../../../components/ui/Input";
import Button from "../../../../components/ui/Button";

const initialForm = { email: "", first_name: "", last_name: "" };

export default function AddStudentModal({ open, onClose, classId }) {
  const [addStudent, { isLoading }] = useAddStudentMutation();
  const [form, setForm] = useState(initialForm);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleClose = () => {
    setForm(initialForm);
    setFieldErrors({});
    setFormError(null);
    setResult(null);
    setCopied(false);
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFieldErrors({});
    setFormError(null);
    try {
      const enrollment = await addStudent({ classId, ...form }).unwrap();
      setResult(enrollment);
    } catch (err) {
      setFieldErrors(extractFieldErrors(err));
      setFormError(extractErrorMessage(err));
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(result.joining_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleAddAnother = () => {
    setForm(initialForm);
    setFieldErrors({});
    setFormError(null);
    setResult(null);
    setCopied(false);
  };

  return (
    <Modal open={open} onClose={handleClose} title={result ? "Student added" : "Add a student"}>
      {result ? (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-ink-700">
            <span className="font-medium">{result.student.full_name}</span> has been added.
            Share this joining code with them so they can join the class:
          </p>
          <div className="flex items-center justify-between rounded-lg border border-brand-200 bg-brand-50 px-4 py-3">
            <span className="font-mono text-xl font-semibold tracking-widest text-brand-700">
              {result.joining_code}
            </span>
            <button
              onClick={handleCopy}
              className="focus-ring flex items-center gap-1.5 rounded-md px-2 py-1 text-sm text-brand-700 hover:bg-brand-100"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={handleAddAnother}>
              Add another
            </Button>
            <Button onClick={handleClose}>Done</Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Email"
            type="email"
            name="email"
            required
            value={form.email}
            onChange={handleChange}
            error={fieldErrors.email}
            placeholder="student@example.com"
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="First name"
              name="first_name"
              required
              value={form.first_name}
              onChange={handleChange}
              error={fieldErrors.first_name}
            />
            <Input
              label="Last name"
              name="last_name"
              required
              value={form.last_name}
              onChange={handleChange}
              error={fieldErrors.last_name}
            />
          </div>

          {formError && !Object.keys(fieldErrors).length && (
            <p role="alert" className="text-sm text-danger-700">
              {formError}
            </p>
          )}

          <div className="mt-2 flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" loading={isLoading}>
              Add student
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
