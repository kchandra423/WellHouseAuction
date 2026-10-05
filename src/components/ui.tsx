import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  const bg = /\bbg-/.test(className) ? "" : "bg-white";
  return <div className={`rounded-xl border border-neutral-200 p-4 ${bg} ${className}`}>{children}</div>;
}

const buttonStyles = {
  primary: "bg-black text-white hover:bg-neutral-800",
  secondary: "border border-neutral-300 bg-white hover:bg-neutral-50",
  danger: "border border-red-300 bg-white text-red-700 hover:bg-red-50",
};

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ComponentProps<"button"> & { variant?: keyof typeof buttonStyles }) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-lg px-4 py-2.5 font-medium disabled:opacity-50 ${buttonStyles[variant]} ${className}`}
      {...props}
    />
  );
}

export function ButtonLink({
  variant = "primary",
  className = "",
  ...props
}: ComponentProps<typeof Link> & { variant?: keyof typeof buttonStyles }) {
  return (
    <Link
      className={`inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium ${buttonStyles[variant]} ${className}`}
      {...props}
    />
  );
}

export function Notice({ kind = "info", children }: { kind?: "info" | "success" | "error"; children: ReactNode }) {
  const styles = {
    info: "bg-blue-50 border-blue-200 text-blue-900",
    success: "bg-green-50 border-green-200 text-green-900",
    error: "bg-red-50 border-red-200 text-red-900",
  };
  return <div className={`rounded-lg border px-4 py-3 text-sm ${styles[kind]}`}>{children}</div>;
}

export function Badge({ children, tone = "gray" }: { children: ReactNode; tone?: "gray" | "green" | "yellow" | "red" }) {
  const styles = {
    gray: "bg-neutral-100 text-neutral-700",
    green: "bg-green-100 text-green-800",
    yellow: "bg-amber-100 text-amber-800",
    red: "bg-red-100 text-red-800",
  };
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[tone]}`}>{children}</span>;
}
