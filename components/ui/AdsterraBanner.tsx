"use client";

import { useEffect, useRef } from "react";

interface AdsterraBannerProps {
  adKey: string;
  width: number;
  height: number;
}

export default function AdsterraBanner({ adKey, width, height }: AdsterraBannerProps) {
  const bannerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!bannerRef.current) return;
    bannerRef.current.innerHTML = "";

    const conf = document.createElement("script");
    conf.type = "text/javascript";
    conf.innerHTML = `
      atOptions = {
        'key' : '${adKey}',
        'format' : 'iframe',
        'height' : ${height},
        'width' : ${width},
        'params' : {}
      };
    `;

    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src = `//www.highperformanceformat.com/${adKey}/invoke.js`;

    bannerRef.current.appendChild(conf);
    bannerRef.current.appendChild(script);
  }, [adKey, width, height]);

  return (
    <div className="flex justify-center items-center my-4 overflow-hidden">
      <div ref={bannerRef} style={{ width: `${width}px`, height: `${height}px` }} />
    </div>
  );
}