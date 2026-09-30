import PlannerForm from "@/components/PlannerForm";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center bg-violet-50 font-sans dark:bg-[#150f29]">
      <main className="flex w-full max-w-2xl flex-1 flex-col gap-10 px-6 py-16 sm:px-10">
        <header className="flex flex-col gap-3">
          <h1 className="text-3xl font-semibold tracking-tight text-violet-950 dark:text-violet-50">
            klippa
          </h1>
          <p className="text-base leading-7 text-violet-900/70 dark:text-violet-200/70">
            Planera dina hårtvättdagar i förväg. Ställ in din rutin en gång,
            prenumerera på länken i Google Kalender eller Apple Kalender, så
            fortsätter den att lägga till tvättdagar automatiskt.
          </p>
        </header>
        <PlannerForm />
      </main>
    </div>
  );
}
