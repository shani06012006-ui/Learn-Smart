// frontend/src/features/admin/components/ResendInviteModal.jsx
import { useState } from "react";

import Modal from "../../../components/ui/Modal";
import Button from "../../../components/ui/Button";
import { useResendStudentInviteMutation } from "../../../store/api/activationApi";
import { extractErrorMessage, extractFieldErrors } from "../../../utils/apiError";
import ActivationInviteResult from "./ActivationInviteResult";
import InviteDeliveryFields from "./InviteDeliveryFields";
import { DEFAULT_DELIVERY, deliveryToPayload } from "./inviteDelivery";

/*
  Admin: send a student a NEW activation link (the old one stops working).
  Only for students who have not chosen a password yet.
*/
export default function ResendInviteModal({ open, onClose, student }) {
  const [resend, { isLoading }] = useResendStudentInviteMutation();
  const [delivery, setDelivery] = useState(DEFAULT_DELIVERY);
  const [result, setResult] = useState(null);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);

  const handleClose = () => {
    if (isLoading) return;
    setDelivery(DEFAULT_DELIVERY);
    setResult(null);
    setErrors({});
    setFormError(null);
    onClose();
  };

  const handleSend = async () => {
    setErrors({});
    setFormError(null);
    try {
      const res = await resend({ id: student.id, ...deliveryToPayload(delivery) }).unwrap();
      setResult(res.invitation);
    } catch (err) {
      const fields = extractFieldErrors(err);
      if (fields.phone) setErrors(fields);
      else setFormError(extractErrorMessage(err, "Could not send a new link."));
    }
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={result ? "New activation link" : "Resend activation link"}
      footer={
        result ? (
          <Button onClick={handleClose}>Done</Button>
        ) : (
          <>
            <Button variant="secondary" onClick={handleClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button onClick={handleSend} loading={isLoading}>
              Send new link
            </Button>
          </>
        )
      }
    >
      {result ? (
        <ActivationInviteResult email={student?.email} invitation={result} />
      ) : (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-slate-600">
            <strong className="text-navy-950">{student?.full_name || student?.email}</strong> has not
            chosen a password yet. A new link replaces the old one, which will stop working.
          </p>
          <InviteDeliveryFields
            value={delivery}
            onChange={setDelivery}
            phoneError={errors.phone}
            disabled={isLoading}
          />
          {formError && (
            <p
              role="alert"
              className="rounded-xl border border-coral-200 bg-coral-50 px-3.5 py-2.5 text-sm font-semibold text-coral-600"
            >
              {formError}
            </p>
          )}
        </div>
      )}
    </Modal>
  );
}
