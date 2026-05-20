import { Suspense } from "react";

import { LoginForm } from "@/components/auth/LoginForm";

import { createMetadata } from "@/lib/seo";



export const metadata = createMetadata({

  title: "Sign In",

  path: "/login",

  noIndex: true,

});



export default function LoginPage() {

  const showGoogleAuth = Boolean(

    process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET

  );



  return (

    <Suspense>

      <LoginForm showGoogleAuth={showGoogleAuth} />

    </Suspense>

  );

}

