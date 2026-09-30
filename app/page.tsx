import PlannerForm from "@/components/PlannerForm";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex w-full max-w-2xl flex-1 flex-col gap-10 px-6 py-16 sm:px-10">
        <header className="flex flex-col gap-3">
          <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
            klippa
          </h1>
          <p className="text-base leading-7 text-zinc-600 dark:text-zinc-400">
            Plan your hair-wash days ahead of time. Set your routine once,
            subscribe the link in Google or Apple Calendar, and it keeps
            projecting wash days into the future automatically.
          </p>
        </header>
        <PlannerForm />
      </main>
    </div>
  );
}
