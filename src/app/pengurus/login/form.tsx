"use client";

import { useFormState, useFormStatus } from "react-dom";
import { login } from "./actions";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button className="btn w-full" disabled={pending}>
      {pending ? "Memeriksa…" : "Masuk"}
    </button>
  );
}

export default function LoginForm() {
  const [state, action] = useFormState(login, undefined);
  return (
    <form action={action} className="space-y-4">
      <div>
        <label className="label" htmlFor="username">Username</label>
        <input id="username" name="username" className="input" autoComplete="username" required />
      </div>
      <div>
        <label className="label" htmlFor="password">Kata sandi</label>
        <input id="password" name="password" type="password" className="input" autoComplete="current-password" required />
      </div>
      {state?.error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}
      <Submit />
    </form>
  );
}
