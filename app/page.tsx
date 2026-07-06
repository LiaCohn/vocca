import { redirect } from "next/navigation";

import { HomeClient } from "@/app/home-client";
import { getAuthSession } from "@/auth";
import { listLists } from "@/data/list-store";
import { listWords } from "@/data/word-store";

export default async function HomePage() {
  const session = await getAuthSession();
  const ownerId = session?.user?.id;
  if (!ownerId) {
    redirect("/signin");
  }

  const [words, lists] = await Promise.all([listWords(ownerId), listLists(ownerId)]);

  return <HomeClient initialWords={words} initialLists={lists} />;
}
