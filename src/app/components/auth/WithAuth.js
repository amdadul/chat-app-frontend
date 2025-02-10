import { auth } from "@/auth";
import { redirect } from "next/navigation";

const WithAuth = (WrappedComponent) => {
  return async function AuthenticatedComponent(props) {
    const session = await auth();

    if (!session?.user) {
      redirect(`/login`);
    }

    // If authenticated, return the wrapped component
    return <WrappedComponent {...props} />;
  };
};

export default WithAuth;
