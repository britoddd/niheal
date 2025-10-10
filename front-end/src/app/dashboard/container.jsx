import Image from "next/image";

export default function Container({ title, description, source }) {
  return (
    <div className="p-7 border-gray-200 border-1 flex flex-row gap-8 rounded-2xl w-full max-w-[1024px] shadow-md">
      <div>
        <Image src={source} alt="image" width={100} height={100} />
      </div>
      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-bold">{title}</h2>
        <p>{description}</p>
        <button className="bg-gray-100 pl-5 pb-1 pr-5 pt-1 rounded-sm w-fit">Mulai</button>
      </div>
    </div>
  );
}
