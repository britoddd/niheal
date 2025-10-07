import { FaMagnifyingGlass } from "react-icons/fa6";

export default function SearchBox() {
  const style = "focus:outline-none";
  const searchStyle = { color: "gray", strokeWidth: 1 }
  return (
    <div className="flex flex-row items-center text-red border-1 rounded-full p-3 pl-5 pr-6 gap-3">
      <FaMagnifyingGlass style={searchStyle} />
      <input className={`${style}`} type="text" placeholder="Search"></input>
    </div>
  );
}
