interface Benefit {
  id: number;
  benefit_title: string | null;
  description: string;
}

interface Props {
  title: string;
  benefits: Benefit[];
}

export function SponsorshipBenefitsList({ title, benefits }: Props) {
  if (benefits.length === 0) return null;

  return (
    <div>
      <h3 className="text-lg font-bold text-indigo-950">{title}</h3>
      <ul className="mt-3 space-y-2">
        {benefits.map((benefit) => (
          <li key={benefit.id} className="flex gap-2 text-indigo-950/80">
            <span className="text-fuchsia-600">&#10003;</span>
            <span>{benefit.benefit_title || benefit.description}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
