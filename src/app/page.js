import { auth } from "@/auth";
import ChatSidebar from "./components/ChatSidebar";
import ChatWindow from "./components/ChatWindow";
import WithAuth from "./components/auth/WithAuth";

const Home = async () => {
  const session = await auth();
  return (
    <div className="flex h-screen">
      <ChatSidebar session={session} />
      <ChatWindow session={session} />
    </div>
  );
};

export default WithAuth(Home);
