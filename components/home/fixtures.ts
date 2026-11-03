export type LandingIconKey =
  | "search"
  | "crown"
  | "userCheck"
  | "graduationCap"
  | "smartphone"
  | "users"
  | "filter"
  | "messageCircle"
  | "handshake"
  | "userRound"
  | "shieldCheck"
  | "wallet"
  | "badgeCheck"
  | "mail"
  | "briefcase";

export type LandingStep = {
  step: number;
  title: string;
  body: string;
  icon: LandingIconKey;
};

export type LandingBullet = {
  title: string;
  body: string;
  icon: LandingIconKey;
};

export type LandingTeamMember = {
  name: string;
  role: string;
  imageSrc: string;
  icon: LandingIconKey;
};

export const landingStepsFixture: LandingStep[] = [
  {
    step: 1,
    title: "Explorer nos offres et rejoindre notre canal WhatsApp gratuitement",
    body: "Laissez-vous convaincre en une minute.",
    icon: "search",
  },
  {
    step: 2,
    title:
      "Pour le prix d’un tacos, devenez un membre premium et investissez dans votre carrière.",
    body: "Offres personnalisées envoyées directement dans votre DM WhatsApp.",
    icon: "crown",
  },
  {
    step: 3,
    title: "Recevez des offres customisées à VOTRE profil.",
    body: "Seulement les postes qui correspondent à vos critères, en DM WhatsApp.",
    icon: "userCheck",
  },
];

export const landingProblemTitle =
  "Pourquoi ton premier emploi te fuit encore ?";

export const landingProblemLead =
  "On va être francs : ce n’est presque jamais « la chance ». En Afrique de l’Ouest, le vrai frein, c’est souvent l’info — ou le réseau — qui n’arrive jamais jusqu’à toi. On a listé les excuses classiques. Choisis la tienne (on a déjà la réponse).";

export const landingProblemItemsFixture: LandingBullet[] = [
  {
    title: "J’ai pas le bon diplôme ou de compétences ?",
    body: "Peut-être. Ou peut-être que tu postules aux mauvaises offres pendant que les bonnes passent dans le WhatsApp de quelqu’un d’autre. Le marché ne manque pas de postes — il manque de filtres. Nous, on filtre.",
    icon: "graduationCap",
  },
  {
    title: "J’ai pas le courage ?",
    body: "Scroll Facebook trois heures, puis « je cherche un taf ». On te jugera pas. On te dira juste : arrête de chercher. Laisse les offres te trouver. Une minute pour comprendre. Le reste, c’est nous.",
    icon: "smartphone",
  },
  {
    title: "Je ne connais pas le bon tonton ?",
    body: "Exact. Et c’est là que 90 % des gens bloquent. Le « bon tonton », c’est celui qui voit l’offre avant tout le monde. Spoiler : on a déjà ses contacts. Tu n’as plus besoin de le connaître — tu as besoin de nous.",
    icon: "users",
  },
];

export const landingSolutionTitle = "On a la solution. (Oui, vraiment.)";

export const landingSolutionLead =
  "Pas de séminaire motivation. Pas de PDF de 40 pages. Trois choses qui marchent — le reste, c’est du bruit.";

export const landingSolutionItemsFixture: LandingBullet[] = [
  {
    title: "Filtre",
    body: "On ne te balance pas tout le catalogue en vrac. On trie. Experts, expérience, diplômes, lieu : seulement ce qui matche ton profil. Moins de bruit, plus de chances. C’est ça, maximiser ton année.",
    icon: "filter",
  },
  {
    title: "Recevez des DM des offres pour ne plus avoir à chercher",
    body: "Vous n’aurez plus besoin de discipline, juste de regarder et d’ouvrir votre WhatsApp pour faire avancer votre carrière.",
    icon: "messageCircle",
  },
  {
    title: "Nous, on connaît les bons tontons",
    body: "Le réseau, c’est notre métier. Les canaux publics gratuits pour te convaincre en une minute. Le premium pour les DM customisés. Toi, tu n’as pas besoin de connaître tout Bamako / Abidjan / Dakar — tu as besoin d’être dans la bonne boîte de réception. La nôtre.",
    icon: "handshake",
  },
];

export const landingTeamTitle = "On n’est pas une boîte anonyme derrière un logo.";

export const landingTeamLead =
  "Qui sommes-nous ? On ne vend pas du rêve LinkedIn importé. On vend des offres qui existent, filtrées, livrées sur WhatsApp. Faites-nous confiance pour maximiser ce qu’il vous reste de cette année.";

export const landingTeamMembersFixture: LandingTeamMember[] = [
  {
    name: "Allassane",
    role: "Développeur Full Stack, spécialisé dans le développement web et mobile.",
    imageSrc: "/images/team/allassane.png",
    icon: "userRound",
  },
  {
    name: "Mahamane",
    role: "Ingénieur en génie civil.",
    imageSrc: "/images/team/mahamane.png",
    icon: "userRound",
  },
];

export const landingGuaranteeTitle =
  "Garantie remboursée 30 jours. Sans question.";

export const landingGuaranteeBodyBefore =
  "On est tellement convaincus que si ça ne te va pas, tu es remboursé. Trente jours. Pas de débat, pas de « explique-nous pourquoi ». Tu remplis le";

export const landingGuaranteeBodyAfter =
  "avec ton numéro de téléphone payeur — et c’est réglé. On peut se permettre d’être arrogants sur la qualité : on a mis l’argent là où est la bouche.";

export const landingPlanTitle =
  "Le plan. Simple. Clair. Moins cher qu’un tacos douteux.";

export const landingPlanLead =
  "Un seul chemin premium. Pas six formules pour te perdre. Orange Money ou Moov, tu crédites, tu actives, les DM commencent.";

export const landingPlanClosing =
  "Tu peux continuer à « chercher ». Ou tu peux rejoindre ceux qui reçoivent déjà. On sait lequel des deux aura un emploi cette année.";
