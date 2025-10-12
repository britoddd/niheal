"use client";

import { useState, useEffect } from "react";
import { apiCall } from "../../../lib/api";
import { fetchLearning } from "../../../lib/learning";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

const LearningPage = () => {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const params = useParams();
  const slug = params?.slug;
  const id = params?.id;

  useEffect(() => {
    if (!slug) return;
    const fetchTest = async () => {
      try {
        const learning = await fetchLearning(slug);
        setData(learning);
        setError("");
      } catch (err) {
        console.error("Error loading test", err);
        setError("Unable to load learning material.");
        router.push("/dashboard");
      }
    };
    fetchTest();
  }, [slug, router]);

  console.log(data);

  const renderSegmentList = (content) => {
    if (content == null) return null;
    
    // Handle object with segments array
    if (typeof content === "object" && Array.isArray(content.segments)) {
      const segments = content.segments;
      if (segments.length === 0) {
        return <p className="text-gray-500">No segments available.</p>;
      }
      
      return (
        <div className="space-y-4">
          <p className="text-gray-600 mb-4">
            This learning material has {segments.length} segment{segments.length !== 1 ? 's' : ''}.
          </p>
          <div className="space-y-2">
            {segments.map((segment, idx) => {
              // Get preview text from segment
              let previewText = "";
              let segmentCount = 0;
              
              if (typeof segment === "string") {
                previewText = segment.slice(0, 100);
              } else if (segment.segments && Array.isArray(segment.segments)) {
                // Handle nested segments
                segmentCount = segment.segments.length;
                const types = segment.segments.map(s => s.type || 'content').filter(Boolean);
                const uniqueTypes = [...new Set(types)];
                previewText = `Contains ${segmentCount} sections: ${uniqueTypes.join(', ')}`;
              } else if (segment.text) {
                previewText = segment.text.slice(0, 100);
              } else if (segment.title) {
                previewText = segment.title;
              } else {
                previewText = `Chapter ${idx + 1}`;
              }
              
              return (
                <Link key={idx} href={`/learning/${slug}/${idx}`}>
                  <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 hover:border-gray-300 cursor-pointer transition-colors mt-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-medium text-lg mb-1">
                          Chapter {idx + 1}
                        </h3>
                        <p className="text-gray-600 text-sm line-clamp-2">
                          {previewText}
                          {previewText.length >= 100 && !segmentCount ? "..." : ""}
                        </p>
                        {segmentCount > 0 && (
                          <div className="flex gap-1 mt-2">
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                              {segmentCount} sections
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="ml-4 text-gray-400">
                        &#62;
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
          
          <div className="mt-6 pt-4 border-t">
            <Link href={`/learning/${slug}/0`}>
              <button className="w-full bg-blue-500 text-white py-3 px-4 rounded-lg hover:bg-blue-600 transition-colors">
                Start Reading (Page 1)
              </button>
            </Link>
          </div>
        </div>
      );
    }
    
    // Fallback for non-segment content
    if (typeof content === "string") {
      return <p className="mb-8 whitespace-pre-line">{content}</p>;
    }
    
    return (
      <pre className="mb-8 text-sm bg-gray-50 p-3 rounded overflow-auto">
        {JSON.stringify(content, null, 2)}
      </pre>
    );
  };

  return (
    <div className="w-full flex justify-center items-center bg-[url(/login_bg.png)] bg-cover bg-center min-h-screen py-8">
      <div className="p-8 flex justify-center flex-col items-center w-full max-w-[600px]">
        <div className="flex w-full mb-10">
          <Link href={"/dashboard"}>
            <p className="hover:text-gray-400">&#60; Go Back to Dashboard</p>
          </Link>
        </div>
        <div className="bg-white p-8 rounded border-1 border-gray-100 shadow-md w-full">
          {!data && !error && <p className="text-gray-500">Loading...</p>}
          {error && <p className="text-red-600 mb-2">{error}</p>}
          {data && (
            <>
              <h1 className="text-4xl font-bold mt-4 mb-2">{data.title}</h1>
              {renderSegmentList(data.content)}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LearningPage;
