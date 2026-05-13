const colours = {
  Easy:   "bg-[#D4EDE3] text-[#4A8C6F] dark:bg-[#1A3D2E] dark:text-[#5FAD8A]",
  Medium: "bg-[#FBF0D6] text-[#B8922A] dark:bg-[#3D2E0A] dark:text-[#D4A843]",
  Hard:   "bg-[#F5DADA] text-[#B54A4A] dark:bg-[#3D1A1A] dark:text-[#D46A6A]",
};

export function DifficultyBadge({ difficulty }: { difficulty: string }) {
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded ${colours[difficulty as keyof typeof colours] ?? "bg-[#E4E1D9] text-[#6B7F8E]"}`}>
      {difficulty}
    </span>
  );
}
