import { useState } from "react";
import { Link } from "react-router-dom";
import { KeyRound, ArrowRight } from "lucide-react";

import { useJoinClassMutation } from "../../../store/api/classesApi";
import { extractErrorMessage } from "../../../utils/apiError";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";

export default function JoinClassPage() {
  const [joinClass, { isLoading }] = useJoinClassMutation();
  const [code, setCode] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const trimmed = code.trim().toUpperCase();
    if (trimmed.length !== 6) {
      setError("Joining codes are 6 characters. Check the code your teacher gave you.");
      return;
    }

    try {
      const result = await joinClass(trimmed).unwrap();
      setSuccess(result.class_course);
      setCode("");
    } catch (err) {
      setError(extractErrorMessage(err, "Could not join this class."));
    }
  };

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-ink-900">Join a class</h1>
        <p className="mt-1 text-sm text-ink-500">
          Enter the 6-character code your teacher gave you.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 rounded-xl border border-ink-300 bg-white p-6"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
            <KeyRound size={20} />
          </div>
          <div>
            <p className="text-sm font-medium text-ink-900">Joining code</p>
            <p className="text-xs text-ink-500">Example: PHY10A</p>
          </div>
        </div>

        <Input
          label="Code"
          name="joining_code"
          required
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          maxLength={6}
          placeholder="ABC123"
          className="font-mono text-lg tracking-widest uppercase"
        />

        {error && (
          <p role="alert" className="text-sm text-danger-700">
            {error}
          </p>
        )}

        {success && (
          <div className="rounded-lg border border-success-500 bg-success-50 p-3">
            <p className="text-sm font-medium text-success-700">
              Joined {success.name}
            </p>
            <p className="mt-1 text-xs text-ink-700">
              Subject: {success.subject}
            </p>
            <Link
              to="/student/classes"
              className="focus-ring mt-2 inline-flex items-center gap-1 text-sm font-medium text-success-700"
            >
              Go to My Classes
              <ArrowRight size={14} />
            </Link>
          </div>
        )}

        <Button type="submit" loading={isLoading} className="mt-2">
          Join class
        </Button>
      </form>

      <p className="mt-4 text-center text-xs text-ink-500">
        Don&apos;t have a code yet? Your teacher has to add you first — they&apos;ll
        give you the code once you&apos;re on their roster.
      </p>
    </div>
  );
}
