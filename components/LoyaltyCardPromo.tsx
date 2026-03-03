import Image from "next/image";
import Link from "next/link";
import React from "react";

const LoyaltyCardPromo = () => {
  return (
    <section className="my-8 md:my-10">
      <div className="relative overflow-hidden rounded-2xl border border-cyan-200/70 bg-gradient-to-r from-cyan-100 via-sky-100 to-cyan-50 shadow-[0_18px_50px_-30px_rgba(6,182,212,0.75)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.25),transparent_42%),radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.18),transparent_40%)]" />
        <div className="relative grid gap-5 md:grid-cols-[0.95fr,1.25fr] items-center p-5 md:p-8">
          <div className="space-y-3 md:space-y-4">
            <p className="inline-flex rounded-full border border-cyan-500/35 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-cyan-700">
              Carte Fidelite ZAYNA
            </p>
            <h2 className="text-2xl md:text-4xl font-extrabold leading-tight text-cyan-950">
              Demandez la carte et cumulez des avantages a chaque commande
            </h2>
            <p className="text-sm md:text-base text-cyan-900/90 leading-7 max-w-xl">
              Profitez d&apos;offres exclusives, de reductions reservees aux membres
              et d&apos;un suivi personnalise pour votre routine beaute et bien-etre.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Link
                href="/#contact"
                className="rounded-full bg-cyan-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-cyan-800 hoverEffect"
              >
                Demander ma carte
              </Link>
              <span className="rounded-full bg-white/75 px-4 py-2 text-xs md:text-sm font-medium text-cyan-800">
                Livraison rapide partout au Maroc
              </span>
            </div>
          </div>

          <div className="relative">
            <Image
              src="/carte-fideliteEEEEE.png"
              alt="Promotion carte fidelite ZAYNA"
              width={1600}
              height={900}
              className="h-64 w-full object-contain object-center md:h-[420px] lg:h-[500px]"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default LoyaltyCardPromo;
