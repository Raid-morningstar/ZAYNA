import Container from "@/components/Container";
import Title from "@/components/Title";
import React from "react";

const missionPoints = [
  "Des produits fiables et certifies",
  "Des conseils clairs et adaptes a vos besoins",
  "Une plateforme intuitive et moderne",
  "Un service client reactif et proche de vous",
];

const whyChoosePoints = [
  {
    title: "Authenticite garantie",
    description:
      "Tous nos produits proviennent de laboratoires certifies et de fournisseurs agrees.",
  },
  {
    title: "Large choix de produits",
    description:
      "Soins visage, corps, cheveux, hygiene, complements alimentaires, bebe, solaire et plus encore.",
  },
  {
    title: "Livraison rapide au Maroc",
    description:
      "Commandez en quelques clics et recevez vos produits rapidement, ou que vous soyez.",
  },
  {
    title: "Paiement securise et flexible",
    description:
      "Paiement a la livraison, paiement en ligne securise et avantages membres fideles.",
  },
  {
    title: "Programme de fidelite",
    description:
      "Cumulez des points et profitez de reductions exclusives avec la carte fidelite ZAYNA.",
  },
  {
    title: "Qualite et prix justes",
    description:
      "Nous selectionnons des references de qualite avec un excellent rapport qualite/prix.",
  },
];

const AboutPage = () => {
  return (
    <div className="bg-gradient-to-b from-shop_light_bg to-white py-10 md:py-14">
      <Container>
        <div className="max-w-6xl mx-auto space-y-8">
          <section className="relative overflow-hidden rounded-2xl border border-shop_light_green/30 bg-white p-6 md:p-9 shadow-sm">
            <div className="pointer-events-none absolute -top-16 -right-16 h-44 w-44 rounded-full bg-shop_light_green/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -left-16 h-52 w-52 rounded-full bg-shop_dark_green/10 blur-3xl" />
            <p className="relative text-xs font-semibold tracking-[0.2em] uppercase text-shop_dark_green">
              A propos de nous
            </p>
            <Title className="relative mt-2 text-2xl md:text-4xl font-bold">
              ZAYNA, votre parapharmacie digitale au Maroc
            </Title>
            <p className="relative mt-4 text-sm md:text-base text-gray-700 leading-7 max-w-4xl">
              ZAYNA est une parapharmacie en ligne basee au Maroc, dediee a
              votre beaute, votre sante et votre bien-etre au quotidien. Nous
              proposons une selection rigoureuse de produits authentiques issus
              de grandes marques reconnues.
            </p>
            <p className="relative mt-4 text-sm md:text-base text-gray-700 leading-7 max-w-4xl">
              Pensee et developpee par des professionnels passionnes par la
              sante et le digital, ZAYNA allie expertise pharmaceutique et
              technologie moderne pour offrir une experience d&apos;achat simple,
              rapide et securisee.
            </p>
          </section>

          <section className="grid gap-5 lg:grid-cols-2">
            <div className="rounded-2xl border border-shop_light_green/20 bg-white p-6 md:p-7">
              <h2 className="text-xl md:text-2xl font-bold text-darkColor">
                Notre mission
              </h2>
              <p className="mt-3 text-sm md:text-base text-gray-700 leading-7">
                Faciliter l&apos;acces aux meilleurs produits de parapharmacie au
                Maroc avec une approche fiable, claire et proche de vos besoins.
              </p>
              <ul className="mt-4 space-y-2.5 text-sm md:text-base text-gray-700">
                {missionPoints.map((point) => (
                  <li key={point} className="flex items-start gap-2.5">
                    <span className="mt-1 h-2 w-2 rounded-full bg-shop_dark_green shrink-0" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-shop_light_green/20 bg-shop_light_green/10 p-6 md:p-7">
              <h2 className="text-xl md:text-2xl font-bold text-darkColor">
                Une parapharmacie pensee pour vous
              </h2>
              <p className="mt-3 text-sm md:text-base text-gray-700 leading-7">
                Chez ZAYNA, nous croyons que chacun merite un acces simple et
                equitable a des soins de qualite. Que ce soit pour une routine
                beaute, un besoin specifique ou une prevention quotidienne,
                notre application est concue pour repondre a vos exigences avec
                modernite et confiance.
              </p>
              <p className="mt-4 text-sm md:text-base text-gray-700 leading-7">
                Rejoignez la communaute ZAYNA et profitez d&apos;une experience
                d&apos;achat securisee, de produits authentiques et d&apos;un
                accompagnement professionnel a chaque etape.
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl md:text-3xl font-bold text-darkColor">
              Pourquoi choisir ZAYNA ?
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {whyChoosePoints.map((item) => (
                <article
                  key={item.title}
                  className="h-full rounded-2xl border border-shop_light_green/20 bg-white p-5 shadow-[0_10px_30px_-22px_rgba(16,185,129,0.7)]"
                >
                  <h3 className="text-base md:text-lg font-semibold text-darkColor">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm text-gray-700 leading-6">
                    {item.description}
                  </p>
                </article>
              ))}
            </div>
          </section>
        </div>
      </Container>
    </div>
  );
};

export default AboutPage;
