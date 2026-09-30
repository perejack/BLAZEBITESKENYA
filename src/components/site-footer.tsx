import { Link } from "@tanstack/react-router";
import { Flame, Instagram, MapPin, Phone } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-card/40">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 md:grid-cols-[1.4fr_1fr_1fr] lg:px-8">
        <div>
          <div className="flex items-center gap-2.5">
            <Flame className="size-5 text-primary" />
            <span className="font-display text-lg font-bold">
              BLAZE<span className="text-primary">BITES</span>
            </span>
          </div>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
            Handcrafted with fire in Nairobi. Smash burgers, charcoal grills and street classics —
            packed hot, priced honestly, packing tin always shown.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-widest text-foreground">
            Explore
          </h3>
          <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
            <li>
              <Link to="/menu" className="hover:text-primary">
                Menu
              </Link>
            </li>
            <li>
              <Link to="/about" className="hover:text-primary">
                About us
              </Link>
            </li>
            <li>
              <Link to="/contact" className="hover:text-primary">
                Contact
              </Link>
            </li>
            <li>
              <Link to="/privacy-policy" className="hover:text-primary">
                Privacy Policy
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-widest text-foreground">Visit</h3>
          <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
            <li className="flex gap-2.5">
              <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
              Kimathi Street, Nairobi CBD
            </li>
            <li className="flex gap-2.5">
              <Phone className="mt-0.5 size-4 shrink-0 text-primary" />
              +254 712 345 678
            </li>
            <li className="flex gap-2.5">
              <Instagram className="mt-0.5 size-4 shrink-0 text-primary" />
              @blazebites.ke
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border px-5 py-6 text-center text-xs text-muted-foreground lg:px-8">
        © {new Date().getFullYear()} BlazeBites Kenya. All prices in Kenya Shillings (KSh). M-PESA
        payment on this site is a simulation.
      </div>
    </footer>
  );
}
