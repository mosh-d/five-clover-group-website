"use client";

import { useState } from "react";
import { IoEyeOutline, IoEyeOffOutline } from "react-icons/io5";
import { field } from "./ui";
import { Tip } from "@/components/pms/Tip";

// A password input with a show/hide eye - the sign-in page, Account, and
// every new password typed on Staff Accounts.
export default function PasswordField({ id, label, value, onChange, autoComplete, minLength, required, tip }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className={field.label}>{label}{tip && <Tip id={tip} />}</label>
      <div className="relative">
        <input
          id={id}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          value={value}
          onChange={onChange}
          minLength={minLength}
          required={required}
          className={`${field.input} pr-14`}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          tabIndex={-1}
          aria-label={visible ? "Hide password" : "Show password"}
          className="absolute inset-y-0 right-0 flex items-center px-4 cursor-pointer text-(--text-color)/60 hover:text-(--text-color)"
        >
          {visible ? <IoEyeOutline size={18} /> : <IoEyeOffOutline size={18} />}
        </button>
      </div>
    </div>
  );
}
