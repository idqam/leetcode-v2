import Link from "next/link";

export const metadata = { title: "LeetCode Tracker" };

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F7F5F0] to-[#EDEAE3] dark:from-[#0F1419] dark:to-[#0A0F14]">
      <nav className="max-w-5xl mx-auto px-8 py-6 flex justify-between items-center">
        <div className="font-bold text-[15px] tracking-tight text-[#1C2B3A] dark:text-[#E8EDF2]">
          LeetCode Tracker<span className="text-[#4A8C6F]">.</span>
        </div>
        <Link
          href="/login"
          className="border border-[#D4CFC6] dark:border-[#2A3A4A] bg-[#F7F5F0] dark:bg-[#1A2230] text-[#1C2B3A] dark:text-[#E8EDF2] px-4 py-1.5 rounded-lg text-[13px] font-medium hover:bg-[#EDEAE3] dark:hover:bg-[#243040] transition-colors"
        >
          Sign in
        </Link>
      </nav>

      <section className="max-w-2xl mx-auto px-8 mt-20 text-center">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#4A8C6F] bg-[#D4EDE3] dark:bg-[#1A3D2E] dark:text-[#5FAD8A] px-3 py-1 rounded-full mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-[#4A8C6F] dark:bg-[#5FAD8A]" />
          Built for focus
        </span>

        <h1
          className="text-[56px] leading-[1.1] tracking-tight text-[#1C2B3A] dark:text-[#E8EDF2] mb-6"
          style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontWeight: 400 }}
        >
          Track problems.
          <br />
          <em className="italic text-[#3D7EAA] dark:text-[#5B9EC9]">Build memory.</em>
        </h1>

        <p className="text-[18px] leading-[1.6] text-[#6B7F8E] max-w-[480px] mx-auto mb-10">
          A spaced repetition system for solving LeetCode well —
          so the patterns actually stick.
        </p>

        <div className="flex justify-center mb-20">
          <Link
            href="/signup"
            className="bg-[#3D7EAA] hover:bg-[#2E6A94] text-white px-6 py-3 rounded-[10px] text-sm font-medium transition-colors"
          >
            Get started →
          </Link>
        </div>
      </section>

      <section id="how-it-works" className="max-w-3xl mx-auto px-8 pb-20 grid grid-cols-3 gap-6">
        <Feature
          icon="◐"
          iconBg="bg-[#D4EDE3] dark:bg-[#1A3D2E]"
          iconColor="text-[#4A8C6F] dark:text-[#5FAD8A]"
          title="Spaced reviews"
          body="Schedule the next review based on how well you recalled the solution."
        />
        <Feature
          icon="⊞"
          iconBg="bg-[#D6E8F5] dark:bg-[#1E3A52]"
          iconColor="text-[#3D7EAA] dark:text-[#5B9EC9]"
          title="Pattern library"
          body="Group problems by algorithmic pattern with reusable code templates."
        />
        <Feature
          icon="◇"
          iconBg="bg-[#FBF0D6] dark:bg-[#3D2E0A]"
          iconColor="text-[#B8922A] dark:text-[#D4A843]"
          title="Progress view"
          body="See your activity at a glance — every month, every difficulty."
        />
      </section>

      <section className="max-w-[540px] mx-auto px-8 mb-16">
        <div className="bg-[#EDEAE3] dark:bg-[#1A2230] border border-[#D4CFC6] dark:border-[#2A3A4A] rounded-2xl p-7 text-center">
          <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#4A8C6F] dark:text-[#5FAD8A] mb-2.5">
            A small note
          </div>
          <h4
            className="text-[18px] italic text-[#1C2B3A] dark:text-[#E8EDF2] mb-2"
            style={{ fontFamily: "Georgia, serif", fontWeight: 400 }}
          >
            This isn&apos;t a product.
          </h4>
          <p className="text-[13px] leading-[1.6] text-[#6B7F8E] mb-4">
            It&apos;s a tool I built for my own studying and put online in case it helps someone else.
            There&apos;s no team, no pricing tier, no roadmap.
            If you find it useful and want to chip in, that means a lot.
          </p>
          <a
            href="https://www.buymeacoffee.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-[#F7F5F0] dark:bg-[#243040] text-[#1C2B3A] dark:text-[#E8EDF2] border border-[#D4CFC6] dark:border-[#2A3A4A] px-4 py-2 rounded-lg text-[13px] font-medium hover:bg-[#FBF0D6] dark:hover:bg-[#3D2E0A] transition-colors"
          >
            ☕ Buy me a coffee
          </a>
        </div>
      </section>

      <footer className="text-center pb-8 text-xs text-[#6B7F8E]">
        Made with care ·{" "}
        <a href="#" className="underline hover:text-[#1C2B3A] dark:hover:text-[#E8EDF2]">
          GitHub
        </a>
      </footer>
    </div>
  );
}

function Feature({
  icon,
  iconBg,
  iconColor,
  title,
  body,
}: {
  icon: string;
  iconBg: string;
  iconColor: string;
  title: string;
  body: string;
}) {
  return (
    <div>
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-3 text-sm ${iconBg} ${iconColor}`}>
        {icon}
      </div>
      <h3 className="text-sm font-semibold text-[#1C2B3A] dark:text-[#E8EDF2] mb-1.5">{title}</h3>
      <p className="text-[13px] leading-[1.5] text-[#6B7F8E]">{body}</p>
    </div>
  );
}
