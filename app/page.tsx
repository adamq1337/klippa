import PlannerForm from "@/components/PlannerForm";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center bg-background font-sans">
      <main className="flex w-full max-w-2xl flex-1 flex-col gap-10 px-6 py-16 sm:px-10">
        <header className="flex flex-col gap-3 border-b border-card-border/30 pb-8">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Hairday Planner
	    </h1>
		<h2 className=""text-1xl font-semibold tracking-tight text-foreground">
			by Klippa
			</h2>
          <p className="text-base leading-7 text-muted">
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
