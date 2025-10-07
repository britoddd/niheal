import Link from "next/link";
import Image from "next/image";
import SearchBox from "./searchbox";
import UserProfileNavigation from "./userProfileNavigation";

export default function Navbar() {
  return (
    <nav className="border-b-1 border-gray-200 bg-white sticky top-0 w-full p-1">
      <div className="xl:max-w-[80rem] m-5 sm:max-w-5/6 flex flex-row justify-between mx-auto">
        <a className="flex flex-row items-center gap-5" href="/">
          <Image src="/niheal_logo.png" width={30} height={0} />
          <span className="font-semibold text-3xl">niHeal</span>
        </a>
        <SearchBox />
        <div className="flex flex-row gap-10 items-center text-lg">
          <Link href="/community">Community</Link>
          <Link href="/resources">Resources</Link>
          <Link href="/contact">Contact</Link>
          <Link href="/link">Link</Link>
        </div>
        <UserProfileNavigation />
      </div>
    </nav>
  );
}
