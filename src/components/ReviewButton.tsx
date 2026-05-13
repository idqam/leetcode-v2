"use client";

type Status = "done" | "overdue" | "today" | "upcoming";

const colours: Record<Status, string> = {
  done:     "bg-[#D4EDE3] text-[#4A8C6F] border-[#4A8C6F] dark:bg-[#1A3D2E] dark:text-[#5FAD8A] dark:border-[#5FAD8A]",
  overdue:  "bg-[#F5DADA] text-[#B54A4A] border-[#B54A4A] dark:bg-[#3D1A1A] dark:text-[#D46A6A] dark:border-[#D46A6A]",
  today:    "bg-[#FBF0D6] text-[#B8922A] border-[#B8922A] dark:bg-[#3D2E0A] dark:text-[#D4A843] dark:border-[#D4A843]",
  upcoming: "bg-[#E4E1D9] text-[#6B7F8E] border-[#D4CFC6] dark:bg-[#243040] dark:text-[#7A90A4] dark:border-[#2A3A4A]",
};

interface Props {
  slot: number;
  status: Status;
  onClick: () => void;
}

export function ReviewButton({ slot, status, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className={`text-xs font-medium px-2 py-0.5 rounded border ${colours[status]}`}
    >
      R{slot}
    </button>
  );
}
