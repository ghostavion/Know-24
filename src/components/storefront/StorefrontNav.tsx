"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"

import { cn } from "@/lib/utils"

interface StorefrontNavProps {
  businessName: string
  logoUrl: string | null
  subdomain: string
}

const StorefrontNav = ({ businessName, logoUrl, subdomain }: StorefrontNavProps) => {
  const [mobileOpen, setMobileOpen] = useState(false)

  const navLinks = [
    { label: "Products", href: `/s/${subdomain}#products` },
    { label: "Blog", href: `/s/${subdomain}/blog` },
  ]

  return (
    <nav className="sticky top-0 z-50 bg-[var(--sf-primary)] text-white shadow-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        {/* Logo + Business Name */}
        <Link href={`/s/${subdomain}`} className="flex items-center gap-3">
          {logoUrl ? (
            <Image
              src={logoUrl}
              alt={`${businessName} logo`}
              width={36}
              height={36}
              className="size-9 rounded-lg object-cover"
            />
          ) : (
            <div className="flex size-9 items-center justify-center rounded-lg bg-white/20 text-sm font-bold uppercase">
              {businessName.charAt(0)}
            </div>
          )}
          <span className="text-lg font-semibold">{businessName}</span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-white/80 transition-colors hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Mobile Toggle */}
        <button
          type="button"
          onClick={() => setMobileOpen((prev) => !prev)}
          className="md:hidden"
          aria-label="Toggle menu"
        >
          {mobileOpen ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="4" y1="6" x2="20" y2="6" />
              <line x1="4" y1="12" x2="20" y2="12" />
              <line x1="4" y1="18" x2="20" y2="18" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      <div
        className={cn(
          "border-t border-white/10 bg-[var(--sf-primary)] md:hidden",
          mobileOpen ? "block" : "hidden"
        )}
      >
        <div className="space-y-1 px-6 py-4">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="block rounded-lg px-3 py-2 text-sm font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
}

export { StorefrontNav }
export type { StorefrontNavProps }
