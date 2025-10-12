'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FaRegUserCircle } from 'react-icons/fa';

const Index = () => {
  return (
    <section className="flex flex-col justify-center items-center min-h-screen p-8 sm:p-20 bg-gray-100 bg-[url(/login_bg.png)] bg-cover bg-center">
      <div className="flex flex-col items-center text-center pb-6 w-full">
        <FaRegUserCircle className="text-[100px] text-gray-700 mb-4" />
      </div>

      <h1 className="text-4xl font-bold mb-10">Welcome to NiHeal</h1>

      <div className="flex flex-col items-center justify-center bg-white p-10 rounded-3xl w-[400px] shadow-lg gap-5">
        <p className="text-gray-600 mb-3 text-center">
          Edukasi.Deteksi.Aksi.
        </p>

        <Link
          href="/login"
          className="bg-blue-600 text-white px-6 py-3 rounded-xl w-full text-center hover:bg-blue-700 transition"
        >
          Login
        </Link>

        <Link
          href="/register"
          className="bg-gray-100 text-gray-800 px-6 py-3 rounded-xl w-full text-center hover:bg-gray-200 transition"
        >
          Register
        </Link>

        <div className="mt-6 text-sm text-gray-500">
          <p>{new Date().getFullYear()} by "Ad Maiorem Dei Gloriam"</p>
        </div>
      </div>
    </section>
  );
};

export default Index;
