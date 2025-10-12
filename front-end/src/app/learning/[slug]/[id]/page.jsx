"use client";

import { useState, useEffect } from "react";
import { fetchLearning } from "../../../../lib/learning";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

const SegmentPage = () => {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [currentSegment, setCurrentSegment] = useState(null);
  const [error, setError] = useState("");
  const params = useParams();
  const slug = params?.slug;
  const id = parseInt(params?.id) || 0;

  useEffect(() => {
    if (!slug) return;
    const fetchTest = async () => {
      try {
        const learning = await fetchLearning(slug);
        setData(learning);

        console.log("Full learning data:", learning);
        console.log("Content structure:", learning?.content);

        // Extract segments from content - try multiple possible structures
        let segments = [];

        if (
          learning?.content?.segments &&
          Array.isArray(learning.content.segments)
        ) {
          segments = learning.content.segments;
        } else if (Array.isArray(learning?.content)) {
          segments = learning.content;
        } else if (learning?.content) {
          // If content is a single object, treat it as one segment
          segments = [learning.content];
        }

        console.log("Processed segments:", segments);
        console.log(
          `Requesting segment ${id}, total segments: ${segments.length}`
        );

        if (id >= 0 && id < segments.length) {
          setCurrentSegment(segments[id]);
          console.log("Current segment:", segments[id]);
          setError("");
        } else {
          setError("Segment not found.");
        }
      } catch (err) {
        console.error("Error loading segment", err);
        setError("Unable to load learning material.");
        router.push("/dashboard");
      }
    };
    fetchTest();
  }, [slug, id, router]);

  // Renders a subsection (lowest level)
  const renderSubsection = (sub, index) => (
    <li key={sub.id || index} className="ml-6 mb-2">
      {sub.title && <strong>{sub.title}: </strong>}
      {sub.content && <span>{sub.content}</span>}

      {/* Subsection can have items (mini list) */}
      {sub.items && (
        <ul className="list-disc ml-6 mt-1">
          {sub.items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      )}

      {/* Subsection can have a video */}
      {sub.type === "video" && sub.content && (
        <div className="aspect-video bg-gray-100 rounded-lg mt-4">
          <iframe
            src={sub.content}
            className="w-full h-full rounded-lg"
            frameBorder="0"
            allowFullScreen
            title={sub.title || `video-${index}`}
          />
        </div>
      )}
    </li>
  );

  // Renders a section (can contain subsections or items)
  const renderSection = (section, index) => {
    if (!section) return null;

    return (
      <div key={section.id || index} className="mb-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          {section.title && (
            <h3 className="text-2xl font-semibold mb-4 text-gray-800">
              {section.title}
            </h3>
          )}

          {/* TEXT */}
          {section.type === "text" && section.content && (
            <p className="text-lg leading-relaxed text-gray-700 whitespace-pre-line">
              {section.content}
            </p>
          )}

          {/* LIST */}
          {section.type === "list" && (
            <div>
              {section.content && (
                <p className="text-gray-700 mb-3">{section.content}</p>
              )}

              {section.items && (
                <ul className="list-disc ml-6 space-y-1">
                  {section.items.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              )}

              {section.subsections && (
                <ul className="list-disc ml-4 mt-3">
                  {section.subsections.map((sub, i) =>
                    renderSubsection(sub, i)
                  )}
                </ul>
              )}

              {section.note && (
                <p className="mt-3 text-sm text-gray-500 italic">
                  {section.note}
                </p>
              )}
            </div>
          )}

          {/* VIDEO */}
          {section.type === "video" && section.content && (
            <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
              <iframe
                src={section.content}
                className="w-full h-full rounded-lg"
                frameBorder="0"
                allowFullScreen
                title={section.title || `video-${index}`}
              />
            </div>
          )}
        </div>
      </div>
    );
  };
  // Main content renderer for the segment
  const renderSegmentContent = (segment) => {
    if (!segment) return null;

    if (segment.sections && Array.isArray(segment.sections)) {
      return (
        <div className="space-y-6">
          {segment.sections.map((section, i) => renderSection(section, i))}
        </div>
      );
    }

    // Fallbacks for older formats
    if (Array.isArray(segment)) {
      return (
        <div className="space-y-6">
          {segment.map((section, i) => renderSection(section, i))}
        </div>
      );
    }

    if (typeof segment === "string") {
      return (
        <p className="text-gray-700 text-lg whitespace-pre-line">{segment}</p>
      );
    }

    return null;
  };

  // Calculate total segments using the same logic as in useEffect
  const totalSegments = (() => {
    if (!data?.content) return 0;
    if (data.content.segments && Array.isArray(data.content.segments)) {
      return data.content.segments.length;
    } else if (Array.isArray(data.content)) {
      return data.content.length;
    } else {
      return 1; // Single content object
    }
  })();
  const hasNext = id < totalSegments - 1;
  const hasPrev = id > 0;

  return (
    <div className="w-full bg-[url(/login_bg.png)] bg-cover bg-center min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="flex w-full mb-8 justify-between items-center bg-white/90 backdrop-blur-sm rounded-lg p-4 shadow-sm">
          <Link href={`/learning/${slug}`}>
            <p className="hover:text-gray-600 text-gray-800 font-medium">
              &#60; Back to Overview
            </p>
          </Link>
          <div className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
            Page {id + 1} of {totalSegments}
          </div>
        </div>

        {!data && !error && (
          <div className="bg-white/90 backdrop-blur-sm rounded-lg p-8 text-center">
            <p className="text-gray-500">Loading...</p>
          </div>
        )}

        {error && (
          <div className="bg-white/90 backdrop-blur-sm rounded-lg p-8 text-center">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {data && (
          <>
            <div className="bg-white/90 backdrop-blur-sm rounded-lg p-6 mb-6 shadow-sm border-1">
              <h1 className="text-3xl font-bold mb-2 text-gray-800">
                {data.title}
              </h1>
              <p className="text-gray-600">Chapter {id + 1}</p>
            </div>

            <div className="space-y-0">
              {renderSegmentContent(currentSegment)}
            </div>
          </>
        )}

        {/* Navigation */}
        {data && totalSegments > 1 && (
          <div className="bg-white/90 backdrop-blur-sm rounded-lg p-6 mt-8 shadow-sm">
            <div className="flex justify-between items-center">
              <div>
                {hasPrev ? (
                  <Link href={`/learning/${slug}/${id - 1}`}>
                    <button className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors font-medium">
                      &#60; Previous Chapter
                    </button>
                  </Link>
                ) : (
                  <div className="w-32"></div>
                )}
              </div>

              <div className="flex space-x-2">
                {Array.from({ length: totalSegments }, (_, i) => (
                  <Link key={i} href={`/learning/${slug}/${i}`}>
                    <button
                      className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                        i === id
                          ? "bg-blue-500 text-white shadow-md"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {i + 1}
                    </button>
                  </Link>
                ))}
              </div>

              <div>
                {hasNext ? (
                  <Link href={`/learning/${slug}/${id + 1}`}>
                    <button className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors font-medium">
                      Next Chapter &#62;
                    </button>
                  </Link>
                ) : (
                  <div className="w-32"></div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SegmentPage;
