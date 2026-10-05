import type { Metadata } from "next";
import Link from "next/link";
import { Geist } from "next/font/google";
import { currentEmail } from "@/auth";
import { isAdmin } from "@/lib/data";
import { signOutAction } from "./actions";
import "./globals.css";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Well House Guest Auction",
  description: "Bid on guest slots for Well House meals.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const email = await currentEmail();
  return (
    <html lang="en" className={`${geist.className} antialiased`}>
      <body className="min-h-screen">
        <header className="border-b border-neutral-200 bg-white">
          <div className="mx-auto flex max-w-2xl flex-wrap items-center justify-between gap-3 px-4 py-3">
            <Link href="/" className="text-lg font-semibold">
              Well House Guest Auction
            </Link>
            {email && (
              <nav className="flex flex-wrap items-center gap-4 text-sm text-neutral-600">
                <Link href="/" className="hover:text-black">Bid</Link>
                <Link href="/results" className="hover:text-black">Who&apos;s coming</Link>
                <Link href="/history" className="hover:text-black">My history</Link>
                <Link href="/how-it-works" className="hover:text-black">How it works</Link>
                {isAdmin(email) && <Link href="/admin" className="hover:text-black">Admin</Link>}
                <form action={signOutAction}>
                  <button className="hover:text-black">Sign out</button>
                </form>
              </nav>
            )}
          </div>
        </header>
        <main className="mx-auto max-w-2xl px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
