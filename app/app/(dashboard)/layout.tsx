import { ReactNode, Suspense } from "react";
import Profile from "@/components/profile";
import Nav from "@/components/nav";
import { SessionProvider, useSession } from "next-auth/react";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <div>
        <Nav>
          <Suspense fallback={<div>Loading...</div>}>
            <Profile />
          </Suspense>
        </Nav>
        <div className="min-h-screen sm:pl-60 dark:bg-black">{children}</div>
      </div>
    </SessionProvider>
  );
}
