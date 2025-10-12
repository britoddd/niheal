export default function LearnText(title, material) {
  return (
    <div className="flex flex-col justify-center items-center min-h-screen p-8 sm:p-20 bg-gray-100 bg-[url(/login_bg.png)] bg-cover bg-center">
      <h1 className="text-4xl">{title}</h1>
      <p className="">{material}</p>
    </div>
  );
}
