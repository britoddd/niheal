import Image from "next/image";
import { AiFillCaretDown, AiFillCaretUp } from "react-icons/ai";

export default function Container({ title, description, source, isStart }) {
  return (
    <div className="p-7 pl-10 pr-10 border-gray-200 border-1 flex flex-row gap-8 rounded-2xl w-full max-w-[1024px] shadow-md justify-between hover:bg-blue-50 bg-gray-50">
      <div>
        <Image src={source} alt="image" width={100} height={100} />
      </div>
      <div className="flex flex-col gap-1 w-full justify-center items-left">
        <h2 className="text-2xl font-bold">{title}</h2>
        <p>{description}</p>
      </div>
      <div className="flex flex-col justify-center items-center pb-2">
        {isStart ? <AiFillCaretUp className="text-md" /> : <AiFillCaretDown className="text-md" />}
      </div>
    </div>
  );
}
