// frontend/src/features/auth/components/GoogleSignInButton.jsx
import { useEffect, useRef, useState } from "react";
import SocialButton from "./SocialButton";

/*
  Google's official "Sign in with Google" button (Google Identity Services).

  How it works
    1. We load https://accounts.google.com/gsi/client once.
    2. Google draws its own button inside our <div>. The user clicks it, picks
       an account in Google's popup, and Google calls us back with a signed
       ID token ("credential").
    3. We pass that credential up via `onCredential`; the page sends it to
       POST /api/v1/auth/google/ where the backend verifies it.

  Needs  VITE_GOOGLE_CLIENT_ID  in frontend/.env.local  (see GOOGLE_LOGIN_SETUP.md).
  Without it, a normal-looking button is shown that explains Google isn't set up.
*/

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
const GSI_SRC = "https://accounts.google.com/gsi/client";

let scriptPromise = null;
function loadGoogleScript() {
  if (window.google?.accounts?.id) return Promise.resolve(window.google);
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = GSI_SRC;
      s.async = true;
      s.defer = true;
      s.onload = () => resolve(window.google);
      s.onerror = () => {
        scriptPromise = null; // allow a retry on the next mount
        reject(new Error("Could not load Google sign-in"));
      };
      document.head.appendChild(s);
    });
  }
  return scriptPromise;
}

// Google only wants initialize() once per page, so the callback is routed
// through this variable and re-pointed at whichever button is mounted.
let currentCallback = null;
let initializedFor = null;

const NOT_CONFIGURED_MSG =
  "Google sign-in isn't set up yet. Please log in with your email for now.";
const LOAD_FAILED_MSG =
  "Couldn't load Google sign-in. Check your connection, or log in with your email.";

export default function GoogleSignInButton({
  onCredential,
  onError,
  text = "continue_with", // "signin_with" | "signup_with" | "continue_with"
  fallbackLabel = "Continue with Google",
  disabled = false,
}) {
  const holderRef = useRef(null);
  const handlerRef = useRef(onCredential);
  const [status, setStatus] = useState(CLIENT_ID ? "loading" : "unconfigured");

  useEffect(() => {
    handlerRef.current = onCredential;
  });

  useEffect(() => {
    if (!CLIENT_ID) {
      if (import.meta.env.DEV) {
        console.info("[Google sign-in] Add VITE_GOOGLE_CLIENT_ID to frontend/.env.local to enable it.");
      }
      return undefined;
    }

    let cancelled = false;
    const holder = holderRef.current;
    loadGoogleScript()
      .then((google) => {
        if (cancelled || !holder) return;

        currentCallback = (response) => handlerRef.current?.(response.credential);
        if (initializedFor !== CLIENT_ID) {
          google.accounts.id.initialize({
            client_id: CLIENT_ID,
            callback: (response) => currentCallback?.(response),
            ux_mode: "popup",
            auto_select: false,
          });
          initializedFor = CLIENT_ID;
        }

        holder.innerHTML = "";
        google.accounts.id.renderButton(holder, {
          type: "standard",
          theme: "outline",
          size: "large",
          shape: "pill",
          text,
          logo_alignment: "center",
          // Google only accepts a pixel width (max 400); match our form column.
          width: Math.min(400, Math.max(200, Math.round(holder.clientWidth || 400))),
        });
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("failed");
      });

    return () => {
      cancelled = true;
      if (holder) holder.innerHTML = "";
    };
  }, [text]);

  if (status === "unconfigured" || status === "failed") {
    return (
      <SocialButton
        label={fallbackLabel}
        onClick={() => onError?.(status === "failed" ? LOAD_FAILED_MSG : NOT_CONFIGURED_MSG)}
      />
    );
  }

  return (
    <div
      className={`relative flex h-12 items-center justify-center transition-opacity ${
        disabled ? "pointer-events-none opacity-60" : ""
      }`}
    >
      {status === "loading" && (
        <div aria-hidden="true" className="absolute inset-0 animate-pulse rounded-full bg-ink-50" />
      )}
      <div ref={holderRef} className="flex w-full justify-center" />
    </div>
  );
}